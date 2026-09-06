import { useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

export default function EducationLogo({
  size = 36,
  className = "",
  style = {},
  showText = false,
  textClassName = "",
  alt = "Education Logo",
  fallbackIcon = "bi-mortarboard-fill",
}) {
  const { educationLogoUrl } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  const hasCustomLogo = educationLogoUrl && !imgError;

  return (
    <div
      className={`oc-education-logo-wrapper d-inline-flex align-items-center gap-2 ${className}`}
      style={{ verticalAlign: "middle", ...style }}
    >
      {hasCustomLogo ? (
        <img
          src={educationLogoUrl}
          alt={alt}
          onError={() => setImgError(true)}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            background: "#ffffff",
            padding: "2px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          className="oc-education-logo-img flex-shrink-0"
        />
      ) : (
        <span
          className="oc-navbar-logo-badge d-inline-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: size,
            height: size,
            fontSize: `${Math.max(14, Math.round(size * 0.5))}px`,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
            color: "#ffffff",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
          }}
        >
          <i className={`bi ${fallbackIcon}`} />
        </span>
      )}

      {showText && (
        <span className={textClassName || "fw-bold"}>
          Online Class
        </span>
      )}
    </div>
  );
}
