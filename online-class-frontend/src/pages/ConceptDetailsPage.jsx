import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  default as api,
  fetchConceptDetails,
  fetchMyConceptAccess,
  fetchSiteSettings,
  createConceptOrder,
  verifyConceptPayment,
} from "../api/client";
import DynamicWatermark from "../components/DynamicWatermark.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { getOfferPricing } from "../utils/offerPricing.js";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function ConceptDetailsPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { isAuthed, user } = useUserAuth();

  const [concept, setConcept] = useState(null);
  const [unlockedSlugs, setUnlockedSlugs] = useState([]);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'documents' | 'videos'

  // Payment processing state
  const [paying, setPaying] = useState(false);
  const [payNotice, setPayNotice] = useState(null);

  // Modal / Inline Player State
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [docViewSize, setDocViewSize] = useState("medium"); // "medium" | "expanded"
  const [docZoom, setDocZoom] = useState(1); // 0.5 to 2.5
  const [videoViewSize, setVideoViewSize] = useState("medium"); // "medium" | "expanded"
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Locked Action Prompt Modal
  const [lockedPrompt, setLockedPrompt] = useState(false);

  // Prevent background page scrolling while modal viewer is active
  useEffect(() => {
    if (activeDocument || activeVideoModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeDocument, activeVideoModal]);

  // A protected document/video URL is deliberately issued only after the
  // current account is entitled to it. Refresh the current subject after an
  // access change so this page never keeps the pre-unlock, URL-less snapshot.
  const refreshConceptResources = async () => {
    try {
      const response = await fetchConceptDetails(identifier);
      const nextConcept = response.data?.data;
      if (nextConcept) {
        setConcept(nextConcept);
        return nextConcept;
      }
    } catch {
      // Existing resource state remains visible. The normal error handling
      // continues to cover initial page loading failures.
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      fetchConceptDetails(identifier),
      isAuthed ? fetchMyConceptAccess() : Promise.resolve({ data: { data: [] } }),
      fetchSiteSettings(),
    ])
      .then(([cRes, aRes, sRes]) => {
        if (!isMounted) return;
        if (cRes.status === "fulfilled" && cRes.value.data?.data) {
          setConcept(cRes.value.data.data);
          setError(null);
        } else if (cRes.status === "rejected") {
          setError("Failed to load concept details. Please verify the URL or try again later.");
        }

        if (aRes.status === "fulfilled" && aRes.value.data?.data) {
          setUnlockedSlugs(aRes.value.data.data || []);
        }

        if (sRes.status === "fulfilled" && sRes.value.data?.data) {
          const isReq = sRes.value.data.data.payment_required !== "0";
          setPaymentEnabled(isReq);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [identifier, isAuthed]);

  const isUnlocked = () => {
    if (!concept) return false;
    if (!paymentEnabled) return true;
    if (concept.is_locked === false) return true;
    const s = concept.slug || String(concept.id);
    return unlockedSlugs.includes(s) || unlockedSlugs.includes(String(concept.id));
  };

  const handlePayForConcept = async () => {
    if (!isAuthed) {
      navigate("/login", { state: { from: `/lectures-and-materials/concept/${identifier}` } });
      return;
    }

    if (!concept) return;

    setPaying(true);
    setPayNotice(null);

    const targetIdentifier = concept.slug || concept.id;

    try {
      const res = await createConceptOrder(targetIdentifier);

      if (res.data?.already_paid) {
        setUnlockedSlugs((prev) => [...prev, targetIdentifier, concept.slug]);
        await refreshConceptResources();
        setPayNotice({ type: "success", msg: "You already have unlocked access to this subject!" });
        setPaying(false);
        setLockedPrompt(false);
        return;
      }

      const orderData = res.data;

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Online Class",
        description: `Unlock ${concept.name}`,
        order_id: orderData.order_id,
        prefill: orderData.prefill || {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response) {
          try {
            await verifyConceptPayment(targetIdentifier, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setUnlockedSlugs((prev) => [...prev, targetIdentifier, concept.slug]);
            await refreshConceptResources();
            setPayNotice({
              type: "success",
              msg: `Payment successful! Full access for "${concept.name}" is now unlocked.`,
            });
            setLockedPrompt(false);
          } catch {
            setPayNotice({
              type: "danger",
              msg: "Payment verification failed. If your account was debited, please contact support.",
            });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayNotice({
        type: "danger",
        msg: err.response?.data?.message || "Could not start payment. Please check your connection and try again.",
      });
      setPaying(false);
    }
  };

  const isDocUnlocked = (doc) => {
    if (isUnlocked()) return true;
    if (doc && doc.is_locked === false) return true;
    return false;
  };

  const isVidUnlocked = (vid) => {
    if (isUnlocked()) return true;
    if (vid && vid.is_locked === false) return true;
    return false;
  };

  const handleDocumentClick = async (doc) => {
    if (!isDocUnlocked(doc)) {
      setLockedPrompt(true);
    } else {
      // A payment may have completed only moments ago. Refresh once to obtain
      // the server-issued signed URL instead of trying to render a blank frame.
      const refreshed = !doc.file_url ? await refreshConceptResources() : null;
      const documentToView = refreshed?.documents?.find((item) => item.id === doc.id) || doc;

      if (!documentToView.file_url) {
        setPayNotice({ type: "danger", msg: "This document is not ready to view yet. Please try again." });
        return;
      }

      const documentUrl = getDocumentUrl(documentToView);

      if (!documentUrl) {
        setPayNotice({ type: "danger", msg: "This document is not ready to view yet. Please try again." });
        return;
      }

      setActiveDocument(documentToView);
      if (isAuthed) {
        api
          .post("/security/log", {
            event_type: "protected_document_view_started",
            section_key: `concept:${concept?.slug || identifier}`,
            document_id: String(doc.id),
            username: user?.name || "Student User",
            meta: {
              concept: concept?.name || identifier,
              document_title: documentToView.title,
              access: "protected_viewer",
            },
          })
          .catch(() => {});
      }
    }
  };

  const handleVideoClick = async (vid) => {
    if (!isVidUnlocked(vid)) {
      setLockedPrompt(true);
    } else {
      const refreshed = !vid.video_url ? await refreshConceptResources() : null;
      const videoToPlay = refreshed?.videos?.find((item) => item.id === vid.id) || vid;

      if (!videoToPlay.video_url) {
        setPayNotice({ type: "danger", msg: "This video is not ready to play yet. Please try again." });
        return;
      }

      setActiveVideo(videoToPlay);
      window.scrollTo({ top: 250, behavior: "smooth" });
    }
  };

  // Helper to extract video embed URL (YouTube, Vimeo, Google Drive)
  const getEmbedUrl = (url) => {
    if (!url) return null;
    // YouTube (watch?v=, youtu.be/, embed/, shorts/)
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    // Google Drive Preview
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return url;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    // If it's a known hosted platform, it's not a direct video tag
    if (/(?:youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com)/i.test(url)) {
      return false;
    }
    return /\.(mp4|webm|ogg|mov|mkv|m4v|avi)(\?.*)?$/i.test(url) || url.includes('/stream') || url.includes('blob:');
  };

  const getVideoThumbnail = (vid) => {
    if (vid?.thumbnail_url) return vid.thumbnail_url;
    if (vid?.video_url) {
      const ytMatch = vid.video_url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }
    return null;
  };

  const isImageDoc = (doc) => {
    if (!doc) return false;
    const type = (doc.file_type || "").toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(type)) return true;
    const path = doc.file_url || doc.file_path || "";
    return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(path);
  };

  const isPdfDoc = (doc) => {
    if (!doc) return false;
    const type = (doc.file_type || "").toLowerCase();
    if (type === "pdf") return true;
    const path = doc.file_url || doc.file_path || "";
    return /\.pdf(\?.*)?$/i.test(path);
  };

  const isVideoDoc = (doc) => {
    if (!doc) return false;
    if (doc.is_video === true) return true;
    const type = (doc.file_type || "").toLowerCase();
    if (["mp4", "webm", "ogg", "mov", "mkv", "m4v", "avi", "video"].includes(type) || type.includes("video")) return true;
    const path = (doc.file_url || doc.file_path || "").split("?")[0].split("#")[0].toLowerCase();
    return (
      /\.(mp4|webm|ogg|mov|mkv|m4v|avi)$/i.test(path) ||
      path.includes("/stream") ||
      path.includes("video")
    );
  };

  const isTextDocument = (doc) => {
    if (!doc) return false;

    const type = String(doc.file_type || doc.mime_type || "")
      .toLowerCase()
      .trim();

    const fileName = String(doc.file_name || doc.file_url || doc.file_path || "")
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();

    const extension = fileName.match(/\.([a-z0-9]+)$/i)?.[1] || "";

    const textExtensions = [
      "txt",
      "text",
      "md",
      "markdown",
      "csv",
      "tsv",
      "json",
      "xml",
      "html",
      "htm",
      "css",
      "js",
      "jsx",
      "ts",
      "tsx",
      "php",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "sql",
      "yml",
      "yaml",
      "ini",
      "conf",
      "log",
      "srt",
      "vtt",
    ];

    return (
      textExtensions.includes(type) ||
      textExtensions.includes(extension) ||
      type.startsWith("text/")
    );
  };

  const getDocumentUrl = (doc) => doc?.file_url || doc?.file_path || doc?.url || "";

  const getDocIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "pdf") return "bi-file-earmark-pdf text-danger";
    if (t === "doc" || t === "docx") return "bi-file-earmark-word text-primary";
    if (t === "ppt" || t === "pptx") return "bi-file-earmark-slides text-warning";
    if (t === "zip" || t === "rar") return "bi-file-earmark-zip text-secondary";
    return "bi-file-earmark-text text-info";
  };

  const unlocked = isUnlocked();
  const pricing = getOfferPricing(concept);
  const price = pricing.price;

  return (
    <div className="oc-concept-details-wrapper position-relative">
      {/* Background Watermark Logo across entire concept details page */}
      <PageBackgroundLogo
        variant="global"
        className="oc-curriculum-bg-logo"
        opacity={0.16}
        size="min(860px, 88vw)"
      />

      {/* Top Banner Header */}
      <header className="oc-details-header position-relative overflow-hidden">
        {/* Ambient Header Background Logo */}
        <PageBackgroundLogo
          variant="header"
          className="oc-curriculum-header-logo-bg"
          opacity={0.24}
          size="min(540px, 55vw)"
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          {/* Breadcrumb Navigation */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb oc-breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/home" className="text-white-50 text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/lectures-and-materials" className="text-white-50 text-decoration-none">
                  Student Curriculum
                </Link>
              </li>
              <li className="breadcrumb-item active text-white" aria-current="page">
                {concept?.name || "Concept Details"}
              </li>
            </ol>
          </nav>

          {loading ? (
            <div className="py-4 text-white-50">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Loading curriculum details&hellip;
            </div>
          ) : error ? (
            <div className="alert alert-danger my-3">{error}</div>
          ) : (
            <div className="row align-items-center g-4 py-2">
              <div className="col-12 col-lg-8">
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-1 rounded-pill border border-primary-subtle">
                    <i className="bi bi-patch-check-fill me-1" /> Verified Educational Module
                  </span>
                  <span className="badge bg-light text-dark px-3 py-1 rounded-pill border">
                    <i className="bi bi-star-fill text-warning me-1" />
                    {concept.rating ? Number(concept.rating).toFixed(1) : "5.0"} Rating
                  </span>
                  <span className="badge bg-dark-subtle text-white px-3 py-1 rounded-pill border border-secondary-subtle">
                    <i className="bi bi-folder-fill text-info me-1" />
                    {concept.documents?.length || 0} Documents &bull; {concept.videos?.length || 0} Lectures
                  </span>
                </div>

                <h1 className="text-white fw-bold mb-3" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)" }}>
                  {concept.name}
                </h1>
                <p className="lead text-white-50 mb-0" style={{ maxWidth: 720, lineHeight: 1.6 }}>
                  {concept.short_description}
                </p>
              </div>

              {/* Price & Unlock Actions in Header */}
              <div className="col-12 col-lg-4 text-lg-end">
                <div className="d-flex flex-column align-items-lg-end gap-2">
                  {unlocked ? (
                    <span className="badge bg-success text-white px-4 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2 fs-6">
                      <i className="bi bi-patch-check-fill" /> Full Access Unlocked
                    </span>
                  ) : (
                    <>
                    {pricing.hasOffer && (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1">
                        <span className="text-decoration-line-through me-1">₹{pricing.originalPrice}</span>{pricing.discountPercent}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm d-inline-flex align-items-center gap-2"
                      onClick={handlePayForConcept}
                      disabled={paying}
                    >
                      {paying ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-unlock-fill" />
                          <span>Unlock for ₹{price}</span>
                        </>
                      )}
                    </button>
                    </>
                  )}

                  <Link
                    to="/lectures-and-materials"
                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                  >
                    <i className="bi bi-arrow-left" />
                    <span>All Subjects</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Information, Related Documents, Related Videos) */}
          {concept && (
            <div className="oc-details-tabs mt-4">
              <button
                type="button"
                className={`oc-details-tab ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <i className="bi bi-info-circle-fill me-2" />
                Concept Information
              </button>
              <button
                type="button"
                className={`oc-details-tab ${activeTab === "documents" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("documents");
                  refreshConceptResources();
                }}
              >
                <i className="bi bi-file-earmark-text-fill me-2" />
                Related Documents ({concept.documents?.length || 0})
              </button>
              <button
                type="button"
                className={`oc-details-tab ${activeTab === "videos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("videos");
                  refreshConceptResources();
                }}
              >
                <i className="bi bi-play-circle-fill me-2" />
                Related Videos ({concept.videos?.length || 0})
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container py-5">
        {payNotice && (
          <div className={`alert alert-${payNotice.type} py-3 px-4 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${payNotice.type === "success" ? "bi-check-circle-fill fs-5 text-success" : "bi-exclamation-octagon-fill fs-5 text-danger"}`} />
              <span className="fw-semibold">{payNotice.msg}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setPayNotice(null)} />
          </div>
        )}

        {concept && (
          <>
            {/* ============================================================
                TAB 1: CONCEPT INFORMATION & SYLLABUS
                ============================================================ */}
            {activeTab === "info" && (
              <div className="row g-4">
                <div className="col-12 col-lg-8">
                  {/* Detailed Description */}
                  <div className="oc-info-card mb-4">
                    <div className="oc-info-card-header">
                      <i className="bi bi-book-half text-primary me-2 fs-5" />
                      <h3 className="h5 mb-0 fw-bold">Overview &amp; Concept Architecture</h3>
                    </div>
                    <div className="oc-info-card-body">
                      <div className="oc-rich-text" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                        {concept.description || concept.short_description}
                      </div>
                    </div>
                  </div>

                  {/* Important Points Highlight Box */}
                  {concept.important_points && concept.important_points.length > 0 && (
                    <div className="oc-info-card mb-4 oc-card-highlights">
                      <div className="oc-info-card-header">
                        <i className="bi bi-stars text-warning me-2 fs-5" />
                        <h3 className="h5 mb-0 fw-bold">Important Highlights &amp; Key Takeaways</h3>
                      </div>
                      <div className="oc-info-card-body">
                        <div className="row g-3">
                          {concept.important_points.map((pt, idx) => (
                            <div className="col-12" key={idx}>
                              <div className="oc-highlight-item d-flex align-items-start gap-3">
                                <span className="oc-highlight-bullet">
                                  <i className="bi bi-check2-circle" />
                                </span>
                                <span className="flex-grow-1" style={{ lineHeight: 1.55 }}>
                                  {pt}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Code Examples & Notes */}
                  {concept.examples_notes && (
                    <div className="oc-info-card mb-4">
                      <div className="oc-info-card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-terminal-fill text-success me-2 fs-5" />
                          <h3 className="h5 mb-0 fw-bold">Code Examples &amp; Syntax Notes</h3>
                        </div>
                        <span className="badge bg-dark text-white-50 border border-secondary-subtle">
                          Live Code Snippet
                        </span>
                      </div>
                      <div className="oc-info-card-body p-0">
                        <pre className="oc-code-block m-0 p-3">
                          <code>{concept.examples_notes}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar: Topics Covered / Quick Specs */}
                <div className="col-12 col-lg-4">
                  {/* Topics Covered */}
                  {concept.topics_covered && concept.topics_covered.length > 0 && (
                    <div className="oc-info-card mb-4">
                      <div className="oc-info-card-header">
                        <i className="bi bi-list-check text-info me-2 fs-5" />
                        <h3 className="h5 mb-0 fw-bold">Topics Covered</h3>
                      </div>
                      <div className="oc-info-card-body p-0">
                        <ul className="list-group list-group-flush oc-topics-list">
                          {concept.topics_covered.map((topic, i) => (
                            <li className="list-group-item d-flex align-items-center gap-2 py-3" key={i}>
                              <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: "0.95rem" }} />
                              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Box */}
                  <div className="oc-sidebar-action-card p-4 rounded-4 text-center">
                    <div className="oc-sidebar-icon-glow mb-3">
                      <i className="bi bi-mortarboard-fill text-primary" style={{ fontSize: "2rem" }} />
                    </div>
                    <h4 className="fw-bold mb-2">
                      {unlocked ? "Study Materials Active" : `Enroll in ${concept.name}`}
                    </h4>
                    <p className="text-muted mb-3" style={{ fontSize: "0.88rem" }}>
                      {unlocked
                        ? "Access lecture slides and watch video recordings for this concept module."
                        : `Unlock full access to all ${concept.documents?.length || 0} study documents and ${concept.videos?.length || 0} HD lectures.`}
                    </p>
                    <div className="d-grid gap-2">
                      {unlocked ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary rounded-pill py-2"
                            onClick={() => setActiveTab("documents")}
                          >
                            <i className="bi bi-files me-2" />
                            Browse {concept.documents?.length || 0} Documents
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-pill py-2"
                            onClick={() => setActiveTab("videos")}
                          >
                            <i className="bi bi-play-circle me-2" />
                            Watch {concept.videos?.length || 0} Videos
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                          onClick={handlePayForConcept}
                          disabled={paying}
                        >
                          {paying ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-unlock-fill" /> Unlock for ₹{price}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 2: RELATED DOCUMENTS
                ============================================================ */}
            {activeTab === "documents" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                      <i className="bi bi-file-earmark-text text-primary" />
                      <span>Curriculum Documents for {concept.name}</span>
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                      {unlocked
                        ? "View study handbooks and educational materials securely with watermarked DRM protection."
                        : "Preview available documents. Unlock this subject to read materials in full HD DRM viewer."}
                    </p>
                  </div>
                  <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill border">
                    {concept.documents?.length || 0} Resources Available
                  </span>
                </div>

                {!unlocked && (
                  <div className="alert alert-warning py-3 px-4 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-lock-fill fs-5 text-warning-emphasis" />
                      <div>
                        <strong>Subject Materials Locked:</strong> Complete enrollment of ₹{price} to unlock full access to all handbooks and slides.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1"
                      onClick={handlePayForConcept}
                      disabled={paying}
                    >
                      <i className="bi bi-unlock-fill me-1" /> Unlock for ₹{price}
                    </button>
                  </div>
                )}

                {(!concept.documents || concept.documents.length === 0) ? (
                  <div className="oc-empty-state text-center py-5">
                    <i className="bi bi-folder-x text-muted" style={{ fontSize: "3rem" }} />
                    <h4 className="mt-3">No documents uploaded yet</h4>
                    <p className="text-muted">Your instructor has not published document files for this concept.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {concept.documents.map((doc) => {
                      const docUnlocked = isDocUnlocked(doc);
                      return (
                        <div className="col-12" key={doc.id}>
                          <div className="oc-doc-card p-4 rounded-4 shadow-sm bg-white border d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                            <div className="d-flex align-items-start gap-3">
                              <div className="oc-doc-icon-box">
                                <i className={`bi ${getDocIcon(doc.file_type)} fs-2`} />
                              </div>
                              <div>
                                <h3 className="h6 fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                  <span>{doc.title}</span>
                                  <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: "0.68rem" }}>
                                    {doc.file_type || "PDF"}
                                  </span>
                                  {doc.formatted_size && (
                                    <span className="badge bg-light text-muted border" style={{ fontSize: "0.68rem" }}>
                                      {doc.formatted_size}
                                    </span>
                                  )}
                                  {doc.is_locked === false && !unlocked && (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.68rem" }}>
                                      <i className="bi bi-unlock-fill me-1" /> Free Access
                                    </span>
                                  )}
                                </h3>
                                {doc.description && (
                                  <p className="text-muted mb-0" style={{ fontSize: "0.86rem", maxWidth: 650 }}>
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill px-4 py-2 d-inline-flex align-items-center gap-1 shadow-sm ${
                                  docUnlocked ? "btn-primary" : "btn-warning text-dark fw-bold"
                                }`}
                                onClick={() => handleDocumentClick(doc)}
                              >
                                {docUnlocked ? (
                                  <>
                                    <i className="bi bi-eye-fill" />
                                    <span>View Online</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-lock-fill" />
                                    <span>Locked</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================
                TAB 3: RELATED VIDEOS
                ============================================================ */}
            {activeTab === "videos" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                      <i className="bi bi-play-circle text-danger" />
                      <span>Video Lectures for {concept.name}</span>
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                      Watch high-definition instructor lectures, coding walkthroughs, and topic demonstrations.
                    </p>
                  </div>
                  <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill border">
                    {concept.videos?.length || 0} Lectures Available
                  </span>
                </div>

                {!unlocked && !activeVideo && (
                  <div className="alert alert-warning py-3 px-4 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-lock-fill fs-5 text-warning-emphasis" />
                      <div>
                        <strong>Video Lectures Locked:</strong> Complete enrollment of ₹{price} to stream all HD instructor recordings.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1"
                      onClick={handlePayForConcept}
                      disabled={paying}
                    >
                      <i className="bi bi-unlock-fill me-1" /> Unlock for ₹{price}
                    </button>
                  </div>
                )}

                {/* Inline Active Video Player Banner */}
                {activeVideo && isVidUnlocked(activeVideo) && (
                  <div className={`oc-active-video-container mb-5 p-3 p-md-4 rounded-4 shadow-lg bg-dark ${videoViewSize === "expanded" ? "oc-active-video-container--expanded" : "oc-active-video-container--medium"}`}>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h4 className="text-white mb-0 d-flex align-items-center gap-2 fs-6">
                        <i className="bi bi-play-circle-fill text-danger" />
                        <span>{activeVideo.title}</span>
                      </h4>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="oc-view-size-btn-group" role="group" aria-label="Player Size">
                          <button
                            type="button"
                            className={`btn ${videoViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                            onClick={() => setVideoViewSize("medium")}
                            title="Medium Player View"
                          >
                            <i className="bi bi-window me-1" /> Medium
                          </button>
                          <button
                            type="button"
                            className={`btn ${videoViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                            onClick={() => setVideoViewSize("expanded")}
                            title="Display Entire Website Width"
                          >
                            <i className="bi bi-arrows-fullscreen me-1" /> Entire Website
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-light rounded-pill px-3"
                          onClick={() => setActiveVideoModal(activeVideo)}
                          title="Open Fullscreen Popout Modal"
                        >
                          <i className="bi bi-box-arrow-up-right me-1" /> Popout
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-light rounded-pill px-3"
                          onClick={() => setActiveVideo(null)}
                        >
                          <i className="bi bi-x-lg me-1" /> Close Player
                        </button>
                      </div>
                    </div>

                    <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-black shadow position-relative">
                      {activeVideo.video_url && !isDirectVideo(activeVideo.video_url) ? (
                        <iframe
                          src={getEmbedUrl(activeVideo.video_url)}
                          title={activeVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          controls
                          autoPlay
                          playsInline
                          controlsList="nodownload noplaybackrate noremoteplayback"
                          disablePictureInPicture
                          disableRemotePlayback
                          onContextMenu={(e) => e.preventDefault()}
                          src={activeVideo.video_url}
                          className="w-100 h-100"
                        >
                          <source src={activeVideo.video_url} />
                          Your browser does not support video playback.
                        </video>
                      )}
                    </div>
                  </div>
                )}

                {(!concept.videos || concept.videos.length === 0) ? (
                  <div className="oc-empty-state text-center py-5">
                    <i className="bi bi-camera-video-off text-muted" style={{ fontSize: "3rem" }} />
                    <h4 className="mt-3">No videos posted yet</h4>
                    <p className="text-muted">Video lectures will appear here once published by your instructor.</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {concept.videos.map((vid) => {
                      const vidUnlocked = isVidUnlocked(vid);
                      const thumb = getVideoThumbnail(vid);
                      return (
                        <div className="col-12 col-md-6 col-lg-4" key={vid.id}>
                          <div className="oc-video-card h-100 rounded-4 overflow-hidden shadow-sm bg-white border d-flex flex-column">
                            {/* Video Thumbnail / Preview Banner */}
                            <div
                              className="oc-video-thumb-wrap position-relative cursor-pointer"
                              onClick={() => handleVideoClick(vid)}
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={vid.title}
                                  className="w-100 h-100 object-fit-cover"
                                />
                              ) : (
                                <div className="oc-video-default-thumb">
                                  <i className="bi bi-camera-video-fill text-white-50 fs-1" />
                                </div>
                              )}
                              <div className="oc-play-overlay">
                                <span className="oc-play-button-pulse">
                                  <i className="bi bi-play-fill" />
                                </span>
                              </div>
                              {vid.duration && (
                                <span className="oc-video-duration-badge">
                                  <i className="bi bi-clock me-1" />
                                  {vid.duration}
                                </span>
                              )}
                            </div>

                            {/* Video Info */}
                            <div className="p-3 d-flex flex-column flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <h3 className="h6 fw-bold mb-0 text-dark line-clamp-1" title={vid.title}>
                                  {vid.title}
                                </h3>
                                {vid.is_locked === false && !unlocked && (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle ms-2" style={{ fontSize: "0.68rem" }}>
                                    <i className="bi bi-unlock-fill me-1" /> Free
                                  </span>
                                )}
                              </div>
                              {vid.description && (
                                <p className="text-muted small mb-3 flex-grow-1 line-clamp-2">
                                  {vid.description}
                                </p>
                              )}
                              <button
                                type="button"
                                className={`btn btn-sm w-100 rounded-pill mt-auto d-flex align-items-center justify-content-center gap-1 ${
                                  vidUnlocked ? "btn-outline-danger" : "btn-warning text-dark fw-bold"
                                }`}
                                onClick={() => handleVideoClick(vid)}
                              >
                                {vidUnlocked ? (
                                  <>
                                    <i className="bi bi-play-circle-fill" />
                                    <span>Play Video Lecture</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-lock-fill" />
                                    <span>Locked &bull; Unlock for ₹{price}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* LOCKED MODULE PROMPT MODAL */}
      {lockedPrompt && concept && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={() => setLockedPrompt(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg text-center p-4">
              <div className="mb-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis shadow-sm"
                  style={{ width: 64, height: 64, fontSize: "1.8rem" }}
                >
                  <i className="bi bi-lock-fill" />
                </span>
              </div>

              <h4 className="fw-bold text-dark mb-2">Subject Curriculum Locked</h4>
              <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
                Full access to study handbooks, slides, and HD video recordings for <strong>"{concept.name}"</strong> requires a one-time enrollment payment.
              </p>

              <div className="bg-light p-3 rounded-4 border mb-4">
                <small className="text-muted d-block">One-Time Subject Fee</small>
                {pricing.hasOffer && <small className="text-muted text-decoration-line-through d-block">₹{pricing.originalPrice} before offer</small>}
                <div className="h3 fw-bold text-dark mb-0">₹{price}</div>
                {pricing.hasOffer && <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill mt-1">{pricing.discountPercent}% OFF</span>}
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-primary rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={handlePayForConcept}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-unlock-fill" /> Unlock Full Access for ₹{price}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-light rounded-pill py-2 text-muted"
                  onClick={() => setLockedPrompt(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PROTECTED DOCUMENT MODAL VIEWER (WITH DRM WATERMARK & ANTI-DOWNLOAD)
          ============================================================ */}
      {activeDocument && (
        <div
          className={`oc-doc-viewer-modal-backdrop ${docViewSize === "expanded" ? "oc-doc-viewer-modal-backdrop--expanded" : ""}`}
          onClick={() => setActiveDocument(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <div
            className={`oc-doc-viewer-modal ${docViewSize === "expanded" ? "oc-doc-viewer-modal--expanded" : "oc-doc-viewer-modal--medium"}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="oc-doc-viewer-header">
              <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: "1 1 200px" }}>
                <span className="oc-popover-icon bg-primary text-white flex-shrink-0">
                  <i className="bi bi-shield-lock-fill" />
                </span>
                <div className="overflow-hidden">
                  <h4 className="mb-0 text-white text-truncate" style={{ fontSize: "0.95rem" }} title={activeDocument.title}>
                    {activeDocument.title}
                  </h4>
                  <small className="text-white-50 text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                    🔒 Protected Study Viewer &bull; {concept.name} &bull; (Downloads Disabled)
                  </small>
                </div>
              </div>
              <div className="oc-viewer-controls d-flex align-items-center flex-wrap gap-2">
                {/* Zoom Controls (Visible for documents) */}
                <div className="oc-doc-zoom-toolbar" role="group" aria-label="Document Zoom">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDocZoom((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
                    title="Zoom Out (-25%)"
                    disabled={docZoom <= 0.5}
                  >
                    <i className="bi bi-dash-lg" />
                  </button>
                  <span
                    className="oc-doc-zoom-val"
                    onClick={() => setDocZoom(1)}
                    title="Click to reset zoom to 100%"
                  >
                    {Math.round(docZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDocZoom((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)))}
                    title="Zoom In (+25%)"
                    disabled={docZoom >= 2.5}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                  {docZoom !== 1 && (
                    <button
                      type="button"
                      className="btn oc-doc-zoom-reset-btn"
                      onClick={() => setDocZoom(1)}
                      title="Reset Zoom to 100%"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1" /> Reset
                    </button>
                  )}
                </div>

                {/* Sizing Switcher (Medium vs Entire Website) */}
                <div className="oc-view-size-btn-group" role="group" aria-label="Viewer Size">
                  <button
                    type="button"
                    className={`btn ${docViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                    onClick={() => {
                      setDocViewSize("medium");
                      setDocZoom(1);
                    }}
                    title="Switch to Medium View"
                  >
                    <i className="bi bi-window me-1" />
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${docViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                    onClick={() => setDocViewSize("expanded")}
                    title="Display Entire Website Width"
                  >
                    <i className="bi bi-arrows-fullscreen me-1" />
                    <span>Entire Website</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="btn btn-sm btn-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, padding: 0, border: "1px solid rgba(255, 255, 255, 0.25)" }}
                  onClick={() => {
                    setActiveDocument(null);
                    setDocZoom(1);
                  }}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            <div
              className={`oc-doc-viewer-body position-relative ${docViewSize === "expanded" ? "oc-doc-viewer-body--expanded" : "oc-doc-viewer-body--medium"}`}
              style={{ backgroundColor: "#0f172a", userSelect: "none" }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {!isVideoDoc(activeDocument) && (
                <>
                  <div
                    className="position-absolute top-0 start-0 end-0 mx-3 mt-3 px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                    style={{
                      zIndex: 5,
                      pointerEvents: "none",
                      color: "#f8fafc",
                      background: "rgba(127, 29, 29, 0.94)",
                      border: "1px solid rgba(254, 202, 202, 0.45)",
                      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.3)",
                      fontSize: "0.78rem",
                      lineHeight: 1.4,
                    }}
                    role="status"
                  >
                    <i className="bi bi-shield-lock-fill text-warning flex-shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Security notice:</strong> This document is view-only. Copying, printing, downloading, screen capture, and recording are restricted and monitored.
                    </span>
                  </div>
                  <DynamicWatermark
                    username={user?.name || "Student Viewer"}
                    sessionId="CURRICULUM-DRM"
                    sectionTitle={`${concept.name} - ${activeDocument.title}`}
                  />
                </>
              )}

              {isTextDocument(activeDocument) ? (
                <div
                  className="w-100 h-100 p-3"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "72vh",
                    background: "#0f172a",
                    overflow: "auto",
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div
                    className="w-100 h-100 rounded-3 overflow-hidden bg-white"
                    style={{
                      minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "68vh",
                    }}
                  >
                    <iframe
                      src={getDocumentUrl(activeDocument)}
                      title={activeDocument.title || "Text document"}
                      className="w-100 h-100 border-0"
                      style={{
                        minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "68vh",
                        background: "#fff",
                      }}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              ) : isImageDoc(activeDocument) ? (
                <div
                  className="w-100 h-100 p-3"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "72vh",
                    overflow: "auto",
                    display: "flex",
                    alignItems: docZoom <= 1 ? "center" : "flex-start",
                    justifyContent: docZoom <= 1 ? "center" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      margin: "auto",
                      textAlign: "center",
                      transition: "all 0.2s ease-out",
                    }}
                  >
                    <img
                      src={activeDocument.file_url || activeDocument.file_path}
                      alt={activeDocument.title}
                      style={{
                        width: docZoom !== 1 ? `${Math.round(docZoom * 100)}%` : "100%",
                        maxWidth: docZoom <= 1 ? "100%" : "none",
                        maxHeight: docZoom <= 1 ? (docViewSize === "expanded" ? "calc(100vh - 200px)" : "70vh") : "none",
                        objectFit: "contain",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        pointerEvents: "none",
                        borderRadius: "8px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
              ) : isPdfDoc(activeDocument) ? (
                <div
                  className="w-100 h-100 position-relative"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "72vh",
                    overflow: "auto",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(docZoom * 100)}%`,
                      minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 72)}vh` : "72vh"),
                      height: docZoom > 1 ? `${Math.round(docZoom * 100)}%` : "100%",
                      margin: "0 auto",
                      transition: "width 0.2s ease-out, min-height 0.2s ease-out",
                    }}
                  >
                    <iframe
                      key={`doc-pdf-${activeDocument.id || activeDocument._id || activeDocument.title}-${docViewSize}`}
                      src={`${activeDocument.file_url || activeDocument.file_path}#view=FitH&toolbar=0&navpanes=0`}
                      title={activeDocument.title}
                      className="w-100 h-100 rounded border-0"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 72)}vh` : "72vh"),
                        backgroundColor: "#1e293b",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              ) : isVideoDoc(activeDocument) ? (
                <div className="w-100 h-100 p-2 d-flex align-items-center justify-content-center" style={{ minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "72vh" }}>
                  <div className="w-100 h-100 rounded-3 overflow-hidden bg-black shadow position-relative d-flex align-items-center justify-content-center" style={{ maxHeight: docViewSize === "expanded" ? "calc(96vh - 150px)" : "68vh" }}>
                    <video
                      controls
                      autoPlay
                      playsInline
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      disableRemotePlayback
                      onContextMenu={(e) => e.preventDefault()}
                      src={activeDocument.file_url || activeDocument.file_path}
                      className="w-100 h-100"
                      style={{ maxHeight: docViewSize === "expanded" ? "calc(96vh - 150px)" : "68vh", objectFit: "contain" }}
                    >
                      <source src={activeDocument.file_url || activeDocument.file_path} />
                      Your browser does not support video playback.
                    </video>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center text-white" style={{ minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "72vh" }}>
                  <div className="p-4 rounded-circle bg-dark-subtle mb-3" style={{ width: 84, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`bi ${getDocIcon(activeDocument.file_type)}`} style={{ fontSize: "2.8rem" }} />
                  </div>
                  <h4 className="fw-bold mb-2">{activeDocument.title}</h4>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-primary text-uppercase px-3 py-1">{activeDocument.file_type || "DOCUMENT"}</span>
                    {activeDocument.formatted_size && <span className="badge bg-secondary px-3 py-1">{activeDocument.formatted_size}</span>}
                  </div>
                  <p className="text-white-50 small mb-4" style={{ maxWidth: 520, lineHeight: 1.6 }}>
                    {activeDocument.description || "This lecture resource is protected under the Online Class DRM Academic Policy. Direct downloading and offline distribution are restricted."}
                  </p>
                  <div className="alert alert-dark border border-secondary-subtle py-2 px-4 rounded-pill d-inline-flex align-items-center gap-2 text-white-50" style={{ fontSize: "0.8rem" }}>
                    <i className="bi bi-shield-check text-success" />
                    <span>Academic DRM Active &bull; Monitored Viewer Session</span>
                  </div>
                </div>
              )}
            </div>

            <div className="oc-doc-viewer-footer d-flex justify-content-between align-items-center">
              <span className="text-white-50 small d-flex align-items-center gap-2">
                <i className="bi bi-shield-fill-check text-success" />
                <span>Anti-Download &amp; Academic Watermarking Active &bull; View Only</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-4"
                onClick={() => setActiveDocument(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PROTECTED VIDEO MODAL VIEWER (WITH MEDIUM & ENTIRE WEBSITE SIZING)
          ============================================================ */}
      {activeVideoModal && (
        <div
          className={`oc-doc-viewer-modal-backdrop ${videoViewSize === "expanded" ? "oc-doc-viewer-modal-backdrop--expanded" : ""}`}
          onClick={() => setActiveVideoModal(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <div
            className={`oc-doc-viewer-modal ${videoViewSize === "expanded" ? "oc-doc-viewer-modal--expanded" : "oc-doc-viewer-modal--medium"}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="oc-doc-viewer-header">
              <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: "1 1 200px" }}>
                <span className="oc-popover-icon bg-danger text-white flex-shrink-0">
                  <i className="bi bi-play-circle-fill" />
                </span>
                <div className="overflow-hidden">
                  <h4 className="mb-0 text-white text-truncate" style={{ fontSize: "0.95rem" }} title={activeVideoModal.title}>
                    {activeVideoModal.title}
                  </h4>
                  <small className="text-white-50 text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                    🔒 Protected Video Lecture &bull; {concept.name} &bull; (View Only)
                  </small>
                </div>
              </div>
              <div className="oc-viewer-controls d-flex align-items-center flex-wrap gap-2">
                <div className="oc-view-size-btn-group" role="group" aria-label="Viewer Size">
                  <button
                    type="button"
                    className={`btn ${videoViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                    onClick={() => setVideoViewSize("medium")}
                    title="Switch to Medium View"
                  >
                    <i className="bi bi-window me-1" />
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${videoViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                    onClick={() => setVideoViewSize("expanded")}
                    title="Display Entire Website Width"
                  >
                    <i className="bi bi-arrows-fullscreen me-1" />
                    <span>Entire Website</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, padding: 0, border: "1px solid rgba(255, 255, 255, 0.25)" }}
                  onClick={() => setActiveVideoModal(null)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            <div
              className={`oc-doc-viewer-body position-relative d-flex align-items-center justify-content-center p-2 p-md-3 ${videoViewSize === "expanded" ? "oc-doc-viewer-body--expanded" : "oc-doc-viewer-body--medium"}`}
              style={{ backgroundColor: "#0b1329", userSelect: "none" }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="w-100 h-100 rounded-3 overflow-hidden bg-black shadow position-relative d-flex align-items-center justify-content-center" style={{ maxHeight: videoViewSize === "expanded" ? "calc(96vh - 150px)" : "70vh" }}>
                {activeVideoModal.video_url && !isDirectVideo(activeVideoModal.video_url) ? (
                  <iframe
                    src={getEmbedUrl(activeVideoModal.video_url)}
                    title={activeVideoModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    allowFullScreen
                    className="w-100 h-100 border-0"
                    style={{ minHeight: videoViewSize === "expanded" ? "calc(96vh - 160px)" : "68vh" }}
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    disablePictureInPicture
                    disableRemotePlayback
                    onContextMenu={(e) => e.preventDefault()}
                    src={activeVideoModal.video_url}
                    className="w-100 h-100"
                    style={{ maxHeight: videoViewSize === "expanded" ? "calc(96vh - 160px)" : "68vh", objectFit: "contain" }}
                  >
                    <source src={activeVideoModal.video_url} />
                    Your browser does not support video playback.
                  </video>
                )}
              </div>
            </div>

            <div className="oc-doc-viewer-footer d-flex justify-content-between align-items-center">
              <span className="text-white-50 small d-flex align-items-center gap-2">
                <i className="bi bi-shield-fill-check text-success" />
                <span>Anti-Download &amp; Academic Watermarking Active &bull; View Only</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-4"
                onClick={() => setActiveVideoModal(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
