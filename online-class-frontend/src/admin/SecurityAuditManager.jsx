import { useEffect, useState, useCallback } from "react";
import api, { SECTION_LIST } from "../api/client";

function getEventBadge(eventType) {
  switch (eventType) {
    case "print_screen":
    case "screen_capture_blocked":
      return { label: "Screen Capture", bg: "bg-danger-subtle text-danger border border-danger-subtle", icon: "bi-camera-fill" };
    case "copy_attempt":
      return { label: "Copy Attempt", bg: "bg-warning-subtle text-dark border border-warning-subtle", icon: "bi-clipboard-x-fill" };
    case "print_attempt":
      return { label: "Print Attempt", bg: "bg-danger-subtle text-danger border border-danger-subtle", icon: "bi-printer-fill" };
    case "window_blur":
      return { label: "Window Blur", bg: "bg-info-subtle text-info-emphasis border border-info-subtle", icon: "bi-eye-slash-fill" };
    case "visibility_change":
      return { label: "Tab Switch", bg: "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle", icon: "bi-window-stack" };
    case "right_click_attempt":
      return { label: "Right Click", bg: "bg-warning-subtle text-dark border border-warning-subtle", icon: "bi-cursor-fill" };
    case "devtools_attempt":
      return { label: "DevTools Attempt", bg: "bg-dark text-white border", icon: "bi-code-slash" };
    case "document_access":
      return { label: "Document Access", bg: "bg-success-subtle text-success border border-success-subtle", icon: "bi-file-earmark-check-fill" };
    default:
      return { label: eventType || "Security Event", bg: "bg-secondary-subtle text-dark border", icon: "bi-shield-shaded" };
  }
}

