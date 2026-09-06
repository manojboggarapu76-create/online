import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminProxyMessages,
  updateAdminProxyMessage,
  deleteAdminProxyMessage,
} from "../api/client";

export default function ProxySupportManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [notice, setNotice] = useState(null);

  // Selected message for details / reply modal
  const [activeMessage, setActiveMessage] = useState(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminProxyMessages({
      search,
      status: statusFilter,
      urgency: urgencyFilter,
    })
      .then((res) => {
        setMessages(res.data.data || []);
      })
      .catch(() => {
        setNotice({ type: "danger", msg: "Failed to load proxy support messages." });
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, urgencyFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const showNotice = (msg, type = "success") => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleOpenDetail = (msg) => {
    setActiveMessage(msg);
    setEditStatus(msg.status || "pending");
    setEditNotes(msg.admin_notes || "");
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!activeMessage) return;
    setSaving(true);
    try {
      await updateAdminProxyMessage(activeMessage.id, {
        status: editStatus,
        admin_notes: editNotes,
      });
      showNotice("Proxy request updated successfully.");
      setActiveMessage(null);
      load();
    } catch {
      showNotice("Error updating request.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this proxy message? This cannot be undone.")) return;
    try {
      await deleteAdminProxyMessage(id);
      showNotice("Proxy request deleted.");
      load();
    } catch {
      showNotice("Error deleting request.", "danger");
    }
  };

  const pendingCount = messages.filter((m) => m.status === "pending").length;

  return (
    <div className="oc-admin-proxy-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "var(--tab-4)", width: 36, height: 36, fontSize: "1.1rem" }}
            >
              <i className="bi bi-people" />
            </span>
            <span>Proxy Support Requests &amp; Inquiries</span>
          </h2>
          <p className="text-muted mb-0 small">
            Review student stand-in coverage requests, missed class inquiries, and mentor support messages.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
            <i className="bi bi-hourglass-split me-1" /> {pendingCount} Pending Review
          </span>
          <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
            <i className="bi bi-envelope-fill me-1" /> {messages.length} Total Messages
          </span>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2 px-3 mb-4 rounded-3 shadow-sm`}>
          <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
          {notice.msg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by student name, email, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="all">All Urgencies</option>
              <option value="normal">Standard</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="col-12 col-md-1 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 rounded-pill"
              onClick={load}
              title="Refresh"
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        {!loading && messages.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2" />
            <h5 className="mt-2 mb-1">No proxy requests found</h5>
            <p className="small mb-0">Messages submitted by students from the Proxy Support page will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Student Info</th>
                  <th>Subject &amp; Missed Session</th>
                  <th>Message Preview</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="fw-bold text-dark">{m.name}</div>
                      <small className="text-muted d-block">{m.email}</small>
                      {m.phone && <small className="text-primary">{m.phone}</small>}
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{m.subject || "General Support"}</span>
                      {m.missed_session_date && (
                        <div className="text-muted small">
                          <i className="bi bi-calendar-event me-1" />
                          {m.missed_session_date}
                        </div>
                      )}
                    </td>
                    <td>
                      <p className="text-muted mb-0 text-truncate" style={{ maxWidth: 220 }}>
                        {m.message}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.urgency === "urgent" ? "bg-danger-subtle text-danger border border-danger-subtle" : "bg-light text-dark border"
                        }`}
                      >
                        {m.urgency === "urgent" ? "Urgent" : "Standard"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === "resolved"
                            ? "bg-success-subtle text-success"
                            : m.status === "in_review"
                            ? "bg-info-subtle text-info"
                            : "bg-warning-subtle text-warning"
                        }`}
                      >
                        {m.status === "resolved" ? "Resolved" : m.status === "in_review" ? "In Review" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : "-"}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenDetail(m)}
                        >
                          <i className="bi bi-eye-fill me-1" /> View / Review
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(m.id)}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review / Update Modal */}
      {activeMessage && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setActiveMessage(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-light rounded-top-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text text-primary" />
                  <span>Proxy Support Request #{activeMessage.id}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveMessage(null)}
                />
              </div>

              <form onSubmit={handleSaveStatus}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Student Name</label>
                      <div className="fw-bold">{activeMessage.name}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Email &amp; Phone</label>
                      <div>
                        <a href={`mailto:${activeMessage.email}`} className="text-primary text-decoration-none">
                          {activeMessage.email}
                        </a>
                        {activeMessage.phone && <span className="text-muted ms-2">&bull; {activeMessage.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Subject / Module</label>
                      <div className="fw-semibold">{activeMessage.subject || "General Request"}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Missed Session</label>
                      <div>{activeMessage.missed_session_date || "Not specified"}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Student's Message</label>
                    <div className="p-3 bg-light rounded-3 border" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                      {activeMessage.message}
                    </div>
                  </div>

                  <hr />

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-dark small">Update Status</label>
                      <select
                        className="form-select rounded-pill"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved / Addressed</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold text-dark small">Admin / Instructor Notes</label>
                      <input
                        type="text"
                        className="form-control rounded-pill px-3"
                        placeholder="e.g. Sent recorded lecture link & notes via email"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setActiveMessage(null)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
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
