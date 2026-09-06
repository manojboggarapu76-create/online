import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import EducationLogo from "../components/EducationLogo.jsx";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Please enter the administrator password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(password);
    } catch (err) {
      setError(err?.response?.data?.errors?.password?.[0] || "Incorrect administrator password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="oc-auth-page">
      <div className="oc-auth-card">
        {/* Brand Badge */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <EducationLogo size={38} showText={true} textClassName="fw-bold text-dark fs-5" />
        </div>

        <div className="oc-eyebrow text-mono mb-2 text-warning">
          <i className="bi bi-gear-fill me-1" /> Admin Workspace
        </div>

        <h2 className="mb-1" style={{ fontSize: "1.5rem" }}>
          Admin Authentication
        </h2>
        <p className="mb-4" style={{ color: "var(--ink-60)", fontSize: "0.9rem" }}>
          Enter the master password to access system management, career pathways, student inquiries, and security logs.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="admin-password" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              MASTER PASSWORD
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-key-fill text-muted" />
              </span>
              <input
                id="admin-password"
                type="password"
                className="form-control border-start-0"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 rounded-3 mb-3" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-exclamation-circle-fill me-2" />
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-oc-primary w-100 py-2 fw-semibold" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" /> Enter Admin Panel
              </>
            )}
          </button>
        </form>

        <div className="oc-auth-switch mt-4 pt-3 border-top text-center">
          <Link to="/home" className="text-muted text-decoration-none small">
            <i className="bi bi-arrow-left me-1" /> Return to Student Home
          </Link>
        </div>
      </div>
    </div>
  );
}