export default function SecurityAuditManager() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    copy_attempts: 0,
    print_attempts: 0,
    print_screen: 0,
    window_blur: 0,
    right_clicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/security-logs", {
        params: {
          event_type: eventTypeFilter,
          section_key: sectionFilter,
          search: searchQuery,
        },
      });
      setLogs(res.data.logs || []);
      setSummary(res.data.summary || {});
      setStatus(null);
    } catch {
      setStatus({ type: "error", message: "Could not load security audit logs." });
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, sectionFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleDeleteLog(id) {
    if (!window.confirm("Are you sure you want to delete this security audit entry?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/security-logs/${id}`);
      setLogs((prev) => prev.filter((item) => item.id !== id));
      setStatus({ type: "success", message: "Security log deleted successfully." });
    } catch {
      setStatus({ type: "error", message: "Could not delete security log." });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAllLogs() {
    const filterNote =
      eventTypeFilter !== "all" || sectionFilter !== "all"
        ? " (matching current filter)"
        : "";
    if (
      !window.confirm(
        `Are you sure you want to delete and clear ALL security audit logs${filterNote}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await api.delete("/admin/security-logs", {
        params: {
          event_type: eventTypeFilter,
          section_key: sectionFilter,
        },
      });
      setStatus({ type: "success", message: res.data?.message || "Security logs cleared successfully." });
      await fetchLogs();
    } catch {
      setStatus({ type: "error", message: "Could not clear security logs." });
    } finally {
      setClearing(false);
    }
  }

  const handleResetFilters = () => {
    setEventTypeFilter("all");
    setSectionFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="oc-admin-security-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "#475569", width: 36, height: 36, fontSize: "1.1rem" }}
            >
              <i className="bi bi-shield-shaded" />
            </span>
            <span>Security &amp; Audit Logs</span>
          </h2>
          <p className="text-muted mb-0 small">
            Real-time monitoring of content protection triggers, screenshot deterrence, copy interceptions, and focus blur events.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
            onClick={handleClearAllLogs}
            disabled={clearing || logs.length === 0}
          >
            <i className="bi bi-trash3-fill" />
            <span>{clearing ? "Clearing\u2026" : "Clear All Logs"}</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Total Events</span>
              <span className="badge bg-primary-subtle text-primary rounded-pill p-2">
                <i className="bi bi-activity" />
              </span>
            </div>
            <div className="h3 fw-bold text-dark mb-0">{summary.total || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Captures</span>
              <span className="badge bg-danger-subtle text-danger rounded-pill p-2">
                <i className="bi bi-camera-fill" />
              </span>
            </div>
            <div className="h3 fw-bold text-danger mb-0">{summary.print_screen || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Copy Tries</span>
              <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill p-2">
                <i className="bi bi-clipboard-x-fill" />
              </span>
            </div>
            <div className="h3 fw-bold text-warning-emphasis mb-0">{summary.copy_attempts || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Print Tries</span>
              <span className="badge bg-danger-subtle text-danger rounded-pill p-2">
                <i className="bi bi-printer-fill" />
              </span>
            </div>
            <div className="h3 fw-bold text-danger mb-0">{summary.print_attempts || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Focus Blurs</span>
              <span className="badge bg-info-subtle text-info rounded-pill p-2">
                <i className="bi bi-eye-slash-fill" />
              </span>
            </div>
            <div className="h3 fw-bold text-info mb-0">{summary.window_blur || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Right Clicks</span>
              <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill p-2">
                <i className="bi bi-cursor-fill" />
              </span>
            </div>
            <div className="h3 fw-bold text-secondary-emphasis mb-0">{summary.right_clicks || 0}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <label className="form-label text-muted text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              Event Type
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
            >
              <option value="all">All Security Events</option>
              <option value="print_screen">Screen Capture / PrintScreen</option>
              <option value="screen_capture_blocked">Screen Capture Blocked</option>
              <option value="copy_attempt">Copy / Text Selection</option>
              <option value="print_attempt">Print Attempts</option>
              <option value="window_blur">Window Blur / Focus Lost</option>
              <option value="right_click_attempt">Right Click Attempts</option>
              <option value="visibility_change">Tab Visibility Changes</option>
              <option value="document_access">Document Access / Opens</option>
              <option value="devtools_attempt">DevTools Attempts</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label text-muted text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              Workspace Scope
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">All Workspaces</option>
              {SECTION_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label text-muted text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              Search
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="User name, IP, session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-1 d-flex align-items-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 rounded-3"
              style={{ marginTop: "1.45rem" }}
              title="Reset Filters"
              onClick={handleResetFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2 px-3 mb-4 rounded-3 shadow-sm`}>
          <i className={`bi ${status.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-octagon-fill"} me-2`} />
          {status.message}
        </div>
      )}

      {/* Logs Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 140 }}>Timestamp</th>
                <th>Event Type</th>
                <th>User &amp; Session</th>
                <th>Workspace</th>
                <th>Client Context &amp; Details</th>
                <th style={{ width: 80, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading security audit trail&hellip;
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-shield-check fs-2 text-success d-block mb-2" />
                    <span className="fw-semibold">No security events matching this filter</span>
                    <p className="small text-muted mb-0 mt-1">
                      {searchQuery || eventTypeFilter !== "all" || sectionFilter !== "all"
                        ? "Try clearing filters to see more results."
                        : "No deterrence events have been recorded."}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => {
                  const badge = getEventBadge(log.event_type);
                  const section = SECTION_LIST.find((s) => s.key === log.section_key);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="text-muted font-monospace small">
                          {new Date(log.created_at).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badge.bg} rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1`}>
                          <i className={`bi ${badge.icon}`} />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold border"
                            style={{ width: 30, height: 30, fontSize: "0.75rem" }}
                          >
                            {(log.username || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{log.username || "Anonymous"}</div>
                            <small className="text-muted font-monospace" style={{ fontSize: "0.72rem" }}>
                              {log.session_id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {section ? (
                          <span className="badge bg-light text-dark border rounded-pill px-2 py-1">
                            <i className={`bi ${section.icon} me-1`} style={{ color: section.color }} />
                            {section.title}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border rounded-pill px-2 py-1">
                            {log.section_key || "General"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-monospace text-muted small">
                          IP: {log.ip_address || "127.0.0.1"}
                        </div>
                        {log.meta && (
                          <div className="text-muted small mt-1" style={{ fontSize: "0.76rem" }}>
                            {typeof log.meta === "object"
                              ? Object.entries(log.meta)
                                  .filter(([k]) => k !== "url" && k !== "client_time")
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(" • ")
                              : String(log.meta)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                          title="Delete log entry"
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deletingId === log.id}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
