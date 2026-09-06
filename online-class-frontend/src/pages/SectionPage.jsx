import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { submitProxyMessage, submitStudentRegistration } from "../api/client";
import VideoLock from "../components/VideoLock.jsx";
import ProtectedContentContainer from "../components/ProtectedContentContainer.jsx";
import DynamicWatermark from "../components/DynamicWatermark.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";

function isVideoFile(filename) {
  if (!filename) return false;
  const clean = String(filename).split("?")[0].split("#")[0];
  return /\.(mp4|webm|ogg|mov|mkv|m4v|avi)$/i.test(clean) || String(filename).includes("/stream");
}

function isImageFile(filename) {
  if (!filename) return false;
  const clean = String(filename).split("?")[0].split("#")[0];
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(clean);
}

function isPdfFile(filename) {
  if (!filename) return false;
  const clean = String(filename).split("?")[0].split("#")[0];
  return /\.pdf$/i.test(clean);
}

function isVideoUrl(url) {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\/stream)/i.test(url);
}

function getEmbedVideoUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }
  return url;
}

export default function SectionPage({ section }) {
  const { user } = useUserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Protected View Modal state
  const [activeViewItem, setActiveViewItem] = useState(null);
  const [docViewSize, setDocViewSize] = useState("medium"); // "medium" | "expanded"
  const [docZoom, setDocZoom] = useState(1); // 0.5 to 2.5

  // Prevent background page scrolling while modal viewer is active
  useEffect(() => {
    if (activeViewItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeViewItem]);

  // Proxy Support Form State
  const [proxyForm, setProxyForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    subject: "",
    missed_session_date: "",
    urgency: "normal",
    message: "",
  });
  const [proxySubmitting, setProxySubmitting] = useState(false);
  const [proxyNotice, setProxyNotice] = useState(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    course_track: "Full Stack Python & Backend",
    background: "Student",
    preferred_batch: "Evening Batch (6:00 PM - 8:00 PM)",
    notes: "",
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regNotice, setRegNotice] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get(`/sections/${section.key}`)
      .then((res) => {
        setItems(res.data.data);
        setError(null);
      })
      .catch(() => setError("Couldn't load this section right now. Try again shortly."))
      .finally(() => setLoading(false));
  }, [section.key]);

  useEffect(() => {
    load();
  }, [load]);

  // Update form defaults when user logs in/changes
  useEffect(() => {
    if (user) {
      setProxyForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
      setRegForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  function handleOpenViewer(item) {
    setActiveViewItem(item);
  }

  function handleCloseViewer() {
    setActiveViewItem(null);
    setDocZoom(1);
  }

  async function handleProxySubmit(e) {
    e.preventDefault();
    setProxySubmitting(true);
    setProxyNotice(null);
    try {
      const res = await submitProxyMessage(proxyForm);
      setProxyNotice({
        type: "success",
        msg: res.data?.message || "Your proxy support request has been submitted! An instructor will respond shortly.",
      });
      setProxyForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        missed_session_date: "",
        urgency: "normal",
        message: "",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Error submitting proxy message. Please check all fields.";
      setProxyNotice({ type: "danger", msg });
    } finally {
      setProxySubmitting(false);
    }
  }

  async function handleRegSubmit(e) {
    e.preventDefault();
    setRegSubmitting(true);
    setRegNotice(null);
    try {
      const res = await submitStudentRegistration(regForm);
      setRegNotice({
        type: "success",
        msg: res.data?.message || "Your registration form has been submitted successfully! We will contact you shortly.",
      });
      setRegForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        course_track: "Full Stack Python & Backend",
        background: "Student",
        preferred_batch: "Evening Batch (6:00 PM - 8:00 PM)",
        notes: "",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Error submitting registration. Please check all fields.";
      setRegNotice({ type: "danger", msg });
    } finally {
      setRegSubmitting(false);
    }
  }

  return (
    <ProtectedContentContainer
      sectionKey={section.key}
      sectionTitle={section.title}
    >
      <header className="oc-page-header" data-section={section.key}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="text-white-50 text-decoration-none d-inline-flex align-items-center gap-1"
              style={{ fontSize: "0.85rem" }}
            >
              <i className="bi bi-arrow-left" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="d-flex align-items-center gap-2">
              <span className="oc-drm-badge">
                <i className="bi bi-shield-lock-fill text-success" /> Academic Protection Active
              </span>
            </div>
          </div>

          <h1
            className="mt-2 mb-2 d-flex align-items-center gap-3"
            style={{ fontSize: "clamp(1.9rem, 4vw, 2.5rem)" }}
          >
            <span
              className="oc-folder-icon"
              style={{ background: section.color, width: 44, height: 44, fontSize: "1.3rem" }}
            >
              <i className={`bi ${section.icon}`} />
            </span>
            <span>{section.title}</span>
          </h1>
          <p className="mb-0" style={{ color: "rgba(255,255,255,.82)", maxWidth: 600 }}>
            {section.tagline}
          </p>
        </div>
      </header>

      <div className="container py-5">
        {/* ============================================================
            1. PROXY SUPPORT INTERACTIVE FORM (When in Proxy Support)
            ============================================================ */}
        {section.key === "proxy_support" && (
          <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mb-5 bg-white">
            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="p-3 bg-primary-subtle text-primary rounded-3 fs-4">
                <i className="bi bi-chat-left-dots-fill" />
              </span>
              <div>
                <h2 className="h4 fw-bold mb-1 text-dark">Send Proxy Support Message &amp; Session Request</h2>
                <p className="text-muted mb-0 small">
                  Need assistance with a missed lecture, proxy notes, or stand-in coverage? Submit your message directly to your instructor.
                </p>
              </div>
            </div>

            {proxyNotice && (
              <div className={`alert alert-${proxyNotice.type} py-3 px-4 rounded-3 mb-4 shadow-sm`}>
                <i className={`bi ${proxyNotice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
                {proxyNotice.msg}
              </div>
            )}

            <form onSubmit={handleProxySubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">Your Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. Rahul Sharma"
                    value={proxyForm.name}
                    onChange={(e) => setProxyForm({ ...proxyForm, name: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark small">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. rahul@example.com"
                    value={proxyForm.email}
                    onChange={(e) => setProxyForm({ ...proxyForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Phone / WhatsApp (Optional)</label>
                  <input
                    type="text"
                    className="form-control rounded-pill px-3"
                    placeholder="+91 9876543210"
                    value={proxyForm.phone}
                    onChange={(e) => setProxyForm({ ...proxyForm, phone: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Subject / Course Module</label>
                  <input
                    type="text"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. Python Backend Session 4"
                    value={proxyForm.subject}
                    onChange={(e) => setProxyForm({ ...proxyForm, subject: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Missed Session Date / Timing</label>
                  <input
                    type="text"
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. Yesterday 7:00 PM"
                    value={proxyForm.missed_session_date}
                    onChange={(e) => setProxyForm({ ...proxyForm, missed_session_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Message &amp; Support Request</label>
                <textarea
                  required
                  rows={4}
                  className="form-control rounded-4 p-3"
                  placeholder="Explain why you missed the session and what materials, recording, or instructor support you need..."
                  value={proxyForm.message}
                  onChange={(e) => setProxyForm({ ...proxyForm, message: e.target.value })}
                />
              </div>

              <div className="row align-items-center g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center gap-3">
                    <span className="fw-semibold text-dark small">Urgency:</span>
                    <div className="form-check form-check-inline mb-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="urgency"
                        id="urgencyNormal"
                        value="normal"
                        checked={proxyForm.urgency === "normal"}
                        onChange={(e) => setProxyForm({ ...proxyForm, urgency: e.target.value })}
                      />
                      <label className="form-check-label small" htmlFor="urgencyNormal">Standard</label>
                    </div>
                    <div className="form-check form-check-inline mb-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="urgency"
                        id="urgencyUrgent"
                        value="urgent"
                        checked={proxyForm.urgency === "urgent"}
                        onChange={(e) => setProxyForm({ ...proxyForm, urgency: e.target.value })}
                      />
                      <label className="form-check-label small text-danger fw-bold" htmlFor="urgencyUrgent">Urgent Priority</label>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 text-md-end">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 py-2 fw-semibold"
                    disabled={proxySubmitting}
                  >
                    {proxySubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2" /> Send Proxy Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================
            2. STUDENT REGISTRATION INTERACTIVE FORM (When in Registrations)
            ============================================================ */}
        {section.key === "registration" && (
          <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mb-5 bg-white">
            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="p-3 bg-success-subtle text-success rounded-3 fs-4">
                <i className="bi bi-pencil-square" />
              </span>
              <div>
                <h2 className="h4 fw-bold mb-1 text-dark">Student Course &amp; Batch Registration</h2>
                <p className="text-muted mb-0 small">
                  Fill out your details to enroll in upcoming live cohorts, specialized engineering tracks, and interactive classes.
                </p>
              </div>
            </div>

            {regNotice && (
              <div className={`alert alert-${regNotice.type} py-3 px-4 rounded-3 mb-4 shadow-sm`}>
                <i className={`bi ${regNotice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
                {regNotice.msg}
              </div>
            )}

            <form onSubmit={handleRegSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. Priya Sharma"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="e.g. priya@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    className="form-control rounded-pill px-3"
                    placeholder="+91 9876543210"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Select Engineering Track</label>
                  <select
                    className="form-select rounded-pill px-3"
                    value={regForm.course_track}
                    onChange={(e) => setRegForm({ ...regForm, course_track: e.target.value })}
                  >
                    <option value="Full Stack Python & Backend">Full Stack Python &amp; Flask</option>
                    <option value="Modern Frontend & React">Modern Frontend &amp; React 19</option>
                    <option value="Machine Learning & Applied AI">Machine Learning &amp; Applied AI</option>
                    <option value="Database Engineering & SQL">Database Engineering &amp; SQL</option>
                    <option value="All-Inclusive Classroom Access">All-Inclusive Classroom Access</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Current Background</label>
                  <select
                    className="form-select rounded-pill px-3"
                    value={regForm.background}
                    onChange={(e) => setRegForm({ ...regForm, background: e.target.value })}
                  >
                    <option value="Student / College Degree">Student / College Degree</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Career Switcher">Career Switcher</option>
                    <option value="Freelancer / Other">Freelancer / Other</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-dark small">Preferred Batch Timing</label>
                  <select
                    className="form-select rounded-pill px-3"
                    value={regForm.preferred_batch}
                    onChange={(e) => setRegForm({ ...regForm, preferred_batch: e.target.value })}
                  >
                    <option value="Morning Batch (8:00 AM - 10:00 AM)">Morning Batch (8:00 AM - 10:00 AM)</option>
                    <option value="Evening Batch (6:00 PM - 8:00 PM)">Evening Batch (6:00 PM - 8:00 PM)</option>
                    <option value="Weekend Intensive Cohort">Weekend Intensive Cohort</option>
                    <option value="Self-Paced with Mentor Support">Self-Paced with Mentor Support</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-dark small">Additional Notes / Learning Goals</label>
                <textarea
                  rows={3}
                  className="form-control rounded-4 p-3"
                  placeholder="Tell us about any specific tools, prerequisites, or queries you'd like to address..."
                  value={regForm.notes}
                  onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                />
              </div>

              <div className="text-end">
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 py-2 fw-semibold"
                  disabled={regSubmitting}
                >
                  {regSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Submitting Registration...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2" /> Complete Registration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Header for Posted Resources */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-collection-play text-primary" />
            <span>Posted Resources &amp; Lecture Materials ({items.length})</span>
          </h3>
          <span className="badge bg-light text-muted border">
            Updated in real-time
          </span>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-mono text-muted">Loading resources&hellip;</p>
          </div>
        )}
        {error && <div className="alert alert-danger py-3">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="oc-empty">
            <i className="bi bi-inbox mb-2" style={{ fontSize: "2.5rem" }} />
            <h4 className="mt-2 mb-1">No items posted yet</h4>
            <p className="text-muted mb-0">Check back once your instructor uploads content to this section.</p>
          </div>
        )}

        <div className="row g-3">
          {items.map((item) => {
            const fileName = item.file_name || item.file_url || "";
            const isFileVideo = item.is_video ?? isVideoFile(fileName);
            const isLinkVideo = isVideoUrl(item.link);
            const isVideo = isFileVideo || isLinkVideo;
            const isImage = isImageFile(fileName);
            const isPdf = isPdfFile(fileName);
            const isLocked = Boolean(item.locked);

            return (
              <div className="col-12" key={item.id}>
                <div className="oc-index-card">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <h3 className="mb-1 d-flex align-items-center gap-2" style={{ fontSize: "1.2rem" }}>
                      {isVideo ? (
                        <i className="bi bi-play-circle text-danger" />
                      ) : isImage ? (
                        <i className="bi bi-image text-info" />
                      ) : isPdf ? (
                        <i className="bi bi-file-earmark-pdf text-danger" />
                      ) : (
                        <i className="bi bi-file-earmark-text text-primary" />
                      )}
                      <span>{item.title}</span>
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark-subtle text-white-50 border border-secondary-subtle" style={{ fontSize: "0.72rem" }}>
                        <i className="bi bi-shield-check me-1 text-success" /> DRM View
                      </span>
                      {item.event_date && (
                        <span className="oc-meta badge bg-light text-dark border">
                          <i className="bi bi-clock me-1 text-primary" />
                          {new Date(item.event_date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="mb-3 mt-2 text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.55 }}>
                      {item.description}
                    </p>
                  )}

                  {/* Video Player — Locked or Unlocked with no-download controls */}
                  {isLocked && isVideo && <VideoLock onUnlocked={load} />}

                  {/* Uploaded Video Player */}
                  {!isLocked && item.file_url && isFileVideo && (
                    <div className="mt-2 mb-3">
                      <video
                        controls
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        disablePictureInPicture
                        disableRemotePlayback
                        onContextMenu={(e) => e.preventDefault()}
                        preload="metadata"
                        playsInline
                        className="w-100 rounded-3 shadow-sm"
                        style={{ maxHeight: "460px", backgroundColor: "#0b1329" }}
                        src={item.file_url}
                      >
                        <source src={item.file_url} />
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}

                  {/* Embedded Video Link Player (YouTube / Vimeo / Video Link) */}
                  {!isLocked && item.link && isLinkVideo && !isFileVideo && (
                    <div className="mt-2 mb-3">
                      <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-black shadow-sm" style={{ maxHeight: "460px" }}>
                        <iframe
                          src={getEmbedVideoUrl(item.link)}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Inline Protected Image Preview (if image) */}
                  {!isLocked && item.file_url && isImage && (
                    <div
                      className="mt-2 mb-3 position-relative rounded overflow-hidden"
                      style={{ maxHeight: 320, backgroundColor: "#0b1329", border: "1px solid rgba(255,255,255,0.1)" }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="w-100 h-100"
                        style={{
                          maxHeight: 320,
                          objectFit: "contain",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          pointerEvents: "none",
                        }}
                        draggable={false}
                      />
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-dark text-white opacity-75" style={{ fontSize: "0.72rem" }}>
                          <i className="bi bi-shield-lock me-1" /> Protected Preview
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons — VIEW ONLY (NO DOWNLOAD BUTTONS) */}
                  <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top align-items-center">
                    {item.file_url && !isFileVideo && (
                      <button
                        type="button"
                        className="btn btn-sm btn-oc-primary d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenViewer(item)}
                      >
                        <i className="bi bi-eye-fill me-1" />
                        {isImage
                          ? "View Image (Protected)"
                          : isPdf
                          ? "View PDF Document (Protected)"
                          : "View Document (Protected)"}
                      </button>
                    )}

                    {isVideo && !isLocked && (item.file_url || item.link) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenViewer(item)}
                      >
                        <i className="bi bi-play-circle-fill me-1" />
                        View Video Player
                      </button>
                    )}

                    {item.link && !isLinkVideo && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-oc-outline d-inline-flex align-items-center gap-1"
                      >
                        <i className="bi bi-box-arrow-up-right me-1" />
                        Open External Resource
                      </a>
                    )}

                    <span className="ms-auto text-muted" style={{ fontSize: "0.78rem" }}>
                      <i className="bi bi-lock-fill me-1 text-success" />
                      View-only protection active
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          PROTECTED DOCUMENT / PDF / IMAGE / VIDEO MODAL VIEWER (NO DOWNLOAD)
          ============================================================ */}
      {activeViewItem && (
        <div
          className={`oc-doc-viewer-modal-backdrop ${docViewSize === "expanded" ? "oc-doc-viewer-modal-backdrop--expanded" : ""}`}
          onClick={handleCloseViewer}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className={`oc-doc-viewer-modal ${docViewSize === "expanded" ? "oc-doc-viewer-modal--expanded" : "oc-doc-viewer-modal--medium"}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Modal Header */}
            <div className="oc-doc-viewer-header">
              <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: "1 1 200px" }}>
                <span className={`oc-popover-icon text-white flex-shrink-0 ${activeViewItem.is_video || isVideoFile(activeViewItem.file_name || activeViewItem.file_url) || isVideoUrl(activeViewItem.link) ? "bg-danger" : "bg-primary"}`}>
                  <i className={`bi ${activeViewItem.is_video || isVideoFile(activeViewItem.file_name || activeViewItem.file_url) || isVideoUrl(activeViewItem.link) ? "bi-play-circle-fill" : "bi-shield-lock"}`} />
                </span>
                <div className="overflow-hidden">
                  <h5 className="mb-0 text-white text-truncate" style={{ fontSize: "0.95rem" }} title={activeViewItem.title}>
                    {activeViewItem.title}
                  </h5>
                  <small className="text-white-50 text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                    Protected Content Viewer &bull; DRM Active
                  </small>
                </div>
              </div>
              <div className="oc-viewer-controls d-flex align-items-center flex-wrap gap-2">
                {/* Zoom Controls (Active for documents / images / PDFs) */}
                {!activeViewItem.is_video && !isVideoFile(activeViewItem.file_name || activeViewItem.file_url) && !isVideoUrl(activeViewItem.link) && (
                  <div className="oc-doc-zoom-toolbar" role="group" aria-label="Document Zoom">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setDocZoom((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
                      title="Zoom Out (-25%)"
                      disabled={docZoom <= 0.5}
                    >
                      <i className="bi bi-dash-lg" />
                    </button>
                    <span
                      className="oc-doc-zoom-val"
                      onClick={() => setDocZoom(1)}
                      title="Click to reset zoom to 100%"
                    >
                      {Math.round(docZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setDocZoom((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)))}
                      title="Zoom In (+25%)"
                      disabled={docZoom >= 2.5}
                    >
                      <i className="bi bi-plus-lg" />
                    </button>
                    {docZoom !== 1 && (
                      <button
                        type="button"
                        className="btn oc-doc-zoom-reset-btn"
                        onClick={() => setDocZoom(1)}
                        title="Reset Zoom to 100%"
                      >
                        <i className="bi bi-arrow-counterclockwise me-1" /> Reset
                      </button>
                    )}
                  </div>
                )}

                {/* Sizing Switcher (Medium vs Entire Website) */}
                <div className="oc-view-size-btn-group" role="group" aria-label="Viewer Size">
                  <button
                    type="button"
                    className={`btn ${docViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                    onClick={() => {
                      setDocViewSize("medium");
                      setDocZoom(1);
                    }}
                    title="Switch to Medium View"
                  >
                    <i className="bi bi-window me-1" />
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${docViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                    onClick={() => setDocViewSize("expanded")}
                    title="Display Entire Website Width"
                  >
                    <i className="bi bi-arrows-fullscreen me-1" />
                    <span>Entire Website</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, padding: 0, border: "1px solid rgba(255, 255, 255, 0.25)" }}
                  onClick={handleCloseViewer}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            {/* Modal Content Body with Watermark */}
            <div className={`oc-doc-viewer-body position-relative ${docViewSize === "expanded" ? "oc-doc-viewer-body--expanded" : "oc-doc-viewer-body--medium"}`}>
              {!((activeViewItem.is_video ?? isVideoFile(activeViewItem.file_name || activeViewItem.file_url)) || isVideoUrl(activeViewItem.link)) && (
                <DynamicWatermark
                  username={user?.name || "Student Viewer"}
                  sessionId="CONFIDENTIAL-DRM"
                  sectionTitle={section.title}
                />
              )}

              {isImageFile(activeViewItem.file_name || activeViewItem.file_url) ? (
                <div
                  className="w-100 h-100 p-3"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "70vh",
                    overflow: "auto",
                    display: "flex",
                    alignItems: docZoom <= 1 ? "center" : "flex-start",
                    justifyContent: docZoom <= 1 ? "center" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      margin: "auto",
                      textAlign: "center",
                      transition: "all 0.2s ease-out",
                    }}
                  >
                    <img
                      src={activeViewItem.file_url}
                      alt={activeViewItem.title}
                      style={{
                        width: docZoom !== 1 ? `${Math.round(docZoom * 100)}%` : "100%",
                        maxWidth: docZoom <= 1 ? "100%" : "none",
                        maxHeight: docZoom <= 1 ? (docViewSize === "expanded" ? "calc(100vh - 200px)" : "70vh") : "none",
                        objectFit: "contain",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        pointerEvents: "none",
                        borderRadius: "8px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
              ) : isPdfFile(activeViewItem.file_name || activeViewItem.file_url) ? (
                <div
                  className="w-100 h-100 position-relative p-2"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "70vh",
                    overflow: "auto",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(docZoom * 100)}%`,
                      minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 70)}vh` : "70vh"),
                      height: docZoom > 1 ? `${Math.round(docZoom * 100)}%` : "100%",
                      margin: "0 auto",
                      transition: "width 0.2s ease-out, min-height 0.2s ease-out",
                    }}
                  >
                    <iframe
                      key={`section-pdf-${activeViewItem.id || activeViewItem._id || activeViewItem.title}-${docViewSize}`}
                      src={`${activeViewItem.file_url}#view=FitH&toolbar=0&navpanes=0`}
                      title={activeViewItem.title}
                      className="w-100 h-100 rounded border-0"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 70)}vh` : "70vh"),
                        backgroundColor: "#1e293b",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              ) : (activeViewItem.is_video ?? isVideoFile(activeViewItem.file_name || activeViewItem.file_url)) || isVideoUrl(activeViewItem.link) ? (
                <div className="w-100 h-100 p-2 d-flex align-items-center justify-content-center" style={{ minHeight: docViewSize === "expanded" ? "calc(100vh - 120px)" : "70vh" }}>
                  <div className="w-100 h-100 rounded-3 overflow-hidden bg-black shadow position-relative d-flex align-items-center justify-content-center" style={{ maxHeight: docViewSize === "expanded" ? "calc(96vh - 150px)" : "68vh" }}>
                    {activeViewItem.file_url && (activeViewItem.is_video ?? isVideoFile(activeViewItem.file_name || activeViewItem.file_url)) ? (
                      <video
                        controls
                        autoPlay
                        playsInline
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        disablePictureInPicture
                        disableRemotePlayback
                        onContextMenu={(e) => e.preventDefault()}
                        src={activeViewItem.file_url}
                        className="w-100 h-100"
                        style={{ maxHeight: docViewSize === "expanded" ? "calc(96vh - 150px)" : "68vh", objectFit: "contain" }}
                      >
                        <source src={activeViewItem.file_url} />
                        Your browser does not support video playback.
                      </video>
                    ) : (
                      <iframe
                        src={getEmbedVideoUrl(activeViewItem.link)}
                        title={activeViewItem.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                        className="w-100 h-100 border-0"
                        style={{ minHeight: docViewSize === "expanded" ? "calc(96vh - 150px)" : "66vh" }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-white text-center">
                  <i className="bi bi-file-earmark-lock text-warning mb-3" style={{ fontSize: "3rem" }} />
                  <h4 className="text-white mb-2">{activeViewItem.title}</h4>
                  <p className="text-white-50 mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
                    {activeViewItem.description || "This document is protected under the Online Class DRM system. Direct downloading is disabled by the administrator."}
                  </p>
                  <div className="badge bg-warning text-dark p-2">
                    <i className="bi bi-shield-check me-1" />
                    Encrypted Asset &mdash; Copying and Extraction Restricted
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="oc-doc-viewer-footer d-flex justify-content-between align-items-center">
              <span className="text-white-50" style={{ fontSize: "0.8rem" }}>
                <i className="bi bi-lock me-1 text-success" />
                Anti-Download &amp; Watermark Enforcement Active
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCloseViewer}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedContentContainer>
  );
}
