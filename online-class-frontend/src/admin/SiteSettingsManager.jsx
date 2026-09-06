import { useState, useEffect } from "react";
import {
  fetchAdminSiteSettings,
  updateAdminSiteSettings,
  uploadAdminEducationLogo,
  removeAdminEducationLogo,
} from "../api/client";
import EducationLogo from "../components/EducationLogo.jsx";

const SECTION_COLOR_PRESETS = [
  { key: "lecture_material", label: "Lectures & Materials", defaultColor: "#4f46e5" },
  { key: "career_pathways", label: "Career Pathways & Pricing", defaultColor: "#9333ea" },
  { key: "online_class", label: "Online Classes", defaultColor: "#0284c7" },
  { key: "suggestion", label: "Suggestions", defaultColor: "#d97706" },
  { key: "proxy_support", label: "Proxy Support", defaultColor: "#ea580c" },
  { key: "registration", label: "Registrations", defaultColor: "#059669" },
  { key: "proxy_messages", label: "Proxy Requests", defaultColor: "#0d9488" },
  { key: "registrations_manager", label: "Student Registrations", defaultColor: "#e11d48" },
  { key: "footer_settings", label: "Education Logo & Settings", defaultColor: "#0891b2" },
  { key: "welcome", label: "Welcome Screen", defaultColor: "#7c3aed" },
  { key: "security", label: "Security Logs", defaultColor: "#dc2626" },
  { key: "payments", label: "Payments", defaultColor: "#4338ca" },
  { key: "settings", label: "Password Settings", defaultColor: "#475569" },
];

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState({
    social_youtube: "https://youtube.com",
    social_github: "https://github.com",
    social_twitter: "https://x.com",
    social_linkedin: "https://linkedin.com",
    help_email: "support@onlineclass.edu",
    help_phone: "+91 98765 43210",
    help_address: "Academic Engineering Labs, Block C",
    help_description: "All educational documents and video lectures are delivered with real-time DRM protection and anti-extraction mechanisms.",
    payment_required: "1",
    education_logo_url: "",
    education_logo_name: "",
    section_colors: "",
  });

  const [sectionColors, setSectionColors] = useState({});
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg, type = "success") => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 5000);
  };

  useEffect(() => {
    setLoading(true);
    fetchAdminSiteSettings()
      .then((res) => {
        if (res.data?.data) {
          const data = res.data.data;
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.section_colors) {
            try {
              const parsed = typeof data.section_colors === "string" ? JSON.parse(data.section_colors) : data.section_colors;
              setSectionColors(parsed || {});
            } catch {}
          }
        }
      })
      .catch(() => {
        showNotice("Failed to load settings from server.", "danger");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionColorChange = (key, color) => {
    setSectionColors((prev) => {
      const updated = { ...prev, [key]: color };
      setSettings((s) => ({ ...s, section_colors: JSON.stringify(updated) }));
      return updated;
    });
  };

  const handleResetSectionColors = () => {
    const defaults = {};
    SECTION_COLOR_PRESETS.forEach((p) => {
      defaults[p.key] = p.defaultColor;
    });
    setSectionColors(defaults);
    setSettings((s) => ({ ...s, section_colors: JSON.stringify(defaults) }));
    showNotice("Section colors reset to academic presets. Click 'Save All Settings' to commit.");
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotice("Selected logo exceeds 10MB limit.", "danger");
        return;
      }
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedLogoFile) {
      showNotice("Please select an image file first.", "warning");
      return;
    }
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("logo", selectedLogoFile);
    try {
      const res = await uploadAdminEducationLogo(fd);
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
        if (res.data.data.education_logo_url) {
          sessionStorage.setItem("oc_cached_education_logo", res.data.data.education_logo_url);
          sessionStorage.setItem("oc_cache_dashboard_logo", res.data.data.education_logo_url);
        }
      }
      setSelectedLogoFile(null);
      setLogoPreview(null);
      window.dispatchEvent(new Event("oc-logo-updated"));
      showNotice("Education logo updated successfully! It is now active across every page of the website.");
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to upload logo image.", "danger");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm("Remove custom education logo and restore default platform emblem?")) return;
    setUploadingLogo(true);
    try {
      const res = await removeAdminEducationLogo();
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
      sessionStorage.removeItem("oc_cached_education_logo");
      sessionStorage.removeItem("oc_cache_dashboard_logo");
      setSelectedLogoFile(null);
      setLogoPreview(null);
      window.dispatchEvent(new Event("oc-logo-updated"));
      showNotice("Custom logo removed. Default education emblem restored across all pages.");
    } catch (err) {
      showNotice("Failed to remove logo.", "danger");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        section_colors: JSON.stringify(sectionColors),
      };
      const res = await updateAdminSiteSettings(payload);
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
      window.dispatchEvent(new Event("oc-logo-updated"));
      showNotice("Platform configuration, Education Logo & Section Background Colors saved successfully.");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error saving site settings.", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="oc-admin-settings-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "#0ea5e9", width: 38, height: 38, fontSize: "1.15rem" }}
            >
              <i className="bi bi-sliders2" />
            </span>
            <span>Education Logo &amp; Section Colors Studio</span>
          </h2>
          <p className="text-muted mb-0 small">
            Customize the global Education Logo displayed across every page of the website, apply section background colors, and manage contact and support info.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-3 px-4 mb-4 rounded-4 shadow-sm d-flex align-items-center gap-2 border-0`}>
          <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill fs-4 text-success" : "bi-exclamation-triangle-fill fs-4 text-danger"}`} />
          <span className="fw-medium">{notice.msg}</span>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CARD 1: EDUCATION LOGO MANAGEMENT (DISPLAYED ON ENTIRE WEBSITE)      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 34, height: 34, background: "rgba(14, 165, 233, 0.18)", color: "#0284c7" }}
              >
                <i className="bi bi-mortarboard-fill fs-5" />
              </span>
              <h5 className="fw-bold mb-0 text-dark">Global Education Logo</h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill small fw-semibold">
                Live on Every Page
              </span>
            </div>
            <p className="text-muted small mb-0" style={{ maxWidth: 700 }}>
              This logo is displayed in the <strong>Navbar header</strong>, <strong>Footer</strong>, <strong>Welcome Screen</strong>, <strong>Login &amp; Signup forms</strong>, and <strong>Admin Workspace</strong> on every page of the platform. Only administrators can change this logo.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="logo-file-input" className="btn btn-outline-primary px-3 py-2 rounded-pill fw-semibold small d-inline-flex align-items-center gap-2 cursor-pointer shadow-sm">
              <i className="bi bi-cloud-arrow-up-fill" /> Choose Logo File
            </label>
            <input
              id="logo-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="d-none"
              onChange={handleLogoFileSelect}
            />

            {selectedLogoFile && (
              <button
                type="button"
                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold small shadow-sm d-inline-flex align-items-center gap-2"
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle" /> Save &amp; Apply Logo
                  </>
                )}
              </button>
            )}

            {settings.education_logo_url && (
              <button
                type="button"
                className="btn btn-outline-danger px-3 py-2 rounded-pill fw-semibold small"
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                title="Restore default emblem"
              >
                <i className="bi bi-trash3 me-1" /> Reset Default
              </button>
            )}
          </div>
        </div>

        {/* Logo Preview Arena */}
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-4 border bg-light d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center p-2 rounded-3 bg-white border shadow-sm flex-shrink-0"
                style={{ width: 80, height: 80 }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : settings.education_logo_url ? (
                  <img
                    src={settings.education_logo_url}
                    alt="Active Logo"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span
                    className="d-inline-flex align-items-center justify-content-center text-white rounded-3"
                    style={{
                      width: 60,
                      height: 60,
                      background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                      fontSize: "1.8rem",
                    }}
                  >
                    <i className="bi bi-mortarboard-fill" />
                  </span>
                )}
              </div>

              <div>
                <div className="fw-bold text-dark mb-1">
                  {selectedLogoFile ? (
                    <span className="text-primary">
                      <i className="bi bi-file-earmark-check me-1" /> Ready to Upload: {selectedLogoFile.name}
                    </span>
                  ) : settings.education_logo_url ? (
                    <span className="text-success">
                      <i className="bi bi-patch-check-fill me-1" /> Custom Logo Active ({settings.education_logo_name || "logo.png"})
                    </span>
                  ) : (
                    <span className="text-muted">
                      <i className="bi bi-info-circle me-1" /> Default Academic Emblem Active
                    </span>
                  )}
                </div>
                <small className="text-muted d-block">
                  Recommended format: Transparent PNG, SVG, or high-res WebP. Ideal aspect ratio: 1:1 or 4:3.
                </small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded-4 bg-dark text-white d-flex align-items-center justify-content-between">
              <div>
                <small className="text-white-50 d-block mb-1">Header Navbar Live Preview:</small>
                <div className="d-flex align-items-center gap-2">
                  <EducationLogo size={36} showText={true} textClassName="fw-bold text-white fs-6" />
                </div>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill small">
                Every Page Synced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CARD 2: ADMIN PANEL SECTION BACKGROUND COLORS STUDIO                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 34, height: 34, background: "rgba(147, 51, 234, 0.18)", color: "#9333ea" }}
              >
                <i className="bi bi-palette-fill fs-5" />
              </span>
              <h5 className="fw-bold mb-0 text-dark">Admin Panel Section Background Colors</h5>
              <span className="badge bg-purple-subtle text-purple px-3 py-1 rounded-pill small fw-semibold" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                13 Distinct Workspaces
              </span>
            </div>
            <p className="text-muted small mb-0">
              Each section in the admin panel has its own dedicated background color, glowing active sidebar state, and workspace theme. You can fine-tune any section's background color below.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 fw-semibold"
            onClick={handleResetSectionColors}
          >
            <i className="bi bi-arrow-counterclockwise me-1" /> Reset to Default Palettes
          </button>
        </div>

        {/* Section Color Pickers Grid */}
        <div className="row g-3">
          {SECTION_COLOR_PRESETS.map((preset) => {
            const currentColor = sectionColors[preset.key] || preset.defaultColor;
            return (
              <div key={preset.key} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div
                  className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-2 shadow-sm transition-all"
                  style={{
                    background: `${currentColor}0c`,
                    borderLeft: `5px solid ${currentColor}`,
                  }}
                >
                  <div className="overflow-hidden">
                    <span className="fw-bold text-dark d-block text-truncate small" title={preset.label}>
                      {preset.label}
                    </span>
                    <span className="font-monospace text-muted" style={{ fontSize: "0.74rem" }}>
                      {currentColor}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => handleSectionColorChange(preset.key, e.target.value)}
                      className="form-control form-control-color border-0 p-0 rounded-circle cursor-pointer"
                      style={{ width: 34, height: 34 }}
                      title={`Change background color for ${preset.label}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* FORM: CONTACT & SOCIAL MEDIA SETTINGS                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Column 1: Social Media Links */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-share-fill text-primary" />
                <span>Official Social Media Channels</span>
              </h5>
              <p className="text-muted small mb-4">
                These URLs control the social icons displayed in the footer across the website.
              </p>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-youtube text-danger me-1" /> YouTube Channel Link
                </label>
                <input
                  type="url"
                  name="social_youtube"
                  className="form-control"
                  placeholder="https://youtube.com/@onlineclass"
                  value={settings.social_youtube || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-github text-dark me-1" /> GitHub Repository / Org Link
                </label>
                <input
                  type="url"
                  name="social_github"
                  className="form-control"
                  placeholder="https://github.com/onlineclass"
                  value={settings.social_github || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-twitter-x text-dark me-1" /> X (Twitter) Profile Link
                </label>
                <input
                  type="url"
                  name="social_twitter"
                  className="form-control"
                  placeholder="https://x.com/onlineclass"
                  value={settings.social_twitter || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-linkedin text-primary me-1" /> LinkedIn Page Link
                </label>
                <input
                  type="url"
                  name="social_linkedin"
                  className="form-control"
                  placeholder="https://linkedin.com/company/onlineclass"
                  value={settings.social_linkedin || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Academic Security & Help Section */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill text-success" />
                <span>Academic Security &amp; Contact Information</span>
              </h5>
              <p className="text-muted small mb-4">
                Configure direct support channels for students. Clicking the email directly launches mail composing.
              </p>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-envelope-fill text-primary me-1" /> Official Support Email *
                </label>
                <input
                  type="email"
                  name="help_email"
                  className="form-control"
                  placeholder="support@onlineclass.edu"
                  required
                  value={settings.help_email || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-telephone-fill text-success me-1" /> Official Support Phone Number *
                </label>
                <input
                  type="text"
                  name="help_phone"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  required
                  value={settings.help_phone || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-geo-alt-fill text-danger me-1" /> Campus Labs / Office Location
                </label>
                <input
                  type="text"
                  name="help_address"
                  className="form-control"
                  placeholder="Academic Engineering Labs, Block C"
                  value={settings.help_address || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">
                  <i className="bi bi-card-text text-secondary me-1" /> Security Notice Description
                </label>
                <textarea
                  name="help_description"
                  className="form-control"
                  rows="3"
                  placeholder="All educational documents and video lectures are delivered with real-time DRM protection and anti-extraction mechanisms."
                  value={settings.help_description || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Submit button bar */}
          <div className="col-12 text-end">
            <button
              type="submit"
              className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow d-inline-flex align-items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill" /> Save All Settings &amp; Section Colors
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
