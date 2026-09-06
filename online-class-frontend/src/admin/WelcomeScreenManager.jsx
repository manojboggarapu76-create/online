import { useState, useEffect, useRef } from "react";
import api from "../api/client";

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg)$/i;
const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|mkv|m4v|avi)$/i;
const MAX_BYTES = 5 * 1024 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function WelcomeScreenManager() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  // Dashboard logo state
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoStatus, setLogoStatus] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const logoRef = useRef();

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [duration, setDuration] = useState(6);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/welcome-screen")
      .then((res) => {
        const d = res.data;
        setSettings(d);
        setTitle(d.title || "Online Class");
        setTagline(d.tagline || "Your whole classroom, in one binder");
        setDuration(d.duration || 6);
      })
      .catch(() => setStatus({ type: "error", message: "Could not load Welcome Screen settings." }))
      .finally(() => setLoading(false));
  }, []);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setStatus({ type: "error", message: `File too large. Max 5 GB. Your file: ${formatBytes(f.size)}.` });
      e.target.value = "";
      return;
    }
    if (!IMAGE_EXTS.test(f.name) && !VIDEO_EXTS.test(f.name)) {
      setStatus({ type: "error", message: "Please select a valid image (JPG, PNG, GIF, WebP) or video (MP4, WebM, MOV, MKV) file." });
      e.target.value = "";
      return;
    }
    setStatus(null);
    setSelectedFile(f);
  }

  function handleLogoChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!IMAGE_EXTS.test(f.name)) {
      setLogoStatus({ type: "error", message: "Please select a valid image (JPG, PNG, GIF, WebP, SVG)." });
      e.target.value = "";
      return;
    }
    setLogoStatus(null);
    setSelectedLogo(f);
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("tagline", tagline);
      form.append("duration", duration);
      if (selectedFile) form.append("file", selectedFile);
      const res = await api.post("/admin/welcome-screen", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setSettings(res.data);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setStatus({ type: "success", message: "Welcome Screen updated successfully!" });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setStatus({
        type: "error",
        message: errors ? Object.values(errors).flat().join(" ") : "Could not save Welcome Screen settings.",
      });
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  async function handleRemoveMedia() {
    if (!window.confirm("Remove current media? The welcome screen will revert to the default style.")) return;
    setStatus(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("remove_media", "1");
      const res = await api.post("/admin/welcome-screen", form);
      setSettings(res.data);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setStatus({ type: "success", message: "Media removed. Welcome Screen reverted to default." });
    } catch {
      setStatus({ type: "error", message: "Could not remove media." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLogo(e) {
    e.preventDefault();
    if (!selectedLogo) return;
    setLogoStatus(null);
    setLogoSaving(true);
    try {
      const form = new FormData();
      form.append("dashboard_logo", selectedLogo);
      const res = await api.post("/admin/welcome-screen", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSettings(res.data);
      if (res.data?.dashboard_logo_url) {
        sessionStorage.setItem("oc_cache_dashboard_logo", res.data.dashboard_logo_url);
        sessionStorage.setItem("oc_cached_education_logo", res.data.dashboard_logo_url);
      }
      setSelectedLogo(null);
      if (logoRef.current) logoRef.current.value = "";
      window.dispatchEvent(new Event("oc-logo-updated"));
      setLogoStatus({ type: "success", message: "Dashboard & platform logo updated successfully!" });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setLogoStatus({
        type: "error",
        message: errors ? Object.values(errors).flat().join(" ") : "Could not save dashboard logo.",
      });
    } finally {
      setLogoSaving(false);
    }
  }

  async function handleRemoveLogo() {
    if (!window.confirm("Remove the dashboard logo? The default icon will be shown instead.")) return;
    setLogoStatus(null);
    setLogoSaving(true);
    try {
      const form = new FormData();
      form.append("remove_dashboard_logo", "1");
      const res = await api.post("/admin/welcome-screen", form);
      setSettings(res.data);
      sessionStorage.removeItem("oc_cache_dashboard_logo");
      sessionStorage.removeItem("oc_cached_education_logo");
      setSelectedLogo(null);
      if (logoRef.current) logoRef.current.value = "";
      window.dispatchEvent(new Event("oc-logo-updated"));
      setLogoStatus({ type: "success", message: "Logo removed. Default icon restored across entire site." });
    } catch {
      setLogoStatus({ type: "error", message: "Could not remove dashboard logo." });
    } finally {
      setLogoSaving(false);
    }
  }

  if (loading) return <p className="text-mono">Loading&hellip;</p>;

  const hasMedia = settings?.media_type && settings.media_type !== "none" && settings?.media_url;
  const previewUrl = settings?.media_url || null;
  const hasDashboardLogo = settings?.dashboard_logo_url;

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem" }}>Welcome Screen</h2>
      <p style={{ color: "var(--ink-60)" }}>
        Customise what students see first when they open the app. Upload a photo or video that
        displays on the Welcome Screen, and set your title and tagline.
      </p>

      {hasMedia && (
        <div className="oc-index-card mb-4" style={{ maxWidth: 560 }}>
          <div className="oc-meta mb-2">
            <i className="bi bi-eye me-1" />
            Current Welcome Screen media
          </div>
          {settings.media_type === "video" ? (
            <video
              src={previewUrl}
              muted
              autoPlay
              loop
              playsInline
              controls
              className="w-100 rounded"
              style={{ maxHeight: 260, backgroundColor: "#0b192c" }}
            />
          ) : (
            <img
              src={previewUrl}
              alt="Welcome screen media"
              className="w-100 rounded"
              style={{ maxHeight: 260, objectFit: "cover" }}
            />
          )}
          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
            <span className="oc-meta">
              <i className="bi bi-paperclip me-1" />
              {settings.media_name || "Media file"}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-danger ms-auto"
              onClick={handleRemoveMedia}
              disabled={saving}
            >
              <i className="bi bi-trash me-1" />
              Remove media
            </button>
          </div>
        </div>
      )}

      <form className="oc-index-card" style={{ maxWidth: 560 }} onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label">Welcome Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Online Class"
            maxLength={255}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tagline</label>
          <input
            type="text"
            className="form-control"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Your whole classroom, in one binder"
            maxLength={255}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Auto-advance duration: <strong>{duration}s</strong>
          </label>
          <input
            type="range"
            className="form-range"
            min={2}
            max={30}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <div className="d-flex justify-content-between" style={{ fontSize: "0.78rem", color: "var(--ink-60)" }}>
            <span>2s</span><span>30s</span>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Upload Photo or Video{" "}
            <span className="oc-meta">(JPG, PNG, GIF, WebP, MP4, WebM, MOV, MKV &mdash; up to 5 GB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            className="form-control"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,.m4v,.avi"
            onChange={handleFileChange}
            disabled={saving}
          />
          {selectedFile && (
            <div className="oc-meta mt-1">
              <i className="bi bi-paperclip me-1" />
              {selectedFile.name} ({formatBytes(selectedFile.size)})
            </div>
          )}
        </div>

        {saving && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.82rem" }}>
              <span>Uploading&hellip;</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress" style={{ height: "6px" }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${uploadProgress}%`, background: "var(--marigold)" }}
              />
            </div>
          </div>
        )}

        {status && (
          <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2`}>
            {status.message}
          </div>
        )}

        <button type="submit" className="btn btn-oc-primary" disabled={saving}>
          {saving ? "Saving\u2026" : "Save Welcome Screen"}
        </button>
      </form>

      {/* ============================================================
          Dashboard Logo Manager
          ============================================================ */}
      <hr className="my-4" />
      <h2 style={{ fontSize: "1.4rem" }} className="d-flex align-items-center gap-2">
        <i className="bi bi-image text-primary" />
        Dashboard Logo
      </h2>
      <p style={{ color: "var(--ink-60)", fontSize: "0.9rem" }}>
        Upload the logo that appears on the left side of the "Main Dashboard" heading. Only admins can change this.
        Leave empty to use the default graduation cap icon.
      </p>

      {/* Logo Preview */}
      {hasDashboardLogo && (
        <div className="oc-index-card mb-3" style={{ maxWidth: 400 }}>
          <div className="oc-meta mb-2">
            <i className="bi bi-eye me-1" />
            Current Dashboard Logo
          </div>
          <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "#0b1329" }}>
            <img
              src={settings.dashboard_logo_url}
              alt="Dashboard logo"
              style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 12 }}
            />
            <div>
              <div className="text-white fw-semibold" style={{ fontSize: "0.9rem" }}>
                {settings.dashboard_logo_name || "Logo image"}
              </div>
              <div className="text-white-50" style={{ fontSize: "0.78rem" }}>
                Displayed on Dashboard page header
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-danger mt-2"
            onClick={handleRemoveLogo}
            disabled={logoSaving}
          >
            <i className="bi bi-trash me-1" />
            Remove Logo
          </button>
        </div>
      )}

      <form className="oc-index-card" style={{ maxWidth: 400 }} onSubmit={handleSaveLogo}>
        <div className="mb-3">
          <label className="form-label">
            Upload New Dashboard Logo{" "}
            <span className="oc-meta">(JPG, PNG, GIF, WebP, SVG &mdash; up to 4 MB)</span>
          </label>
          <input
            ref={logoRef}
            type="file"
            className="form-control"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleLogoChange}
            disabled={logoSaving}
          />
          {selectedLogo && (
            <div className="oc-meta mt-1">
              <i className="bi bi-paperclip me-1" />
              {selectedLogo.name} ({formatBytes(selectedLogo.size)})
            </div>
          )}
        </div>

        {logoStatus && (
          <div className={`alert ${logoStatus.type === "success" ? "alert-success" : "alert-danger"} py-2`}>
            {logoStatus.message}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-oc-primary"
          disabled={logoSaving || !selectedLogo}
        >
          {logoSaving ? "Uploading\u2026" : "Upload Dashboard Logo"}
        </button>
      </form>
    </div>
  );
}
