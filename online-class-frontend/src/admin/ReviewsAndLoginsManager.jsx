import { useState, useEffect, useCallback } from "react";
import {
  fetchAdminReviews,
  toggleAdminReviewFeature,
  deleteAdminReview,
  fetchAdminUserLoginStats,
} from "../api/client";

export default function ReviewsAndLoginsManager() {
  const [activeTab, setActiveTab] = useState("reviews"); // "reviews" | "logins" | "accounts"
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, statsRes] = await Promise.all([
        fetchAdminReviews(),
        fetchAdminUserLoginStats(),
      ]);
      setReviews(revRes.data?.data || []);
      setStats(statsRes.data || null);
      setNotice(null);
    } catch (err) {
      setNotice({
        type: "danger",
        msg: "Failed to load reviews and login statistics. Please verify backend connection.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleFeature(reviewId) {
    setActionLoading(reviewId);
    try {
      const res = await toggleAdminReviewFeature(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, is_featured: res.data?.review?.is_featured ?? !r.is_featured } : r
        )
      );
      setNotice({ type: "success", msg: res.data?.message || "Feature status updated." });
    } catch {
      setNotice({ type: "danger", msg: "Could not toggle feature status." });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm("Are you sure you want to permanently delete this student review?")) return;
    setActionLoading(reviewId);
    try {
      await deleteAdminReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setNotice({ type: "success", msg: "Review deleted successfully." });
      // Update stats count
      if (stats) {
        setStats((prev) => ({ ...prev, total_reviews: Math.max(0, (prev?.total_reviews || 1) - 1) }));
      }
    } catch {
      setNotice({ type: "danger", msg: "Could not delete review." });
    } finally {
      setActionLoading(null);
    }
  }

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.review?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStar = starFilter === "all" || r.rating === parseInt(starFilter, 10);
    return matchesSearch && matchesStar;
  });

  // Filtered user accounts
  const filteredAccounts = (stats?.user_accounts || []).filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Top Alerts */}
      {notice && (
        <div className={`alert alert-${notice.type} py-3 px-4 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between`}>
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill text-success fs-5" : "bi-exclamation-triangle-fill text-danger fs-5"}`} />
            <span className="fw-semibold">{notice.msg}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setNotice(null)} />
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="row g-3 mb-4">
        {/* 1. Total User Logins Count */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderLeft: "5px solid #0284c7" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase letter-spacing-1">
                  Total User Logins
                </span>
                <h3 className="display-6 fw-bold text-dark mb-0 mt-1">
                  {loading ? "..." : (stats?.total_logins ?? 0)}
                </h3>
                <small className="text-muted">Total student sign-in events</small>
              </div>
              <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-info-subtle text-info p-3 fs-4">
                <i className="bi bi-box-arrow-in-right" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Registered Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderLeft: "5px solid #4f46e5" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase letter-spacing-1">
                  Registered Students
                </span>
                <h3 className="display-6 fw-bold text-dark mb-0 mt-1">
                  {loading ? "..." : (stats?.total_users ?? 0)}
                </h3>
                <small className="text-muted">Student user accounts created</small>
              </div>
              <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary p-3 fs-4">
                <i className="bi bi-people-fill" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Reviews Submitted */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderLeft: "5px solid #d97706" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase letter-spacing-1">
                  Reviews Submitted
                </span>
                <h3 className="display-6 fw-bold text-dark mb-0 mt-1">
                  {loading ? "..." : (stats?.total_reviews ?? reviews.length)}
                </h3>
                <small className="text-muted">Direct dashboard feedback</small>
              </div>
              <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-warning-subtle text-warning p-3 fs-4">
                <i className="bi bi-chat-heart-fill" />
              </span>
            </div>
          </div>
        </div>

        {/* 4. Average Rating */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderLeft: "5px solid #059669" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase letter-spacing-1">
                  Platform Rating
                </span>
                <h3 className="display-6 fw-bold text-dark mb-0 mt-1 d-flex align-items-center gap-1">
                  <span>{loading ? "..." : (stats?.average_rating ?? "5.0")}</span>
                  <span className="text-warning fs-4">★</span>
                </h3>
                <small className="text-success fw-semibold">
                  <i className="bi bi-shield-check me-1" /> Verified Student Reviews
                </small>
              </div>
              <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-success-subtle text-success p-3 fs-4">
                <i className="bi bi-star-fill text-warning" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls & Actions Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Navigation Pills */}
          <ul className="nav nav-pills gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 py-2 fw-semibold ${activeTab === "reviews" ? "active bg-primary text-white shadow-sm" : "text-muted"}`}
                onClick={() => setActiveTab("reviews")}
              >
                <i className="bi bi-star-fill me-2 text-warning" />
                Student Reviews ({reviews.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 py-2 fw-semibold ${activeTab === "accounts" ? "active bg-primary text-white shadow-sm" : "text-muted"}`}
                onClick={() => setActiveTab("accounts")}
              >
                <i className="bi bi-people-fill me-2" />
                User Accounts &amp; Logins ({stats?.total_users ?? 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 py-2 fw-semibold ${activeTab === "logins" ? "active bg-primary text-white shadow-sm" : "text-muted"}`}
                onClick={() => setActiveTab("logins")}
              >
                <i className="bi bi-clock-history me-2" />
                Recent Login Stream
              </button>
            </li>
          </ul>

          {/* Search & Refresh */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === "reviews" && (
              <select
                className="form-select form-select-sm bg-light"
                style={{ width: "auto" }}
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
              >
                <option value="all">All Star Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={loadData}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise me-1 ${loading ? "spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          TAB 1: STUDENT REVIEWS & THEIR ACCOUNT DETAILS
          ============================================================ */}
      {activeTab === "reviews" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-chat-square-quote-fill text-warning me-2" />
                Submitted Student Reviews &amp; Full Account Profiles
              </h5>
              <small className="text-muted">
                Each review submitted from the Main Dashboard with verified account credentials
              </small>
            </div>
            <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
              Showing {filteredReviews.length} of {reviews.length} Reviews
            </span>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary mb-2" role="status" />
                <p className="mb-0">Loading student reviews&hellip;</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 text-muted opacity-50" />
                <h6 className="fw-bold">No Reviews Match Your Criteria</h6>
                <p className="small mb-0">When students submit reviews from their dashboard, they will appear here with full account details.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase letter-spacing-1">
                    <tr>
                      <th className="ps-4">Student &amp; Account Details</th>
                      <th>Rating</th>
                      <th style={{ minWidth: 260 }}>Review Feedback</th>
                      <th>Submitted Date</th>
                      <th>Account Logins</th>
                      <th>Class Access</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((r) => {
                      const u = r.user;
                      return (
                        <tr key={r.id}>
                          {/* Student Account Details */}
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                style={{
                                  width: 42,
                                  height: 42,
                                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                  fontSize: "1rem",
                                }}
                              >
                                {u?.name ? u.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                  <span>{u?.name || "Deleted User"}</span>
                                  {u?.is_paid && (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: "0.68rem" }}>
                                      Paid Student
                                    </span>
                                  )}
                                </div>
                                <div className="small text-muted font-monospace">{u?.email || "No email"}</div>
                                <div className="small text-muted" style={{ fontSize: "0.74rem" }}>
                                  <i className="bi bi-calendar3 me-1" />
                                  Joined: {u?.registered_at ? new Date(u.registered_at).toLocaleDateString() : "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Star Rating */}
                          <td>
                            <div className="d-flex text-warning fs-6 mb-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <i
                                  key={s}
                                  className={`bi ${s <= r.rating ? "bi-star-fill text-warning" : "bi-star text-muted"}`}
                                />
                              ))}
                            </div>
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill small fw-bold">
                              {r.rating} / 5 Stars
                            </span>
                          </td>

                          {/* Review Content */}
                          <td>
                            <div
                              className="p-3 bg-light rounded-3 text-dark small"
                              style={{ maxHeight: 120, overflowY: "auto", whiteSpace: "pre-line", lineHeight: 1.5 }}
                            >
                              &ldquo;{r.review}&rdquo;
                            </div>
                            {r.is_featured && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill mt-1 small">
                                <i className="bi bi-award-fill me-1" /> Featured on Homepage
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td>
                            <div className="small text-dark fw-semibold">
                              {new Date(r.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
                              {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* User Account Login Metrics */}
                          <td>
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-3 py-1 fw-bold fs-6">
                              <i className="bi bi-box-arrow-in-right me-1" />
                              {u?.login_count ?? 1} {u?.login_count === 1 ? "Login" : "Logins"}
                            </span>
                            {u?.last_login_at && (
                              <div className="small text-muted mt-1" style={{ fontSize: "0.72rem" }}>
                                Last: {new Date(u.last_login_at).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          {/* Class Unlock Status */}
                          <td>
                            {u?.is_paid ? (
                              <div>
                                <span className="badge bg-success text-white rounded-pill px-2 py-1 small">
                                  <i className="bi bi-unlock-fill me-1" /> Unlocked All
                                </span>
                                {u?.total_paid > 0 && (
                                  <div className="small text-muted mt-1 fw-semibold" style={{ fontSize: "0.74rem" }}>
                                    Paid ₹{u.total_paid}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1 small">
                                Free Access
                              </span>
                            )}
                          </td>

                          {/* Admin Actions */}
                          <td className="text-end pe-4">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className={`btn ${r.is_featured ? "btn-warning" : "btn-outline-secondary"}`}
                                title={r.is_featured ? "Remove from featured" : "Feature on Homepage Testimonials"}
                                onClick={() => handleToggleFeature(r.id)}
                                disabled={actionLoading === r.id}
                              >
                                <i className={`bi ${r.is_featured ? "bi-star-fill text-dark" : "bi-star"}`} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Delete Review"
                                onClick={() => handleDeleteReview(r.id)}
                                disabled={actionLoading === r.id}
                              >
                                <i className="bi bi-trash3-fill" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: REGISTERED USER ACCOUNTS & LOGIN COUNTS
          ============================================================ */}
      {activeTab === "accounts" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-people-fill text-primary me-2" />
                Registered Student Accounts &amp; Total Login Counts
              </h5>
              <small className="text-muted">
                Audit list of student accounts with their cumulative login counts and access permissions
              </small>
            </div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold">
              {filteredAccounts.length} Total Registered Students
            </span>
          </div>

          <div className="card-body p-0">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p className="mb-0">No student accounts found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase letter-spacing-1">
                    <tr>
                      <th className="ps-4">User ID</th>
                      <th>Student Name &amp; Email</th>
                      <th>Registered At</th>
                      <th>Total Logins</th>
                      <th>Last Login Timestamp</th>
                      <th>Last Login IP</th>
                      <th>Reviewed</th>
                      <th className="text-end pe-4">Payment Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-4 font-monospace text-muted small">#{u.id}</td>
                        <td>
                          <div className="fw-bold text-dark">{u.name}</div>
                          <div className="small text-muted font-monospace">{u.email}</div>
                        </td>
                        <td>
                          <div className="small text-dark">
                            {u.registered_at ? new Date(u.registered_at).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-3 py-1 fw-bold fs-6">
                            <i className="bi bi-box-arrow-in-right me-1" />
                            {u.login_count} {u.login_count === 1 ? "Login" : "Logins"}
                          </span>
                        </td>
                        <td>
                          <div className="small text-dark fw-semibold">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                          </div>
                          {u.last_login_at && (
                            <div className="small text-muted" style={{ fontSize: "0.72rem" }}>
                              {new Date(u.last_login_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace border">
                            {u.last_login_ip || "127.0.0.1"}
                          </span>
                        </td>
                        <td>
                          {u.has_reviewed ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                              <i className="bi bi-check-circle-fill me-1" /> Yes
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border rounded-pill small">
                              No
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          {u.is_paid ? (
                            <span className="badge bg-success text-white rounded-pill px-3 py-1 small">
                              <i className="bi bi-unlock-fill me-1" /> Paid All
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border rounded-pill px-3 py-1 small">
                              Free Tier
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: REAL-TIME LOGIN AUDIT STREAM
          ============================================================ */}
      {activeTab === "logins" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-clock-history text-info me-2" />
                Live User Login Audit Stream
              </h5>
              <small className="text-muted">
                Every individual sign-in occurrence recorded with timestamp, IP, and student account
              </small>
            </div>
            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-2 rounded-pill fw-bold">
              Total {stats?.total_logins ?? 0} Platform Logins Recorded
            </span>
          </div>

          <div className="card-body p-0">
            {!(stats?.recent_logins?.length) ? (
              <div className="text-center py-5 text-muted">
                <p className="mb-0">No login records logged yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase letter-spacing-1">
                    <tr>
                      <th className="ps-4">Login Record ID</th>
                      <th>Student Account</th>
                      <th>Login Timestamp</th>
                      <th>IP Address</th>
                      <th className="pe-4">Client / Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recent_logins || []).map((rec) => (
                      <tr key={rec.id}>
                        <td className="ps-4 font-monospace text-muted small">#{rec.id}</td>
                        <td>
                          <div className="fw-bold text-dark">{rec.user_name}</div>
                          <div className="small text-muted font-monospace">{rec.user_email}</div>
                        </td>
                        <td>
                          <div className="small text-dark fw-semibold">
                            {new Date(rec.login_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="small text-muted" style={{ fontSize: "0.74rem" }}>
                            {new Date(rec.login_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace border">
                            {rec.ip_address}
                          </span>
                        </td>
                        <td className="pe-4">
                          <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                            {rec.user_agent}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
