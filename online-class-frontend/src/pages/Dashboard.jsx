import { useEffect, useState, useCallback } from "react";
import api, { SECTION_LIST } from "../api/client";
import FolderCard from "../components/FolderCard.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import EducationLogo from "../components/EducationLogo.jsx";
import DashboardReviewSection from "../components/DashboardReviewSection.jsx";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function Dashboard() {
  const { user, isAuthed, paid } = useUserAuth();
  const { allSections } = useSiteSettings();

  const sections = allSections && allSections.length > 0 ? allSections : SECTION_LIST;

  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_dashboard_data");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("oc_cache_dashboard_data");
    } catch {
      return true;
    }
  });

  const [hoveredKey, setHoveredKey] = useState(null);
  const [error, setError] = useState(null);
  const [dashboardLogo, setDashboardLogo] = useState(() => {
    try {
      return sessionStorage.getItem("oc_cache_dashboard_logo") || null;
    } catch {
      return null;
    }
  });

  const loadData = useCallback(() => {
    let cancelled = false;

    Promise.allSettled(
      sections.map((s) => {
        if (s.key === "lecture_material") {
          return api.get("/concepts");
        }
        if (s.key === "career_pathways") {
          return api.get("/career-pathways");
        }
        return api.get(`/sections/${s.key}`);
      })
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      const unavailable = [];
      results.forEach((res, i) => {
        next[sections[i].key] = res.status === "fulfilled" ? res.value.data.data : [];
        if (res.status === "rejected") unavailable.push(sections[i].title);
      });
      setData(next);
      setError(unavailable.length ? `Some classroom areas could not be refreshed: ${unavailable.join(", ")}.` : null);
      setLoading(false);
      try {
        sessionStorage.setItem("oc_cache_dashboard_data", JSON.stringify(next));
      } catch {}
    });

    return () => {
      cancelled = true;
    };
  }, [sections]);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/welcome-screen")
      .then((res) => {
        if (!cancelled && res.data?.dashboard_logo_url) {
          setDashboardLogo(res.data.dashboard_logo_url);
          try {
            sessionStorage.setItem("oc_cache_dashboard_logo", res.data.dashboard_logo_url);
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalItems = Object.values(data).reduce((acc, curr) => acc + (curr?.length || 0), 0);

  return (
    <div className="oc-dashboard-page-root oc-curriculum-wrapper position-relative">
      {/* Background Watermark Logo across entire dashboard page - identical to Curriculum Page */}
      <PageBackgroundLogo
        variant="global"
        className="oc-curriculum-bg-logo"
        opacity={0.18}
        size="min(860px, 88vw)"
      />

      {/* Dashboard Hero Header */}
      <header className="oc-curriculum-header oc-dashboard-header-3d position-relative overflow-hidden">
        {/* Ambient Header Background Logo - identical to Curriculum Page */}
        <PageBackgroundLogo
          variant="header"
          className="oc-curriculum-header-logo-bg"
          opacity={0.26}
          size="min(560px, 58vw)"
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div className="oc-eyebrow text-mono">
              <i className="bi bi-calendar3" /> {today}
            </div>
            {isAuthed && (
              <span className="oc-navbar-user" style={{ background: "rgba(255,255,255,0.12)" }}>
                <i className="bi bi-person-circle" />
                <span>{user?.name}</span>
                {paid && (
                  <span className="oc-pay-badge paid" style={{ fontSize: "0.68rem" }}>
                    <i className="bi bi-check-circle-fill" /> All Classes Unlocked
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Dashboard Title with Logo - Big & Bold */}
          <div className="d-flex align-items-center gap-3 mt-2 mb-2">
            <EducationLogo
              size={64}
              style={{
                borderRadius: "14px",
                boxShadow: "0 10px 28px rgba(0, 0, 0, 0.45)",
                border: "2px solid rgba(255, 255, 255, 0.28)",
              }}
            />
            <div>
              <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 2.8rem)", margin: 0, color: "#ffffff", fontWeight: 800 }}>
                Main Dashboard
              </h1>
            </div>
          </div>

          <p className="mb-0" style={{ color: "rgba(255,255,255,.9)", maxWidth: 720, fontSize: "1.02rem", lineHeight: 1.55 }}>
            Everything your instructor has posted &mdash; curriculum modules, career pathways, interview preparation guides, live online classes, study suggestions,
            proxy support, and student registrations &mdash; organized into interactive workspaces.
          </p>

          <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
            <span className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm fw-semibold" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-folder2-open me-1 text-primary" /> {sections.length} Active Sections
            </span>
            <span className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm fw-semibold" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-files me-1 text-info" /> {loading ? "Counting..." : `${totalItems} Total Resources`}
            </span>
            <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm fw-semibold" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-briefcase-fill me-1" /> Interview Preparation Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Cards Grid with Crisp Clear Text */}
      <main className="container py-5 oc-dashboard-main-3d position-relative" style={{ zIndex: 1, background: "transparent" }}>
        {error && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3 mb-4" role="alert">
            <span><i className="bi bi-exclamation-circle me-2" />{error}</span>
            <button type="button" className="btn btn-sm btn-outline-dark flex-shrink-0" onClick={loadData}>Try again</button>
          </div>
        )}
        <div className="row g-4 pt-2 oc-dashboard-grid">
          {sections.map((s) => (
            <div className="col-12 col-md-6 col-lg-4 col-oc-folder" key={s.key}>
              <FolderCard
                section={s}
                items={data[s.key] || []}
                loading={loading}
                hovered={hoveredKey === s.key}
                onHoverStart={() => setHoveredKey(s.key)}
                onHoverEnd={() => setHoveredKey((current) => (current === s.key ? null : current))}
              />
            </div>
          ))}
        </div>

        {/* Student Review & Ratings Section (Available from Main Dashboard only after login) */}
        {isAuthed && (
          <div className="mt-5 pt-3">
            <DashboardReviewSection />
          </div>
        )}
      </main>
    </div>
  );
}
