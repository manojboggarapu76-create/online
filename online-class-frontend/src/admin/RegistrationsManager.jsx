import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminRegistrations,
  updateAdminRegistration,
  deleteAdminRegistration,
} from "../api/client";

export default function RegistrationsManager() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [notice, setNotice] = useState(null);

  // Selected registration for details / update modal
  const [activeReg, setActiveReg] = useState(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminRegistrations({
      search,
      status: statusFilter,
      course_track: trackFilter,
    })
      .then((res) => {
        setRegistrations(res.data.data || []);
      })
      .catch(() => {
        setNotice({ type: "danger", msg: "Failed to load student registrations." });
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, trackFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const showNotice = (msg, type = "success") => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleOpenDetail = (reg) => {
    setActiveReg(reg);
    setEditStatus(reg.status || "pending");
    setEditNotes(reg.admin_notes || "");
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!activeReg) return;
    setSaving(true);
    try {
      await updateAdminRegistration(activeReg.id, {
        status: editStatus,
        admin_notes: editNotes,
      });
      showNotice("Registration updated successfully.");
      setActiveReg(null);
      load();
    } catch {
      showNotice("Error updating registration.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student registration record? This cannot be undone.")) return;
    try {
      await deleteAdminRegistration(id);
      showNotice("Registration deleted.");
      load();
    } catch {
      showNotice("Error deleting registration.", "danger");
    }
  };

  const newCount = registrations.filter((r) => r.status === "pending").length;

  return (
    <div className="oc-admin-reg-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "var(--tab-5)", width: 36, height: 36, fontSize: "1.1rem" }}
            >
              <i className="bi bi-pencil-square" />
            </span>
            <span>Student Registration Submissions</span>
          </h2>
          <p className="text-muted mb-0 small">
            Manage course enrollments, applicant contacts, selected tracks, and batch admissions.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success text-white px-3 py-2 rounded-pill">
            <i className="bi bi-person-check-fill me-1" /> {newCount} New Registrations
          </span>
          <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
            <i className="bi bi-people-fill me-1" /> {registrations.length} Total Applicants
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
                placeholder="Search student name, email, or phone..."
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
              <option value="contacted">Contacted</option>
              <option value="enrolled">Enrolled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
            >
              <option value="all">All Tracks</option>
              <option value="Full Stack Python & Backend">Python &amp; Flask</option>
              <option value="Modern Frontend & React">Frontend &amp; React</option>
              <option value="Machine Learning & Applied AI">Machine Learning</option>
              <option value="Database Engineering & SQL">Database &amp; SQL</option>
              <option value="All-Inclusive Classroom Access">All-Inclusive</option>
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

      {/* Registrations Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        {!loading && registrations.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-person-x fs-1 mb-2" />
            <h5 className="mt-2 mb-1">No registrations found</h5>
            <p className="small mb-0">Forms submitted by students from the Registration page will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Student Info</th>
                  <th>Track &amp; Batch</th>
                  <th>Background</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="fw-bold text-dark">{r.name}</div>
                      <small className="text-muted d-block">{r.email}</small>
                      <small className="text-primary fw-semibold">{r.phone}</small>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-wrap">
                        {r.course_track || "General Course"}
                      </span>
                      {r.preferred_batch && (
                        <div className="text-muted small mt-1">
                          <i className="bi bi-clock me-1" />
                          {r.preferred_batch}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {r.background || "General"}
                      </span>
                    </td>
                    <td>
                      <p className="text-muted mb-0 text-truncate" style={{ maxWidth: 200 }}>
                        {r.notes || "-"}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === "enrolled"
                            ? "bg-success text-white"
                            : r.status === "contacted"
                            ? "bg-info text-white"
                            : r.status === "closed"
                            ? "bg-secondary text-white"
                            : "bg-warning-subtle text-warning"
                        }`}
                      >
                        {r.status === "enrolled"
                          ? "Enrolled"
                          : r.status === "contacted"
                          ? "Contacted"
                          : r.status === "closed"
                          ? "Closed"
                          : "Pending"}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenDetail(r)}
                        >
                          <i className="bi bi-eye-fill me-1" /> Review
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(r.id)}
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

      {/* Review Modal */}
      {activeReg && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setActiveReg(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-light rounded-top-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-person-lines-fill text-success" />
                  <span>Student Registration Details #{activeReg.id}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveReg(null)}
                />
              </div>

              <form onSubmit={handleSaveStatus}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Student Name</label>
                      <div className="fw-bold fs-5 text-dark">{activeReg.name}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Contact Details</label>
                      <div>
                        <div>
                          <i className="bi bi-envelope me-1 text-primary" />
                          <a href={`mailto:${activeReg.email}`} className="text-primary text-decoration-none">
                            {activeReg.email}
                          </a>
                        </div>
                        <div>
                          <i className="bi bi-telephone me-1 text-success" />
                          <a href={`tel:${activeReg.phone}`} className="text-success text-decoration-none">
                            {activeReg.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Chosen Track</label>
                      <div className="fw-semibold text-primary">{activeReg.course_track || "Not specified"}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Preferred Batch</label>
                      <div>{activeReg.preferred_batch || "Not specified"}</div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Background / Qualification</label>
                      <div>{activeReg.background || "Not specified"}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-semibold">Registered Date</label>
                      <div>{activeReg.created_at ? new Date(activeReg.created_at).toLocaleString() : "-"}</div>
                    </div>
                  </div>

                  {activeReg.notes && (
                    <div className="mb-4">
                      <label className="text-muted small fw-semibold">Student Learning Goals &amp; Queries</label>
                      <div className="p-3 bg-light rounded-3 border" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                        {activeReg.notes}
                      </div>
                    </div>
                  )}

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
                        <option value="contacted">Contacted</option>
                        <option value="enrolled">Enrolled / Confirmed</option>
                        <option value="closed">Closed / Not Interested</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold text-dark small">Admin Admission Notes</label>
                      <input
                        type="text"
                        className="form-control rounded-pill px-3"
                        placeholder="e.g. Spoke via WhatsApp, payment link sent"
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
                    onClick={() => setActiveReg(null)}
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
