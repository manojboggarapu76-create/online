import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useUserAuth } from "../context/UserAuthContext.jsx";

/**
 * Receives only a short-lived, single-use handoff reference from the backend.
 * The actual API token is fetched once and never placed in the redirect URL.
 */
export default function GoogleOAuthCallback() {
  const [params] = useSearchParams();
  const { completeOAuth } = useUserAuth();
  const [error, setError] = useState(null);
  const [complete, setComplete] = useState(false);
  const exchangePromiseRef = useRef(null);

  useEffect(() => {
    const handoff = params.get("handoff");
    if (!handoff || !/^[A-Za-z0-9]{64}$/.test(handoff)) {
      setError("This Google sign-in link is invalid. Please sign in again.");
      return;
    }

    let active = true;

    // React Strict Mode intentionally runs effects twice in development. The
    // backend handoff is single-use, so both effect runs must share one call.
    if (!exchangePromiseRef.current) {
      exchangePromiseRef.current = api.post("/auth/google/exchange", { handoff });
    }

    exchangePromiseRef.current
      .then(({ data }) => {
        if (!active) return;
        completeOAuth(data);
        setComplete(true);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError?.response?.data?.message ||
            "Google sign-in expired or could not be completed. Please try again."
        );
      });

    return () => {
      active = false;
    };
  }, [completeOAuth, params]);

  if (complete) return <Navigate to="/dashboard" replace />;

  return (
    <div className="oc-auth-page">
      <div className="oc-auth-card text-center">
        {error ? (
          <>
            <div className="alert alert-danger mb-3">{error}</div>
            <a className="btn btn-oc-primary w-100" href="/login">
              Return to log in
            </a>
          </>
        ) : (
          <>
            <div className="spinner-border text-primary mb-3" role="status" aria-label="Completing Google sign-in" />
            <h2 className="h5 mb-2">Completing Google sign-in</h2>
            <p className="mb-0" style={{ color: "var(--ink-60)" }}>
              Please wait a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
