import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import EducationLogo from "../components/EducationLogo.jsx";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    title: "Online Class",
    tagline: "Your whole classroom, in one binder",
    duration: 6,
    media_type: "none",
    media_url: null,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .get("/welcome-screen")
      .then((res) => {
        if (mounted && res.data) {
          setSettings((prev) => ({
            ...prev,
            ...res.data,
            duration: Number(res.data.duration) || 6,
          }));
        }
      })
      .catch(() => {
        // Use default fallback settings if API fails
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const totalMs = Math.max(2, settings.duration || 6) * 1000;
    const intervalMs = 50;
    const step = (intervalMs / totalMs) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        const next = old + step;
        if (next >= 100) {
          clearInterval(timer);
          navigate("/home", { replace: true });
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.duration, navigate]);

  function handleContinue() {
    navigate("/home", { replace: true });
  }

  const hasMedia = settings.media_url && settings.media_type !== "none";

  return (
    <div className="oc-welcome-screen position-relative">
      {/* Background Media & Backdrop */}
      <div className="oc-welcome-backdrop">
        <PageBackgroundLogo variant="global" opacity={0.085} />
        {hasMedia ? (
          settings.media_type === "video" ? (
            <video
              src={settings.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="oc-welcome-media"
            />
          ) : (
            <img
              src={settings.media_url}
              alt="Welcome background"
              className="oc-welcome-media"
            />
          )
        ) : (
          <div
            className="oc-welcome-media"
            style={{
              background:
                "radial-gradient(ellipse at center, #1e1b4b 0%, #0b1329 70%, #060b18 100%)",
            }}
          />
        )}
        <div className="oc-welcome-overlay" />
        <div className="oc-welcome-particles" />
      </div>

      {/* Main Content */}
      <div className="oc-welcome-content">
        <div className="oc-welcome-logo-badge mb-3">
          <EducationLogo size={68} />
        </div>

        <div className="oc-eyebrow text-mono mb-2 justify-content-center">
          <i className="bi bi-stars" /> Welcome to Digital Campus
        </div>

        <h1 className="oc-welcome-title">{settings.title || "Online Class"}</h1>

        <p className="oc-welcome-tagline">
          {settings.tagline || "Your whole classroom, in one binder"}
        </p>

        {/* Dynamic Progress Bar */}
        <div className="oc-welcome-progress-wrap" title="Loading Classroom">
          <div
            className="oc-welcome-progress-bar"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Action Controls */}
        <div className="oc-welcome-actions">
          <button
            type="button"
            className="btn btn-oc-primary px-4 py-2"
            onClick={handleContinue}
            style={{ fontSize: "1.05rem" }}
          >
            Enter Classroom <i className="bi bi-arrow-right ms-2" />
          </button>
          <button
            type="button"
            className="oc-btn-nav-ghost"
            onClick={handleContinue}
            style={{ padding: "0.55rem 1.1rem" }}
          >
            Skip Intro
          </button>
        </div>
      </div>
    </div>
  );
}
