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
    // block or the API being unreachable, not a bad form submission.
    return "Couldn't reach the server. Check your connection, or that the API is running and reachable.";
  }
  return fallback;
}

export default function Signup() {
  const { register } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }
    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(cleanName, cleanEmail, password, confirm);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't create your account. Please try again."));
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
        <div className="oc-eyebrow text-mono mb-2">Get started</div>
        <h2 className="mb-1" style={{ fontSize: "1.5rem" }}>
          Create your account
        </h2>
        <p className="mb-4" style={{ color: "var(--ink-60)", fontSize: "0.9rem" }}>
          Sign up, then pay once to unlock every Online Classes video.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="signup-name" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              NAME
            </label>
            <input
              id="signup-name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-email" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              EMAIL
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-password" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              PASSWORD
            </label>
            <div className="input-group">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            <div className="form-text" style={{ fontSize: "0.76rem" }}>
              At least 6 characters.
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="signup-confirm" className="form-label text-mono" style={{ fontSize: "0.78rem" }}>
              CONFIRM PASSWORD
            </label>
            <div className="input-group">
              <input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password confirmation" : "Show password confirmation"}
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
            {submitting ? "Creating account\u2026" : "Sign up"}
          </button>
        </form>
        <div className="oc-auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
