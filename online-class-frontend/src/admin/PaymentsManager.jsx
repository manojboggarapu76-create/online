import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

function formatAmount(amount, currency) {
  if (amount === null || amount === undefined) return "₹0";
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `₹${value.toFixed(0)}`;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function getPurposeLabel(purpose, meta) {
  if (!purpose) {
    return { label: "Online Class (All Access)", bg: "bg-primary-subtle text-primary border border-primary-subtle", icon: "bi-camera-video-fill" };
  }
  if (purpose === "online_class") {
    return { label: "Online Class (All Access)", bg: "bg-primary-subtle text-primary border border-primary-subtle", icon: "bi-camera-video-fill" };
  }
  if (purpose.startsWith("pathway_")) {
    const slug = purpose.replace("pathway_", "");
    const title = meta?.pathway_title || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { label: `Track: ${title}`, bg: "bg-purple-subtle text-purple border", icon: "bi-diagram-3-fill" };
  }
  return { label: purpose, bg: "bg-secondary-subtle text-dark border", icon: "bi-receipt" };
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ paid_count: 0, paid_total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api
      .get("/admin/payments")
      .then((res) => {
        setPayments(res.data.data || []);
        setSummary(res.data.summary || { paid_count: 0, paid_total: 0 });
        setError(null);
      })
      .catch(() => setError("Couldn't load payments right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 25000);
    return () => clearInterval(interval);
  }, [load]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  async function handleDeletePayment(id) {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/payments/${id}`);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setStatus({ type: "success", message: "Payment record deleted successfully." });
      load(true);
    } catch {
      setStatus({ type: "error", message: "Could not delete payment record." });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAllPayments() {
    if (
      !window.confirm(
        "Are you sure you want to delete and clear ALL payment records? This action cannot be undone."
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await api.delete("/admin/payments");
      setStatus({ type: "success", message: res.data?.message || "All payment records cleared." });
      await load();
    } catch {
      setStatus({ type: "error", message: "Could not clear payment records." });
    } finally {
      setClearing(false);
    }
  }

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const userName = (p.user?.name || "").toLowerCase();
      const userEmail = (p.user?.email || "").toLowerCase();
      const orderId = (p.razorpay_order_id || "").toLowerCase();
      const payId = (p.razorpay_payment_id || "").toLowerCase();
      const purpose = (p.purpose || "").toLowerCase();
      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        orderId.includes(q) ||
        payId.includes(q) ||
        purpose.includes(q)
      );
    }
    return true;
  });

  const pendingCount = payments.filter((p) => p.status === "created").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;

  return (
    <div className="oc-admin-payments-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "#10b981", width: 36, height: 36, fontSize: "1.1rem" }}
            >
              <i className="bi bi-credit-card-2-front-fill" />
            </span>
            <span>Payments &amp; Revenue Transactions</span>
          </h2>
          <p className="text-muted mb-0 small">
            Live ledger of student course enrollments, Razorpay order verification, and revenue analytics.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
            onClick={() => load()}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
            onClick={handleClearAllPayments}
            disabled={clearing || payments.length === 0}
          >
            <i className="bi bi-trash3-fill" />
            <span>{clearing ? "Clearing\u2026" : "Clear All Payments"}</span>
          </button>
        </div>
      </div>

      {/* Metric Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Total Attempts</span>
              <span className="badge bg-primary-subtle text-primary rounded-pill p-2">
                <i className="bi bi-receipt fs-6" />
              </span>
            </div>
            <div className="h3 fw-bold text-dark mb-0">{payments.length}</div>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>All initiated checkouts</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Paid Students</span>
              <span className="badge bg-success-subtle text-success rounded-pill p-2">
                <i className="bi bi-check-circle-fill fs-6" />
              </span>
            </div>
            <div className="h3 fw-bold text-success mb-0">{summary.paid_count}</div>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>Successful unlocks</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Total Revenue</span>
              <span className="badge bg-success-subtle text-success rounded-pill p-2">
                <i className="bi bi-currency-rupee fs-6" />
              </span>
            </div>
            <div className="h3 fw-bold text-success mb-0">{formatAmount(summary.paid_total, "INR")}</div>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>Verified collected INR</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Pending / Failed</span>
              <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill p-2">
                <i className="bi bi-hourglass-split fs-6" />
              </span>
            </div>
            <div className="h3 fw-bold text-dark mb-0">{pendingCount + failedCount}</div>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>{pendingCount} Pending &bull; {failedCount} Failed</small>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search student name, email, order ID, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setSearch("")}
                >
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm rounded-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid &amp; Unlocked (Success)</option>
              <option value="created">Created / Incomplete</option>
              <option value="failed">Failed Verification</option>
            </select>
          </div>

          <div className="col-12 col-md-2 text-md-end">
            <span className="badge bg-light text-muted border px-3 py-2 rounded-pill small">
              {filteredPayments.length} of {payments.length} shown
            </span>
          </div>
        </div>
      </div>

      {status && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2 px-3 mb-4 rounded-3 shadow-sm`}>
          <i className={`bi ${status.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-octagon-fill"} me-2`} />
          {status.message}
        </div>
      )}

      {error && <div className="alert alert-danger py-2 px-3 mb-4 rounded-3">{error}</div>}

      {/* Transactions Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        {!loading && filteredPayments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-receipt fs-1 text-muted d-block mb-2" />
            <h5 className="fw-bold text-dark mt-2 mb-1">No payment records found</h5>
            <p className="small text-muted mb-0">
              {search || statusFilter !== "all"
                ? "No transactions match your search filter."
                : "Transactions will appear here automatically when students checkout."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Student Account</th>
                  <th>Enrollment Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Gateway References (Order &amp; Payment ID)</th>
                  <th>Verification</th>
                  <th>Date &amp; Time</th>
                  <th style={{ width: 80, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const purposeInfo = getPurposeLabel(p.purpose, p.meta);
                  const isPaid = p.status === "paid";
                  const isCreated = p.status === "created";

                  return (
                    <tr key={p.id}>
                      {/* Student Account */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold border"
                            style={{ width: 32, height: 32, fontSize: "0.8rem" }}
                          >
                            {(p.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            {p.user ? (
                              <>
                                <div className="fw-bold text-dark">{p.user.name}</div>
                                <small className="text-muted">{p.user.email}</small>
                              </>
                            ) : (
                              <span className="text-muted font-italic">Deleted Student</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td>
                        <span className={`badge ${purposeInfo.bg} rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1`}>
                          <i className={`bi ${purposeInfo.icon}`} />
                          <span>{purposeInfo.label}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className="fw-bold text-dark">
                          {formatAmount(p.amount, p.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {isPaid && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill" /> Paid
                          </span>
                        )}
                        {isCreated && (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-hourglass-split" /> Pending
                          </span>
                        )}
                        {!isPaid && !isCreated && (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-x-circle-fill" /> {p.status || "Failed"}
                          </span>
                        )}
                      </td>

                      {/* Razorpay Order & Payment ID */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex align-items-center gap-1">
                            <span className="text-muted small" style={{ fontSize: "0.72rem" }}>Order:</span>
                            <span className="font-monospace text-dark small">{p.razorpay_order_id}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-muted"
                              title="Copy Order ID"
                              onClick={() => copyToClipboard(p.razorpay_order_id, `order_${p.id}`)}
                            >
                              <i className={`bi ${copiedId === `order_${p.id}` ? "bi-check2 text-success" : "bi-copy"}`} />
                            </button>
                          </div>
                          {p.razorpay_payment_id && (
                            <div className="d-flex align-items-center gap-1">
                              <span className="text-muted small" style={{ fontSize: "0.72rem" }}>Pay ID:</span>
                              <span className="font-monospace text-primary small">{p.razorpay_payment_id}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link p-0 text-muted"
                                title="Copy Payment ID"
                                onClick={() => copyToClipboard(p.razorpay_payment_id, `pay_${p.id}`)}
                              >
                                <i className={`bi ${copiedId === `pay_${p.id}` ? "bi-check2 text-success" : "bi-copy"}`} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Verification Channel */}
                      <td>
                        {p.verified_via === "webhook" && (
                          <span className="badge bg-light text-dark border rounded-pill px-2 py-1 small" title="Confirmed by Razorpay Webhook">
                            <i className="bi bi-shield-check text-success me-1" /> Webhook
                          </span>
                        )}
                        {p.verified_via === "verify" && (
                          <span className="badge bg-light text-dark border rounded-pill px-2 py-1 small" title="Instant client verification">
                            <i className="bi bi-lightning-charge-fill text-warning me-1" /> Browser
                          </span>
                        )}
                        {!p.verified_via && <span className="text-muted small">—</span>}
                      </td>

                      {/* Date */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="text-muted small">{formatDate(p.created_at)}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                          title="Delete payment record"
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletingId === p.id}
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
        )}
      </div>
    </div>
  );
}
