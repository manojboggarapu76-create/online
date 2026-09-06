import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  SECTION_LIST,
  updateAdminSiteSettings,
  createAdminCustomSection,
  updateAdminCustomSection,
  deleteAdminCustomSection,
} from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import EducationLogo from "../components/EducationLogo.jsx";
import SectionManager from "./SectionManager.jsx";
import LectureMaterialManager from "./LectureMaterialManager.jsx";
import CareerPathwaysManager from "./CareerPathwaysManager.jsx";
import ProxySupportManager from "./ProxySupportManager.jsx";
import RegistrationsManager from "./RegistrationsManager.jsx";
import ChangePassword from "./ChangePassword.jsx";
import PaymentsManager from "./PaymentsManager.jsx";
import WelcomeScreenManager from "./WelcomeScreenManager.jsx";
import SecurityAuditManager from "./SecurityAuditManager.jsx";
import SiteSettingsManager from "./SiteSettingsManager.jsx";
import ReviewsAndLoginsManager from "./ReviewsAndLoginsManager.jsx";

const DEFAULT_ADMIN_SECTIONS = [
  { key: "lecture_material", title: "Lectures & Materials", icon: "bi-journal-text", color: "#4f46e5", rightDisplayBg: "linear-gradient(145deg, #c7d2fe 0%, #e0e7ff 45%, #ede9fe 100%)", bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)", activeNavGradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)", tagline: "Manage curriculum modules, lecture slides, practice documents, and video lectures.", badgeText: "Curriculum Core" },
  { key: "career_pathways", title: "Career Pathways & Pricing", icon: "bi-diagram-3-fill", color: "#9333ea", rightDisplayBg: "linear-gradient(145deg, #e9d5ff 0%, #f3e8ff 45%, #fae8ff 100%)", bgGradient: "linear-gradient(135deg, #3b0764 0%, #581c87 60%, #7e22ce 100%)", activeNavGradient: "linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)", tagline: "Configure specializations, course curriculums, unlock fees, and student enrollments.", badgeText: "Career Tracks" },
  { key: "online_class", title: "Online Classes", icon: "bi-camera-video", color: "#0284c7", rightDisplayBg: "linear-gradient(145deg, #bae6fd 0%, #e0f2fe 45%, #e0f7fa 100%)", bgGradient: "linear-gradient(135deg, #082f49 0%, #0369a1 60%, #0284c7 100%)", activeNavGradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", tagline: "Live sessions, Zoom/Meet lecture links, scheduled dates, and meeting recordings.", badgeText: "Live Classroom" },
  { key: "suggestion", title: "Suggestions", icon: "bi-lightbulb", color: "#d97706", rightDisplayBg: "linear-gradient(145deg, #fde68a 0%, #fef3c7 45%, #fffbeb 100%)", bgGradient: "linear-gradient(135deg, #451a03 0%, #78350f 60%, #d97706 100%)", activeNavGradient: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)", tagline: "Study tips, curriculum recommendations, and student learning resources.", badgeText: "Learning Tips" },
  { key: "proxy_support", title: "Proxy Support", icon: "bi-people", color: "#ea580c", rightDisplayBg: "linear-gradient(145deg, #fed7aa 0%, #ffedd5 45%, #fee2e2 100%)", bgGradient: "linear-gradient(135deg, #431407 0%, #7c2d12 60%, #ea580c 100%)", activeNavGradient: "linear-gradient(135deg, #c2410c 0%, #fb923c 100%)", tagline: "Coverage resources, standby assistance, and session replacement guidance.", badgeText: "Standby Support" },
  { key: "registration", title: "Registrations", icon: "bi-pencil-square", color: "#059669", rightDisplayBg: "linear-gradient(145deg, #a7f3d0 0%, #d1fae5 45%, #ecfdf5 100%)", bgGradient: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #059669 100%)", activeNavGradient: "linear-gradient(135deg, #047857 0%, #10b981 100%)", tagline: "Active registration guides, batch intake schedules, and enrollment forms.", badgeText: "Enrollment Info" },
  { key: "interview_prep", title: "Interview Preparation", icon: "bi-briefcase-fill", color: "#0d9488", rightDisplayBg: "linear-gradient(145deg, #99f6e4 0%, #ccfbf1 45%, #e0f2fe 100%)", bgGradient: "linear-gradient(135deg, #042f2e 0%, #115e59 60%, #0d9488 100%)", activeNavGradient: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", tagline: "Technical round walkthroughs, interview tips, mock videos, and Q&A guides.", badgeText: "Career Interviews" },
  { key: "proxy_messages", title: "Proxy Requests", icon: "bi-chat-left-dots", color: "#0d9488", rightDisplayBg: "linear-gradient(145deg, #99f6e4 0%, #ccfbf1 45%, #e0f2fe 100%)", bgGradient: "linear-gradient(135deg, #042f2e 0%, #115e59 60%, #0d9488 100%)", activeNavGradient: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", tagline: "Inbound student proxy assistance submissions, status tracking, and admin replies.", badgeText: "Student Inbox" },
  { key: "registrations_manager", title: "Student Registrations", icon: "bi-person-lines-fill", color: "#e11d48", rightDisplayBg: "linear-gradient(145deg, #fecdd3 0%, #ffe4e6 45%, #fdf2f8 100%)", bgGradient: "linear-gradient(135deg, #4c0519 0%, #881337 60%, #e11d48 100%)", activeNavGradient: "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)", tagline: "Real-time student batch signups, contact details, college branches, and enrollment status.", badgeText: "Admissions" },
  { key: "reviews_and_logins", title: "Reviews & User Logins", icon: "bi-star-half", color: "#f59e0b", rightDisplayBg: "linear-gradient(145deg, #fef3c7 0%, #fffbeb 45%, #fef9c3 100%)", bgGradient: "linear-gradient(135deg, #451a03 0%, #78350f 60%, #b45309 100%)", activeNavGradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", tagline: "Student reviews & ratings, user account profiles, and live login occurrence analytics.", badgeText: "Feedback & Logins" },
  { key: "footer_settings", title: "Education Logo & Settings", icon: "bi-sliders2", color: "#0891b2", rightDisplayBg: "linear-gradient(145deg, #a5f3fc 0%, #cffafe 45%, #ecfeff 100%)", bgGradient: "linear-gradient(135deg, #164e63 0%, #155e75 60%, #0891b2 100%)", activeNavGradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", tagline: "Upload custom Education Logo, customize section background colors, and manage contact info.", badgeText: "Branding & Help" },
  { key: "welcome", title: "Welcome Screen", icon: "bi-display", color: "#7c3aed", rightDisplayBg: "linear-gradient(145deg, #f5d0fe 0%, #fae8ff 45%, #f3e8ff 100%)", bgGradient: "linear-gradient(135deg, #2e1065 0%, #581c87 60%, #7c3aed 100%)", activeNavGradient: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)", tagline: "Configure introductory splash video/photo, headline, countdown duration, and branding.", badgeText: "Splash Screen" },
  { key: "security", title: "Security Logs", icon: "bi-shield-shaded", color: "#dc2626", rightDisplayBg: "linear-gradient(145deg, #fecaca 0%, #fee2e2 45%, #fef2f2 100%)", bgGradient: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 60%, #dc2626 100%)", activeNavGradient: "linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)", tagline: "Live DRM interception audit trail: PrintScreen, Snipping Tool, and capture attempts.", badgeText: "DRM Security" },
  { key: "payments", title: "Payments", icon: "bi-credit-card", color: "#4338ca", rightDisplayBg: "linear-gradient(145deg, #ddd6fe 0%, #ede9fe 45%, #e0e7ff 100%)", bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4338ca 100%)", activeNavGradient: "linear-gradient(135deg, #3730a3 0%, #6366f1 100%)", tagline: "Order transactions, Razorpay payment verification logs, and student access audit.", badgeText: "Financials" },
  { key: "settings", title: "Password Settings", icon: "bi-gear", color: "#475569", rightDisplayBg: "linear-gradient(145deg, #cbd5e1 0%, #e2e8f0 45%, #f1f5f9 100%)", bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #475569 100%)", activeNavGradient: "linear-gradient(135deg, #334155 0%, #64748b 100%)", tagline: "Update administrator credentials and master access passwords.", badgeText: "Security Auth" },
];

const SPECIAL_ADMIN_KEYS = new Set([
  "lecture_material",
  "career_pathways",
  "proxy_messages",
  "registrations_manager",
  "reviews_and_logins",
  "footer_settings",
  "welcome",
  "security",
  "settings",
  "payments",
]);

const ICON_PRESETS = [
  { icon: "bi-briefcase-fill", label: "Career / Jobs" },
  { icon: "bi-code-slash", label: "Coding / Dev" },
  { icon: "bi-terminal-fill", label: "Terminal / DevOps" },
  { icon: "bi-camera-video-fill", label: "Video Classes" },
  { icon: "bi-lightbulb-fill", label: "Tips & Tricks" },
  { icon: "bi-patch-question-fill", label: "Interview Q&A" },
  { icon: "bi-cpu-fill", label: "Tech & AI" },
  { icon: "bi-database-fill", label: "Database / SQL" },
  { icon: "bi-cloud-fill", label: "Cloud Services" },
  { icon: "bi-lightning-charge-fill", label: "Fast Track" },
  { icon: "bi-mortarboard-fill", label: "Academy" },
  { icon: "bi-folder2-open", label: "Resources" },
];

const COLOR_PRESETS = [
  "#059669",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#9333ea",
  "#ea580c",
  "#d97706",
  "#e11d48",
];

export default function AdminPanel() {
  const { logout } = useAdminAuth();
  const { sectionColors, reloadSettings, customSections, allSections, reloadCustomSections } = useSiteSettings();
  const [activeKey, setActiveKey] = useState("lecture_material");

  const [localCustomColors, setLocalCustomColors] = useState(() => {
    try { const c = localStorage.getItem("oc_admin_section_colors"); return c ? JSON.parse(c) : {}; } catch { return {}; }
  });

  // Modal states for Creating & Editing Custom Sections (Admin only)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: "",
    key: "",
    tagline: "",
    icon: "bi-briefcase-fill",
    color: "#059669",
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalNotice, setModalNotice] = useState(null);

  useEffect(() => {
    if (sectionColors) setLocalCustomColors((prev) => ({ ...prev, ...sectionColors }));
  }, [sectionColors]);

  const handleColorUpdate = async (secKey, newColor) => {
    const updated = { ...localCustomColors, [secKey]: newColor };
    setLocalCustomColors(updated);
    try {
      localStorage.setItem("oc_admin_section_colors", JSON.stringify(updated));
      await updateAdminSiteSettings({ section_colors: JSON.stringify(updated) });
      if (reloadSettings) reloadSettings();
    } catch {}
  };

  const customAdminSections = (customSections || [])
    .filter((cs) => !DEFAULT_ADMIN_SECTIONS.some((d) => d.key === cs.key))
    .map((cs) => {
      const c = cs.color || "#2563eb";
      return { key: cs.key, title: cs.title, icon: cs.icon || "bi-folder-fill", color: c, rightDisplayBg: `linear-gradient(145deg, ${c}30 0%, ${c}18 45%, ${c}28 100%)`, bgGradient: `linear-gradient(135deg, #0f172a 0%, ${c}cc 100%)`, activeNavGradient: `linear-gradient(135deg, ${c} 0%, #3b82f6 100%)`, tagline: cs.tagline || "Custom classroom workspace — manage resources, videos, and materials.", badgeText: "Custom Section" };
    });

  const allAdminSections = [...DEFAULT_ADMIN_SECTIONS, ...customAdminSections];

  const adminSections = allAdminSections.map((sec) => {
    const customColor = localCustomColors[sec.key] || (sectionColors && sectionColors[sec.key]);
    if (customColor) return { ...sec, color: customColor, rightDisplayBg: `linear-gradient(145deg, ${customColor}38 0%, ${customColor}20 50%, ${customColor}44 100%)`, activeNavGradient: `linear-gradient(135deg, ${customColor} 0%, #3b82f6 100%)`, bgGradient: `linear-gradient(135deg, #0f172a 0%, ${customColor} 100%)` };
    return sec;
  });

  const activeSec = adminSections.find((s) => s.key === activeKey) || adminSections[0];
  const activeSection = (allSections || SECTION_LIST).find((s) => s.key === activeKey);
  const contentSections = SECTION_LIST.filter((s) => s.key !== "lecture_material" && s.key !== "career_pathways");

  // Check if current active section is an admin-created custom section
  const isCurrentSectionCustom = (customSections || []).some((cs) => cs.key === activeSec.key);

  // Open Edit Modal with current active section data
  const handleOpenEditModal = () => {
    const matched = (customSections || []).find((cs) => cs.key === activeSec.key);
    setSectionForm({
      title: matched?.title || activeSec.title,
      key: activeSec.key,
      tagline: matched?.tagline || activeSec.tagline,
      icon: matched?.icon || activeSec.icon,
      color: matched?.color || activeSec.color,
    });
    setModalNotice(null);
    setEditModalOpen(true);
  };

  // Submit Edit Custom Section
  const handleSaveEditSection = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalNotice(null);
    try {
      await updateAdminCustomSection(sectionForm.key, {
        title: sectionForm.title.trim(),
        tagline: sectionForm.tagline.trim(),
        icon: sectionForm.icon,
        color: sectionForm.color,
      });

      if (reloadCustomSections) await reloadCustomSections();
      window.dispatchEvent(new Event("oc-sections-updated"));

      setModalNotice({ type: "success", msg: "Section details updated successfully!" });
      setTimeout(() => {
        setEditModalOpen(false);
        setModalNotice(null);
      }, 1000);
    } catch (err) {
      setModalNotice({ type: "danger", msg: err.response?.data?.message || "Failed to update section." });
    } finally {
      setModalSaving(false);
    }
  };

  // Delete Custom Section
  const handleDeleteCustomSection = async () => {
    if (!window.confirm(`Are you sure you want to permanently remove the "${activeSec.title}" section?`)) {
      return;
    }
    try {
      await deleteAdminCustomSection(activeSec.key);
      if (reloadCustomSections) await reloadCustomSections();
      window.dispatchEvent(new Event("oc-sections-updated"));
      setActiveKey("lecture_material");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete section.");
    }
  };

  // Open Create Section Modal
  const handleOpenCreateModal = () => {
    setSectionForm({
      title: "",
      key: "",
      tagline: "",
      icon: "bi-briefcase-fill",
      color: "#059669",
    });
    setModalNotice(null);
    setCreateModalOpen(true);
  };

  // Submit Create New Section
  const handleSaveCreateSection = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalNotice(null);
    try {
      const res = await createAdminCustomSection({
        title: sectionForm.title.trim(),
        key: sectionForm.key.trim() || undefined,
        tagline: sectionForm.tagline.trim() || "Curated learning resources and materials.",
        icon: sectionForm.icon,
        color: sectionForm.color,
      });

      if (reloadCustomSections) await reloadCustomSections();
      window.dispatchEvent(new Event("oc-sections-updated"));

      const newKey = res.data?.data?.key || sectionForm.key.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
      setActiveKey(newKey);

      setModalNotice({ type: "success", msg: `"${sectionForm.title}" created successfully!` });
      setTimeout(() => {
        setCreateModalOpen(false);
        setModalNotice(null);
      }, 1000);
    } catch (err) {
      setModalNotice({ type: "danger", msg: err.response?.data?.message || "Failed to create section." });
    } finally {
      setModalSaving(false);
    }
  };

  const navBtn = (key, label, iconColor, iconClass) => {
    const meta = adminSections.find((m) => m.key === key) || { color: iconColor, activeNavGradient: `linear-gradient(135deg,${iconColor},#3b82f6)` };
    const isAct = activeKey === key;
    return (
      <button key={key} className={`oc-admin-nav-btn ${isAct ? "active" : ""}`}
        style={isAct ? { background: meta.activeNavGradient, boxShadow: `0 4px 18px ${meta.color}66`, color: "#ffffff" } : {}}
        onClick={() => setActiveKey(key)}>
        <span className="oc-admin-nav-icon-badge" style={{ background: meta.color }}><i className={`bi ${iconClass}`} /></span>
        <span dangerouslySetInnerHTML={{ __html: label }} />
      </button>
    );
  };

  return (
    <div className="oc-admin-shell">
      <aside className="oc-admin-sidebar">
        <div className="oc-admin-brand">
          <div className="d-flex align-items-center gap-2 mb-1">
            <EducationLogo size={32} showText={true} textClassName="fw-bold text-white fs-6" />
          </div>
          <small style={{ fontSize: "0.75rem", opacity: 0.75, fontWeight: 400 }}>Academic Administrator Hub</small>
        </div>

        {navBtn("lecture_material", "Lectures &amp; Materials", "#4f46e5", "bi-journal-text")}
        {navBtn("career_pathways", "Career Pathways &amp; Pricing", "#9333ea", "bi-diagram-3-fill")}

        {contentSections.map((s) => {
          const meta = adminSections.find((m) => m.key === s.key) || { color: "#2563eb", activeNavGradient: "linear-gradient(135deg,#2563eb,#3b82f6)" };
          const isAct = activeKey === s.key;
          return (
            <button key={s.key} className={`oc-admin-nav-btn ${isAct ? "active" : ""}`}
              style={isAct ? { background: meta.activeNavGradient, boxShadow: `0 4px 18px ${meta.color}66`, color: "#ffffff" } : {}}
              onClick={() => setActiveKey(s.key)}>
              <span className="oc-admin-nav-icon-badge" style={{ background: meta.color }}><i className={`bi ${s.icon}`} /></span>
              <span>{s.title}</span>
            </button>
          );
        })}

        {/* ── Custom Sections Header + Add Section Action ── */}
        <hr style={{ borderColor: "rgba(255,255,255,.12)", margin: "0.5rem 0" }} />
        <div className="d-flex align-items-center justify-content-between px-2 pb-1">
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Custom Sections
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning rounded-pill py-0 px-2 fw-semibold"
            style={{ fontSize: "0.68rem" }}
            onClick={handleOpenCreateModal}
            title="Create a new course section"
          >
            <i className="bi bi-plus-lg me-1" /> Add
          </button>
        </div>

        {customAdminSections.map((cs) => {
          const meta = adminSections.find((m) => m.key === cs.key) || cs;
          const isAct = activeKey === cs.key;
          return (
            <button key={cs.key} className={`oc-admin-nav-btn ${isAct ? "active" : ""}`}
              style={isAct ? { background: meta.activeNavGradient, boxShadow: `0 4px 18px ${meta.color}66`, color: "#ffffff" } : {}}
              onClick={() => setActiveKey(cs.key)}>
              <span className="oc-admin-nav-icon-badge" style={{ background: meta.color }}><i className={`bi ${cs.icon}`} /></span>
              <span>{cs.title}</span>
              <span className="ms-auto badge rounded-pill" style={{ fontSize: "0.6rem", background: "rgba(255,255,255,0.18)", color: "#fff", padding: "2px 7px" }}>Custom</span>
            </button>
          );
        })}

        <hr style={{ borderColor: "rgba(255,255,255,.12)", margin: "0.5rem 0" }} />
        {navBtn("proxy_messages", "Proxy Requests", "#0d9488", "bi-chat-left-dots")}
        {navBtn("registrations_manager", "Student Registrations", "#e11d48", "bi-person-lines-fill")}
        {navBtn("reviews_and_logins", "Reviews & User Logins", "#f59e0b", "bi-star-half")}
        <hr style={{ borderColor: "rgba(255,255,255,.12)", margin: "0.5rem 0" }} />
        {navBtn("footer_settings", "Education Logo &amp; Settings", "#0891b2", "bi-sliders2")}
        {navBtn("welcome", "Welcome Screen", "#7c3aed", "bi-display")}
        {navBtn("security", "Security Logs", "#dc2626", "bi-shield-shaded")}
        {navBtn("payments", "Payments", "#4338ca", "bi-credit-card")}
        {navBtn("settings", "Password Settings", "#475569", "bi-gear")}
        <hr style={{ borderColor: "rgba(255,255,255,.12)", margin: "1rem 0" }} />
        <Link to="/career-pathways" className="oc-admin-nav-btn text-decoration-none"><i className="bi bi-diagram-3 me-2 text-white-50" />View Pathways</Link>
        <Link to="/dashboard" className="oc-admin-nav-btn text-decoration-none"><i className="bi bi-box-arrow-up-right me-2 text-white-50" />View Dashboard</Link>
        <Link to="/home" className="oc-admin-nav-btn text-decoration-none"><i className="bi bi-house-door me-2 text-white-50" />View Home Page</Link>
        <button className="oc-admin-nav-btn mt-auto text-danger" onClick={logout}><i className="bi bi-box-arrow-left me-2 text-danger" />Log out</button>
      </aside>

      <main className="oc-admin-main" style={{ background: activeSec.rightDisplayBg, minHeight: "100vh", transition: "background 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div className="oc-admin-section-hero d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: activeSec.bgGradient, borderLeft: `6px solid ${activeSec.color}` }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow" style={{ width: 38, height: 38, background: activeSec.color, fontSize: "1.2rem" }}>
                <i className={`bi ${activeSec.icon}`} />
              </span>
              <h2 className="h4 fw-bold mb-0 text-white">{activeSec.title}</h2>
              <span className="badge px-3 py-1 rounded-pill small fw-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)" }}>{activeSec.badgeText || "Section Workspace"}</span>
            </div>
            <p className="text-white-50 mb-0 small" style={{ maxWidth: 760, lineHeight: 1.5 }}>{activeSec.tagline}</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Custom Section Actions: Edit & Delete (Admin Only) */}
            {isCurrentSectionCustom && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                  onClick={handleOpenEditModal}
                  title="Edit title, tagline, icon, and color"
                >
                  <i className="bi bi-pencil-square text-primary" />
                  <span>Edit Section</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                  style={{ background: "rgba(220, 38, 38, 0.15)", borderColor: "rgba(220, 38, 38, 0.4)", color: "#fee2e2" }}
                  onClick={handleDeleteCustomSection}
                  title="Remove this section"
                >
                  <i className="bi bi-trash3" />
                  <span>Delete</span>
                </button>
              </>
            )}

            {/* Background Color Controller */}
            <div className="p-2 px-3 rounded-pill d-inline-flex align-items-center gap-2 text-white shadow-sm" style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
              <label htmlFor="quick-bg-color-picker" className="mb-0 small fw-semibold cursor-pointer d-flex align-items-center gap-2" style={{ fontSize: "0.82rem" }}>
                <i className="bi bi-palette-fill text-warning" /><span>Right Display Background:</span>
              </label>
              <input id="quick-bg-color-picker" type="color" value={activeSec.color} onChange={(e) => handleColorUpdate(activeSec.key, e.target.value)} className="form-control form-control-color border-0 p-0 rounded-circle cursor-pointer" style={{ width: 28, height: 28 }} title="Change background color for this section" />
              <span className="font-monospace fw-bold text-warning small">{activeSec.color}</span>
            </div>
          </div>
        </div>

        {activeKey === "lecture_material" && <LectureMaterialManager />}
        {activeKey === "career_pathways" && <CareerPathwaysManager />}
        {activeKey === "proxy_messages" && <ProxySupportManager />}
        {activeKey === "registrations_manager" && <RegistrationsManager />}
        {activeKey === "reviews_and_logins" && <ReviewsAndLoginsManager />}
        {activeKey === "footer_settings" && <SiteSettingsManager />}
        {activeKey === "welcome" && <WelcomeScreenManager />}
        {activeKey === "security" && <SecurityAuditManager />}
        {activeKey === "settings" && <ChangePassword />}
        {activeKey === "payments" && <PaymentsManager />}

        {!SPECIAL_ADMIN_KEYS.has(activeKey) && activeSection && <SectionManager section={activeSection} />}
        {!SPECIAL_ADMIN_KEYS.has(activeKey) && !activeSection && (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="fw-semibold">Loading section workspace&hellip;</p>
          </div>
        )}
      </main>

      {/* ── MODAL: Create New Section (Admin Only) ── */}
      {createModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header text-white p-4" style={{ background: `linear-gradient(135deg, ${sectionForm.color} 0%, #0f172a 100%)` }}>
                <div className="d-flex align-items-center gap-3">
                  <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm" style={{ width: 44, height: 44, color: sectionForm.color, fontSize: "1.4rem" }}>
                    <i className={`bi ${sectionForm.icon}`} />
                  </span>
                  <div>
                    <h3 className="modal-title h5 fw-bold mb-0 text-white">Create New Classroom Section</h3>
                    <small className="text-white-50">Adds a live interactive section to Dashboard &amp; Admin Panel</small>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCreateModalOpen(false)} disabled={modalSaving} />
              </div>

              <form onSubmit={handleSaveCreateSection}>
                <div className="modal-body p-4 bg-white">
                  {modalNotice && (
                    <div className={`alert alert-${modalNotice.type} py-2 px-3 rounded-3 mb-3 small`}>
                      <i className={`bi ${modalNotice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
                      {modalNotice.msg}
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-md-7">
                      <label className="form-label fw-bold small text-dark">Section Title *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. Mock Interviews & System Design"
                        value={sectionForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSectionForm({
                            ...sectionForm,
                            title: val,
                            key: sectionForm.key ? sectionForm.key : val.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
                          });
                        }}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-bold small text-dark">URL Slug / Key</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. mock_interviews"
                        value={sectionForm.key}
                        onChange={(e) => setSectionForm({ ...sectionForm, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_") })}
                      />
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>Auto-generated lowercase identifier</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Tagline / Subtitle *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Technical mock interview questions, architecture walkthroughs, and coding patterns."
                      value={sectionForm.tagline}
                      onChange={(e) => setSectionForm({ ...sectionForm, tagline: e.target.value })}
                    />
                  </div>

                  {/* Icon Presets */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Select Icon</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ICON_PRESETS.map((p) => (
                        <button
                          key={p.icon}
                          type="button"
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                            sectionForm.icon === p.icon ? "btn-dark" : "btn-outline-secondary"
                          }`}
                          onClick={() => setSectionForm({ ...sectionForm, icon: p.icon })}
                        >
                          <i className={`bi ${p.icon}`} />
                          <span>{p.label.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className="mb-2">
                    <label className="form-label fw-bold small text-dark">Theme Color &amp; Display Background</label>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="rounded-circle border-0 p-0"
                          style={{
                            width: 28,
                            height: 28,
                            background: c,
                            outline: sectionForm.color === c ? "3px solid #0f172a" : "none",
                            outlineOffset: 2,
                          }}
                          onClick={() => setSectionForm({ ...sectionForm, color: c })}
                        />
                      ))}
                      <input
                        type="color"
                        value={sectionForm.color}
                        onChange={(e) => setSectionForm({ ...sectionForm, color: e.target.value })}
                        className="form-control form-control-color border-0 p-0 ms-2"
                        style={{ width: 32, height: 32 }}
                        title="Pick custom color"
                      />
                      <span className="font-monospace text-muted small">{sectionForm.color}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setCreateModalOpen(false)} disabled={modalSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={modalSaving}>
                    {modalSaving ? "Creating..." : "Create & Publish Section"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Section Details (Admin Only) ── */}
      {editModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header text-white p-4" style={{ background: `linear-gradient(135deg, ${sectionForm.color} 0%, #0f172a 100%)` }}>
                <div className="d-flex align-items-center gap-3">
                  <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-white shadow-sm" style={{ width: 44, height: 44, color: sectionForm.color, fontSize: "1.4rem" }}>
                    <i className={`bi ${sectionForm.icon}`} />
                  </span>
                  <div>
                    <h3 className="modal-title h5 fw-bold mb-0 text-white">Edit Custom Section Details</h3>
                    <small className="text-white-50">Updates section title, tagline, icon, and color live across the platform</small>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditModalOpen(false)} disabled={modalSaving} />
              </div>

              <form onSubmit={handleSaveEditSection}>
                <div className="modal-body p-4 bg-white">
                  {modalNotice && (
                    <div className={`alert alert-${modalNotice.type} py-2 px-3 rounded-3 mb-3 small`}>
                      <i className={`bi ${modalNotice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
                      {modalNotice.msg}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Section Title *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Tagline / Subtitle *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={sectionForm.tagline}
                      onChange={(e) => setSectionForm({ ...sectionForm, tagline: e.target.value })}
                    />
                  </div>

                  {/* Icon Presets */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Select Icon</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ICON_PRESETS.map((p) => (
                        <button
                          key={p.icon}
                          type="button"
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                            sectionForm.icon === p.icon ? "btn-dark" : "btn-outline-secondary"
                          }`}
                          onClick={() => setSectionForm({ ...sectionForm, icon: p.icon })}
                        >
                          <i className={`bi ${p.icon}`} />
                          <span>{p.label.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className="mb-2">
                    <label className="form-label fw-bold small text-dark">Theme Color &amp; Display Background</label>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="rounded-circle border-0 p-0"
                          style={{
                            width: 28,
                            height: 28,
                            background: c,
                            outline: sectionForm.color === c ? "3px solid #0f172a" : "none",
                            outlineOffset: 2,
                          }}
                          onClick={() => setSectionForm({ ...sectionForm, color: c })}
                        />
                      ))}
                      <input
                        type="color"
                        value={sectionForm.color}
                        onChange={(e) => setSectionForm({ ...sectionForm, color: e.target.value })}
                        className="form-control form-control-color border-0 p-0 ms-2"
                        style={{ width: 32, height: 32 }}
                        title="Pick custom color"
                      />
                      <span className="font-monospace text-muted small">{sectionForm.color}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setEditModalOpen(false)} disabled={modalSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={modalSaving}>
                    {modalSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

