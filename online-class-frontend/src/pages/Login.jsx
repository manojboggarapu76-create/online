import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import EducationLogo from "../components/EducationLogo.jsx";

function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(" ");
  }
  if (data?.message) {
    return data.message;
  }
  if (err?.request) {
    // Request went out but no response came back -- almost always a CORS
    // block or the API being unreachable, not bad credentials.
    return "Couldn't reach the server. Check your connection, or that the API is running and reachable.";
  }
  return fallback;
}

export default function Login() {
  const { login } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => new URLSearchParams(location.search).get("oauth_error"));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't log you in. Check your details."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="oc-auth-page">
      <div className="oc-auth-card">
        <div className="d-flex justify-content-center mb-3">
          <EducationLogo size={42} showText={true} textClassName="fw-bold fs-5 text-dark" />
        </div>
        <div className="oc-eyebrow text-mono mb-2">Welcome back</div>
        <h2 className="mb-1" style={{ fontSize: "1.5rem" }}>
          Log in
        </h2>
        <p className="mb-4" style={{ color: "var(--ink-60)", fontSize: "0.9rem" }}>
          Log in to unlock Online Classes videos you've paid for.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              EMAIL
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label htmlFor="login-password" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              PASSWORD
            </label>
            <div className="input-group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
              </button>
            </div>
          </div>
          {error && (
            <div className="alert alert-danger py-2" style={{ fontSize: "0.85rem" }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-oc-primary w-100" disabled={submitting}>
            {submitting ? "Logging in\u2026" : "Log in"}
          </button>
        </form>
        <div className="oc-auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
