import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import EducationLogo from "./EducationLogo.jsx";
import PageBackgroundLogo from "./PageBackgroundLogo.jsx";
import { fetchSiteSettings } from "../api/client";

export default function AppShell() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState({
    social_youtube: "https://youtube.com",
    social_github: "https://github.com",
    social_twitter: "https://x.com",
    social_linkedin: "https://linkedin.com",
    help_email: "support@onlineclass.edu",
    help_phone: "+91 98765 43210",
    help_address: "Academic Engineering Labs, Block C",
    help_description: "All educational documents and video lectures are delivered with real-time DRM protection and anti-extraction mechanisms.",
  });

  useEffect(() => {
    fetchSiteSettings()
      .then((res) => {
        if (res.data?.data) {
          setSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="oc-app-shell d-flex flex-column min-vh-100 position-relative">
      {/* Global Background Logo Watermark across Every Page */}
      <PageBackgroundLogo variant="global" />
      <Navbar />
      <main className="flex-grow-1 position-relative" style={{ zIndex: 1 }}>
        <Outlet />
      </main>

      {/* Modern Multi-Column Professional Footer — Medium Height */}
      <footer className="oc-footer-rich bg-dark text-white pt-4 pb-3 mt-auto">
        <div className="container">
          <div className="row g-3 g-lg-4 mb-2">
            {/* Brand column */}
            <div className="col-12 col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <EducationLogo size={32} showText={true} textClassName="h6 fw-bold mb-0 text-white" />
              </div>
              <p className="text-white-50 small mb-2" style={{ maxWidth: 320, lineHeight: 1.5, fontSize: "0.84rem" }}>
                Empowering students and software developers with curated engineering pathways, DRM-guarded handbooks, and structured video lectures.
              </p>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: "0.7rem" }}>
                  <i className="bi bi-shield-fill-check me-1" /> All Systems Operational
                </span>
              </div>
              <div className="d-flex gap-2 oc-social-icons">
                <a
                  href={settings.social_github || "https://github.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oc-social-btn"
                  aria-label="GitHub"
                >
                  <i className="bi bi-github" />
                </a>
                <a
                  href={settings.social_youtube || "https://youtube.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oc-social-btn"
                  aria-label="YouTube"
                >
                  <i className="bi bi-youtube" />
                </a>
                <a
                  href={settings.social_linkedin || "https://linkedin.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oc-social-btn"
                  aria-label="LinkedIn"
                >
                  <i className="bi bi-linkedin" />
                </a>
                <a
                  href={settings.social_twitter || "https://x.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oc-social-btn"
                  aria-label="Twitter"
                >
                  <i className="bi bi-twitter-x" />
                </a>
              </div>
            </div>

            {/* Quick Navigation: Career Pathways */}
            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 text-white fw-bold mb-2" style={{ fontSize: "0.92rem" }}>Career Pathways</h4>
              <ul className="list-unstyled oc-footer-links small mb-0">
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/career-pathways" className="text-white-50 text-decoration-none">
                    Python Backend
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/career-pathways" className="text-white-50 text-decoration-none">
                    Frontend &amp; React
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/career-pathways" className="text-white-50 text-decoration-none">
                    Applied AI &amp; ML
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/career-pathways" className="text-white-50 text-decoration-none">
                    Database &amp; SQL
                  </Link>
                </li>
              </ul>
            </div>

            {/* Classroom Workspaces */}
            <div className="col-6 col-md-3 col-lg-2">
              <h4 className="h6 text-white fw-bold mb-2" style={{ fontSize: "0.92rem" }}>Classrooms</h4>
              <ul className="list-unstyled oc-footer-links small mb-0">
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/dashboard" className="text-white-50 text-decoration-none">
                    Main Dashboard
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/online-class" className="text-white-50 text-decoration-none">
                    Online Classes
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/suggestion" className="text-white-50 text-decoration-none">
                    Study Suggestions
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/proxy-support" className="text-white-50 text-decoration-none">
                    Proxy Support
                  </Link>
                </li>
                <li className="mb-1" style={{ marginBottom: "0.3rem" }}>
                  <Link to="/registration" className="text-white-50 text-decoration-none">
                    Registrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Security & Support */}
            <div className="col-12 col-md-6 col-lg-4">
              <h4 className="h6 text-white fw-bold mb-2" style={{ fontSize: "0.92rem" }}>Academic Security &amp; Help</h4>
              <p className="text-white-50 small mb-2" style={{ fontSize: "0.82rem", lineHeight: 1.45 }}>
                {settings.help_description || "All educational documents and video lectures are delivered with real-time DRM protection and anti-extraction mechanisms."}
              </p>
              <div
                className="p-2.5 px-3 rounded-3 mt-1"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                  padding: "0.65rem 0.85rem",
                }}
              >
                {/* Clickable Direct Email */}
                <div className="d-flex align-items-center gap-2" style={{ marginBottom: "0.35rem" }}>
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 24, height: 24, background: "rgba(59, 130, 246, 0.25)", color: "#60a5fa" }}
                  >
                    <i className="bi bi-envelope-fill" style={{ fontSize: "0.78rem" }} />
                  </span>
                  <a
                    href={`mailto:${settings.help_email || "support@onlineclass.edu"}`}
                    className="text-white text-decoration-none fw-semibold"
                    style={{ fontSize: "0.84rem" }}
                    title="Click to send email directly"
                  >
                    {settings.help_email || "support@onlineclass.edu"}
                  </a>
                </div>

                {/* Clickable Direct Phone */}
                <div className="d-flex align-items-center gap-2" style={{ marginBottom: "0.35rem" }}>
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 24, height: 24, background: "rgba(16, 185, 129, 0.25)", color: "#34d399" }}
                  >
                    <i className="bi bi-telephone-fill" style={{ fontSize: "0.78rem" }} />
                  </span>
                  <a
                    href={`tel:${(settings.help_phone || "+91 98765 43210").replace(/\s+/g, '')}`}
                    className="text-white text-decoration-none fw-semibold"
                    style={{ fontSize: "0.84rem" }}
                    title="Click to call directly"
                  >
                    {settings.help_phone || "+91 98765 43210"}
                  </a>
                </div>

                {/* Campus Address */}
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 24, height: 24, background: "rgba(239, 68, 68, 0.25)", color: "#f87171" }}
                  >
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: "0.78rem" }} />
                  </span>
                  <span className="text-white fw-medium" style={{ fontSize: "0.82rem" }}>
                    {settings.help_address || "Academic Engineering Labs, Block C"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: "rgba(255, 255, 255, 0.10)", margin: "0.65rem 0" }} />

          {/* Bottom Bar */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 text-white-50 small pt-1" style={{ fontSize: "0.8rem" }}>
            <div>
              &copy; {currentYear} <strong>Online Class</strong> &bull; All Rights Reserved. Managed by Institution Administrator.
            </div>
            <div className="d-flex gap-3">
              <Link to="/home" className="text-white-50 text-decoration-none">Privacy Policy</Link>
              <Link to="/home" className="text-white-50 text-decoration-none">Terms of Study</Link>
              <Link to="/class/developer" className="text-white-50 text-decoration-none opacity-50">Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
