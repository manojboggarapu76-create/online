import { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = {
  title: "",
  description: "",
  link: "",
  event_date: "",
  is_active: true,
  file: null,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB in bytes

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SectionManager({ section }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [formError, setFormError] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/admin/items", { params: { section: section.key } })
      .then((res) => setItems(res.data.data))
      .catch(() => setError("Couldn't load items for this section."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.key]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setFormError(null);
    setUploadProgress(null);
  }

  function openEdit(item) {
    setForm({
      title: item.title,
      description: item.description || "",
      link: item.link || "",
      event_date: item.event_date ? item.event_date.slice(0, 16) : "",
      is_active: item.is_active,
      file: null,
    });
    setEditingId(item.id);
    setFormOpen(true);
    setUploadProgress(null);
  }

  function handleFileChange(e) {
    const selected = e.target.files[0] || null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFormError(`Selected file (${formatBytes(selected.size)}) exceeds the maximum 5GB limit.`);
      e.target.value = "";
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }
    setFormError(null);
    setForm((prev) => ({ ...prev, file: selected }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setUploadProgress(null);

    const body = new FormData();
    body.append("section", section.key);
    body.append("title", form.title);
    body.append("description", form.description || "");
    body.append("link", form.link || "");
    if (form.event_date) body.append("event_date", form.event_date);
    body.append("is_active", form.is_active ? "1" : "0");
    if (form.file) body.append("file", form.file);

    const axiosConfig = {
      timeout: 0,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percent,
          });
        }
      },
    };

    try {
      if (editingId) {
        body.append("_method", "PUT");
        await api.post(`/admin/items/${editingId}`, body, axiosConfig);
      } else {
        await api.post("/admin/items", body, axiosConfig);
      }
      resetForm();
      load();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const message = err?.response?.data?.message;
      if (errors) {
        setFormError(Object.values(errors).flat().join(" "));
      } else if (message) {
        setFormError(message);
      } else if (err?.message) {
        setFormError(err.message);
      } else {
        setFormError("Couldn't save. Check the fields and try again.");
      }
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    await api.delete(`/admin/items/${item.id}`);
    load();
  }

  const sectionColor = section.color || "#0284c7";

  return (
    <div className="oc-section-manager-wrap">
      <div
        className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-4 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${sectionColor}15 0%, #ffffff 100%)`,
          border: `1px solid ${sectionColor}30`,
          borderLeft: `6px solid ${sectionColor}`,
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
              style={{ width: 32, height: 32, background: sectionColor, fontSize: "1rem" }}
            >
              <i className={`bi ${section.icon || "bi-folder-fill"}`} />
            </span>
            <h2 className="h4 fw-bold mb-0 text-dark">{section.title}</h2>
          </div>
          <p className="mb-0 text-muted small">
            {section.tagline}
          </p>
        </div>
        {!formOpen && (
          <button
            className="btn text-white px-4 py-2 rounded-pill fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
            style={{ background: sectionColor, border: "none" }}
            onClick={() => setFormOpen(true)}
          >
            <i className="bi bi-plus-lg" /> Add item
          </button>
        )}
      </div>

      {formOpen && (
        <form
          className="oc-index-card mb-4 rounded-4 shadow-sm p-4 bg-white"
          style={{ borderTop: `4px solid ${sectionColor}` }}
          onSubmit={handleSubmit}
        >
          <h3 style={{ fontSize: "1.05rem" }}>{editingId ? "Edit item" : "New item"}</h3>

          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Link (meeting / registration / external URL)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date &amp; time (optional)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Attach file (Video up to 5GB, PDF, slides, doc &mdash; optional)</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
            />
            {form.file && (
              <div className="small text-muted mt-1">
                <i className="bi bi-file-earmark-check me-1" />
                Selected: <strong>{form.file.name}</strong> ({formatBytes(form.file.size)})
              </div>
            )}
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id={`active-${section.key}`}
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <label className="form-check-label" htmlFor={`active-${section.key}`}>
              Visible to students
            </label>
          </div>

          {saving && uploadProgress && form.file && (
            <div className="mb-3 p-2 bg-light rounded border">
              <div className="d-flex justify-content-between mb-1 small text-muted">
                <span>
                  <i className="bi bi-cloud-arrow-up me-1" />
                  Uploading file: {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
                </span>
                <span className="fw-bold">{uploadProgress.percent}%</span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                  role="progressbar"
                  style={{ width: `${uploadProgress.percent}%` }}
                  aria-valuenow={uploadProgress.percent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          )}

          {formError && <div className="alert alert-danger py-2">{formError}</div>}

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-oc-primary" disabled={saving}>
              {saving
                ? uploadProgress
                  ? `Uploading (${uploadProgress.percent}%)\u2026`
                  : "Saving\u2026"
                : editingId
                ? "Save changes"
                : "Publish"}
            </button>
            <button type="button" className="btn btn-oc-outline" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-mono">Loading&hellip;</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && items.length === 0 && (
        <div className="oc-empty">Nothing posted in this section yet.</div>
      )}

      {items.map((item) => (
        <div className={`oc-admin-item-row ${item.is_active ? "" : "oc-inactive"}`} key={item.id}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center">
                <span
                  className="oc-badge-dot"
                  style={{ background: item.is_active ? "var(--forest)" : "var(--ink-40)" }}
                />
                <strong>{item.title}</strong>
              </div>
              {item.description && (
                <p className="mb-1 mt-1" style={{ fontSize: "0.9rem", color: "var(--ink-60)" }}>
                  {item.description}
                </p>
              )}
              <div className="oc-meta d-flex gap-3 flex-wrap">
                {item.event_date && <span>{new Date(item.event_date).toLocaleString()}</span>}
                {item.file_name && (
                  <span>
                    <i className="bi bi-paperclip me-1" />
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "inherit", textDecoration: "underline" }}
                      >
                        {item.file_name}
                      </a>
                    ) : (
                      item.file_name
                    )}
                  </span>
                )}
                {item.link && <span>has link</span>}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-oc-outline" onClick={() => openEdit(item)}>
                Edit
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
