import { Link } from "react-router-dom";
import { getOfferPricing } from "../utils/offerPricing.js";

function getItemIcon(item, sectionKey) {
  if (sectionKey === "career_pathways") {
    return "bi-diagram-3 text-primary";
  }
  if (sectionKey === "lecture_material") {
    return "bi-journal-code text-primary";
  }
  const fileName = (item.file_name || item.file_url || "").toLowerCase();
  const link = (item.link || "").toLowerCase();

  if (item.is_video || /\.(mp4|webm|ogg|mov|mkv|m4v|avi)$/i.test(fileName) || /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(link)) {
    return "bi-play-circle-fill text-danger";
  }
  if (/\.pdf$/i.test(fileName)) {
    return "bi-file-earmark-pdf-fill text-danger";
  }
  if (/\.(doc|docx)$/i.test(fileName)) {
    return "bi-file-earmark-word-fill text-primary";
  }
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) {
    return "bi-file-earmark-image-fill text-info";
  }
  if (item.link) {
    return "bi-link-45deg text-warning";
  }
  return "bi-file-earmark-text-fill text-secondary";
}

function itemCountLabel(section, count) {
  if (section.key === "career_pathways") return count === 1 ? "track" : "tracks";
  if (section.key === "lecture_material") return count === 1 ? "concept" : "concepts";
  if (section.key === "interview_prep") return count === 1 ? "guide / video" : "guides & videos";
  return count === 1 ? "resource" : "resources";
}

function emptyStateText(section) {
  if (section.key === "career_pathways") return "Click to explore career tracks.";
  if (section.key === "lecture_material") return "No concepts published yet.";
  if (section.key === "interview_prep") return "Click to explore mock interview videos & tips.";
  if (section.key === "proxy_support") return "Click to request proxy support.";
  if (section.key === "registration") return "Click to open registration form.";
  return "Nothing posted yet.";
}

function ctaText(section) {
  if (section.key === "career_pathways") return "Explore pathways & courses";
  if (section.key === "lecture_material") return "Browse curriculum concepts";
  if (section.key === "interview_prep") return "Explore interview guides & videos";
  return "Explore section";
}

export default function FolderCard({ section, items, loading, hovered, onHoverStart, onHoverEnd }) {
  const path = section.route || `/${section.key.replace(/_/g, "-")}`;
  const visibleItems = items.slice(0, 3);
  const extraItems = items.slice(3, 6);

  return (
    <Link
      to={path}
      className={`oc-folder ${hovered ? "oc-folder-hovered" : ""}`}
      style={{ "--folder-accent": section.color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      <div className="oc-folder-header">
        <div className="oc-folder-icon" style={{ background: section.color }}>
          <i className={`bi ${section.icon}`} />
        </div>
        <div>
          <h3>{section.title}</h3>
          <span className="oc-meta" style={{ fontSize: "0.76rem" }}>
            {items.length} {itemCountLabel(section, items.length)} available
          </span>
        </div>
      </div>

      <p className="oc-folder-desc">{section.tagline}</p>

      <div className="oc-folder-preview">
        {loading && (
          <div className="oc-folder-preview-item">
            <span className="text-muted">
              <i className="bi bi-arrow-repeat me-1" /> Loading…
            </span>
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="oc-folder-preview-item">
            <span className="text-muted">
              <i className="bi bi-inbox me-1" />
              {emptyStateText(section)}
            </span>
          </div>
        )}
        {!loading &&
          visibleItems.map((item) => (
            <div className="oc-folder-preview-item" key={item.id} title={item.title || item.name}>
              <span className="text-truncate d-inline-flex align-items-center" style={{ maxWidth: "100%", color: "#0f172a" }}>
                <i className={`bi ${getItemIcon(item, section.key)} me-2 flex-shrink-0`} />
                <span className="fw-semibold">{item.title || item.name}</span>
              </span>
              {(section.key === "career_pathways" || section.key === "lecture_material") && item.price && (
                <>
                {getOfferPricing(item).hasOffer && <small className="text-muted text-decoration-line-through ms-auto me-1">₹{getOfferPricing(item).originalPrice}</small>}
                <span className="badge bg-dark text-white border-0 ms-auto" style={{ fontSize: "0.72rem" }}>
                  ₹{item.price}
                </span>
                </>
              )}
            </div>
          ))}
        {!loading && extraItems.length > 0 && (
          <div className="oc-folder-preview-extra">
            {extraItems.map((item) => (
              <div className="oc-folder-preview-item" key={item.id} title={item.title || item.name}>
                <span className="text-truncate d-inline-flex align-items-center" style={{ maxWidth: "100%", color: "#0f172a" }}>
                  <i className={`bi ${getItemIcon(item, section.key)} me-2 flex-shrink-0`} />
                  <span className="fw-semibold">{item.title || item.name}</span>
                </span>
                {(section.key === "career_pathways" || section.key === "lecture_material") && item.price && (
                  <>
                  {getOfferPricing(item).hasOffer && <small className="text-muted text-decoration-line-through ms-auto me-1">₹{getOfferPricing(item).originalPrice}</small>}
                  <span className="badge bg-dark text-white border-0 ms-auto" style={{ fontSize: "0.72rem" }}>
                    ₹{item.price}
                  </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="oc-folder-hover-pop" aria-hidden="true">
        <i className="bi bi-box-arrow-up-right" />
        <span>{ctaText(section)}</span>
      </span>

      <span className="oc-folder-cta">
        <span>{ctaText(section)}</span>
        <i className="bi bi-arrow-right" />
      </span>
    </Link>
  );
}
