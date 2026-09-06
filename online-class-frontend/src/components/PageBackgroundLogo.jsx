import { useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

/**
 * PageBackgroundLogo
 * Displays the institution/platform logo as an ambient background watermark.
 * 
 * Variants:
 * - "global": Fixed watermark spanning the whole viewport behind every page
 * - "header": Prominent ambient watermark inside dark hero/dashboard banners
 * - "section": Contained background watermark inside sections/card grids
 */
export default function PageBackgroundLogo({
  variant = "global",
  opacity,
  size,
  className = "",
  style = {},
  fallbackIcon = "bi-mortarboard-fill",
}) {
  const { educationLogoUrl } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  // Read logo from context or cached session storage
  const logoUrl =
    educationLogoUrl ||
    (typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("oc_cached_education_logo") ||
        sessionStorage.getItem("oc_cache_dashboard_logo")
      : null);

  const hasCustomLogo = Boolean(logoUrl) && !imgError;

  const containerStyle = { ...style };
  if (opacity !== undefined) {
    containerStyle["--oc-bg-watermark-opacity"] = opacity;
  }
  if (size !== undefined) {
    containerStyle["--oc-bg-watermark-size"] = typeof size === "number" ? `${size}px` : size;
  }

  return (
    <div
      className={`oc-page-bg-watermark oc-bg-watermark-${variant} ${className}`}
      style={containerStyle}
      aria-hidden="true"
    >
      <div className="oc-bg-watermark-inner">
        {hasCustomLogo ? (
          <img
            src={logoUrl}
            alt=""
            className="oc-bg-watermark-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="oc-bg-watermark-emblem">
            <i className={`bi ${fallbackIcon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
