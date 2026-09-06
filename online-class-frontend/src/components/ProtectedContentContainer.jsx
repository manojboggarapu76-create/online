import { useContentProtection } from "../hooks/useContentProtection.js";
import DynamicWatermark from "./DynamicWatermark.jsx";

export default function ProtectedContentContainer({
  children,
  sectionKey = "general",
  sectionTitle = "Online Class Workspace",
  documentId = null,
  showWatermark = false,
}) {
  const { isBlurred, protestInfo, resumeViewing, securityToast, sessionId, user } = useContentProtection({
    sectionKey,
    documentId,
    enabled: true,
  });

  return (
    <div className="oc-protected-wrapper position-relative">
      {/* Dynamic Visual Watermark Overlay only when explicitly requested (e.g. DRM viewers) */}
      {showWatermark && (
        <DynamicWatermark
          username={user?.name || "Guest Student"}
          sessionId={sessionId}
          sectionTitle={sectionTitle}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`oc-protected-surface ${isBlurred ? "oc-content-blurred" : ""}`}
        tabIndex={0}
      >
        {children}
      </div>

      {/* Protective Window-Blur & Screen Capture Protest Shield */}
      {isBlurred && (
        <div className="oc-blur-shield" onClick={resumeViewing}>
          <div className="oc-blur-shield-card oc-protest-card" onClick={(e) => e.stopPropagation()}>
            <div className="oc-protest-icon-wrap">
              <i className="bi bi-shield-slash-fill text-danger oc-pulse-icon" />
            </div>

            <div className="oc-protest-badge">
              <i className="bi bi-exclamation-octagon-fill text-warning me-1" />
              DRM Content Protection Active
            </div>

            <h3 className="oc-protest-title">
              {protestInfo?.title || "SCREENSHOT & SCREEN RECORDING RESTRICTED"}
            </h3>

            <div className="text-center text-danger fw-bold my-2" style={{ fontSize: "1.2rem", letterSpacing: "0.02em" }}>
              ⚠️ You cannot able to take screen short.
            </div>

            <p className="oc-protest-desc">
              {protestInfo?.reason ||
                "Action Prohibited: Taking screenshots (Win+Shift+S, PrtScn) or recording videos of educational materials, slides, and documents is prohibited under platform security policies."}
            </p>

            <div className="oc-protest-audit-box">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-white-50">Authorized User:</span>
                <span className="text-white fw-semibold">{user?.name || "Student User"}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-white-50">Security Session:</span>
                <span className="text-mono text-warning">{sessionId}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-white-50">Incident Status:</span>
                <span className="text-danger fw-semibold">
                  <i className="bi bi-record-circle-fill me-1" /> Captured &amp; Logged to Audit
                </span>
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-oc-primary px-4 py-2"
                onClick={resumeViewing}
              >
                <i className="bi bi-shield-check me-2" />
                I Understand &mdash; Resume Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Toast Notification */}
      {securityToast && (
        <div className="oc-security-toast" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                securityToast.type === "info"
                  ? "bi-info-circle-fill text-info"
                  : "bi-shield-exclamation text-warning"
              }`}
              style={{ fontSize: "1.2rem" }}
            />
            <span className="flex-grow-1">{securityToast.message}</span>
          </div>
        </div>
      )}

      {/* Print-Only Replacement Banner */}
      <div className="oc-print-blocker" aria-hidden="true">
        <div className="oc-print-message">
          <i className="bi bi-lock-fill me-2" />
          Printing of this protected document is strictly not permitted.
        </div>
      </div>
    </div>
  );
}
