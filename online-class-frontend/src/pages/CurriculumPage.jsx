import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchConcepts,
  fetchMyConceptAccess,
  fetchSiteSettings,
  createConceptOrder,
  verifyConceptPayment,
} from "../api/client";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { getOfferPricing } from "../utils/offerPricing.js";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function CurriculumPage() {
  const navigate = useNavigate();
  const { isAuthed, user } = useUserAuth();

  const [concepts, setConcepts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_curriculum_concepts");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [unlockedSlugs, setUnlockedSlugs] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_my_concept_access");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("oc_cache_curriculum_concepts");
    } catch {
      return true;
    }
  });
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Payment processing state
  const [payingSlug, setPayingSlug] = useState(null);
  const [payNotice, setPayNotice] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      fetchConcepts({ search, category: activeCategory }),
      isAuthed ? fetchMyConceptAccess() : Promise.resolve({ data: { data: [] } }),
      fetchSiteSettings(),
    ])
      .then(([cRes, aRes, sRes]) => {
        if (!isMounted) return;
        if (cRes.status === "fulfilled" && cRes.value.data?.data) {
          const list = cRes.value.data.data;
          setConcepts(list);
          setError(null);
          try {
            sessionStorage.setItem("oc_cache_curriculum_concepts", JSON.stringify(list));
          } catch {}
        } else if (cRes.status === "rejected" && concepts.length === 0) {
          setError("Failed to load curriculum concepts. Please check your connection.");
        }

        if (aRes.status === "fulfilled" && aRes.value.data?.data) {
          const accessList = aRes.value.data.data || [];
          setUnlockedSlugs(accessList);
          try {
            sessionStorage.setItem("oc_cache_my_concept_access", JSON.stringify(accessList));
          } catch {}
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
  }, [search, activeCategory, isAuthed]);

  const isConceptUnlocked = (concept) => {
    if (!concept) return false;
    if (!paymentEnabled) return true;
    if (concept.is_locked === false) return true;
    const s = concept.slug || String(concept.id);
    return unlockedSlugs.includes(s) || unlockedSlugs.includes(String(concept.id));
  };

  const handlePayForConcept = async (concept, e) => {
    if (e) e.stopPropagation();

    if (!isAuthed) {
      navigate("/login", { state: { from: `/lectures-and-materials` } });
      return;
    }

    const identifier = concept.slug || concept.id;
    setPayingSlug(identifier);
    setPayNotice(null);

    try {
      const res = await createConceptOrder(identifier);

      if (res.data?.already_paid) {
        setUnlockedSlugs((prev) => [...prev, identifier]);
        setPayNotice({ type: "success", msg: `You already have unlocked access to "${concept.name}"!` });
        setPayingSlug(null);
        return;
      }

      const orderData = res.data;

      // Load Razorpay checkout script if not present
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
            await verifyConceptPayment(identifier, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setUnlockedSlugs((prev) => [...prev, identifier, concept.slug]);
            setPayNotice({
              type: "success",
              msg: `Payment successful! Full access for "${concept.name}" is now unlocked.`,
            });
          } catch {
            setPayNotice({
              type: "danger",
              msg: "Payment verification failed. If your account was debited, please contact support.",
            });
          } finally {
            setPayingSlug(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingSlug(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayNotice({
        type: "danger",
        msg: err.response?.data?.message || "Could not start payment. Please verify gateway keys.",
      });
      setPayingSlug(null);
    }
  };

  const categories = [
    { id: "all", label: "All Subjects", icon: "bi-grid-fill" },
    { id: "blue", label: "Python & Core", icon: "bi-filetype-py" },
    { id: "amber", label: "Flask & Backend", icon: "bi-code-slash" },
    { id: "cyan", label: "Frontend & Web", icon: "bi-browser-chrome" },
    { id: "purple", label: "AI & Machine Learning", icon: "bi-cpu" },
    { id: "emerald", label: "Database & SQL", icon: "bi-database" },
    { id: "indigo", label: "Java & Enterprise", icon: "bi-filetype-java" },
  ];

  // Helper to render decorative banner graphics for concept cards
  const renderBannerGraphic = (concept) => {
    const name = concept.name.toLowerCase();
    
    if (name.includes("python")) {
      return (
        <div className="oc-concept-banner oc-banner-python">
          <div className="oc-banner-decor-circle oc-circle-1" />
          <div className="oc-banner-decor-circle oc-circle-2" />
          <div className="oc-banner-content">
            <div className="oc-banner-icon-badge">
              <svg className="oc-svg-icon" viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5h2v-2h-2v2zm0-4h2V6.5h-2v7z"/>
                <path d="M11.92 3C8.42 3 8.16 4.5 8.16 4.5l.01 1.57h3.83v.55H6.26S4 6.35 4 9.87c0 3.52 1.98 3.39 1.98 3.39h1.18v-1.68s-.06-1.98 1.95-1.98h3.33s1.88-.03 1.88-1.85V4.85S14.73 3 11.92 3zm-1.3 1.15c.38 0 .69.31.69.69 0 .38-.31.69-.69.69-.38 0-.69-.31-.69-.69 0-.38.31-.69.69-.69zm1.38 16.85c3.5 0 3.76-1.5 3.76-1.5l-.01-1.57h-3.83v-.55h5.74s2.26.27 2.26-3.25c0-3.52-1.98-3.39-1.98-3.39h-1.18v1.68s.06 1.98-1.95 1.98h-3.33s-1.88.03-1.88 1.85v3.29s-.41 1.85 2.4 1.85zm1.3-1.15c-.38 0-.69-.31-.69-.69 0-.38.31-.69.69-.69.38 0 .69.31.69.69 0 .38-.31.69-.69.69z"/>
              </svg>
            </div>
            <span className="oc-banner-title">PYTHON</span>
          </div>
        </div>
      );
    }

    if (name.includes("flask")) {
      return (
        <div className="oc-concept-banner oc-banner-flask">
          <div className="oc-banner-decor-circle oc-circle-1" />
          <div className="oc-banner-decor-circle oc-circle-2" />
          <div className="oc-banner-content">
            <div className="oc-banner-icon-badge">
              <i className="bi bi-funnel-fill" style={{ fontSize: "1.6rem" }} />
            </div>
            <span className="oc-banner-title">FLASK</span>
          </div>
        </div>
      );
    }

    if (name.includes("frontend") || name.includes("javascript") || name.includes("react")) {
      return (
        <div className="oc-concept-banner oc-banner-frontend">
          <div className="oc-banner-decor-circle oc-circle-1" />
          <div className="oc-banner-decor-circle oc-circle-2" />
          <div className="oc-banner-content">
            <div className="oc-banner-js-tag">JS</div>
            <span className="oc-banner-title">FRONTEND &amp; REACT</span>
            <div className="oc-banner-robot">
              <i className="bi bi-robot" />
            </div>
          </div>
        </div>
      );
    }

    if (name.includes("machine") || name.includes("ai")) {
      return (
        <div className="oc-concept-banner oc-banner-ml">
          <div className="oc-banner-decor-circle oc-circle-1" />
          <div className="oc-banner-decor-circle oc-circle-2" />
          <div className="oc-banner-content">
            <div className="oc-banner-icon-badge">
              <i className="bi bi-cpu-fill" style={{ fontSize: "1.6rem" }} />
            </div>
            <span className="oc-banner-title">MACHINE LEARNING</span>
          </div>
        </div>
      );
    }

    if (name.includes("database") || name.includes("sql")) {
      return (
        <div className="oc-concept-banner oc-banner-db">
          <div className="oc-banner-decor-circle oc-circle-1" />
          <div className="oc-banner-decor-circle oc-circle-2" />
          <div className="oc-banner-content">
            <div className="oc-banner-icon-badge">
              <i className="bi bi-database-fill-gear" style={{ fontSize: "1.6rem" }} />
            </div>
            <span className="oc-banner-title">DATABASE &amp; SQL</span>
          </div>
        </div>
      );
    }

    // Default / Custom Fallback Banner
    return (
      <div className={`oc-concept-banner oc-banner-${concept.color_scheme || 'blue'}`}>
        <div className="oc-banner-decor-circle oc-circle-1" />
        <div className="oc-banner-decor-circle oc-circle-2" />
        <div className="oc-banner-content">
          <div className="oc-banner-icon-badge">
            <i className={`bi ${concept.icon_class || 'bi-journal-code'}`} style={{ fontSize: "1.6rem" }} />
          </div>
          <span className="oc-banner-title">{concept.name.toUpperCase()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="oc-curriculum-wrapper position-relative">
      {/* Background Watermark Logo across entire curriculum page */}
      <PageBackgroundLogo
        variant="global"
        className="oc-curriculum-bg-logo"
        opacity={0.18}
        size="min(860px, 88vw)"
      />

      {/* Top Header Section */}
      <header className="oc-curriculum-header position-relative overflow-hidden">
        {/* Ambient Header Background Logo */}
        <PageBackgroundLogo
          variant="header"
          className="oc-curriculum-header-logo-bg"
          opacity={0.26}
          size="min(560px, 58vw)"
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="text-white-50 text-decoration-none d-inline-flex align-items-center gap-1 oc-back-link"
            >
              <i className="bi bi-arrow-left" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-2 rounded-pill border border-primary-subtle">
              <i className="bi bi-patch-check-fill me-1 text-primary" /> Verified Academic Curriculum
            </span>
          </div>

          {/* Reference Image Style Title Banner */}
          <div className="oc-curriculum-title-badge mb-2">
            <i className="bi bi-book text-primary me-2" />
            <span>Student Curriculum</span>
          </div>

          <h1 className="text-white mt-2 mb-2" style={{ fontSize: "clamp(2rem, 4.5vw, 2.75rem)", fontWeight: 800 }}>
            Lecture &amp; Study Materials
          </h1>
          <p className="oc-curriculum-subtitle">
            Explore topic-specific learning modules. Click <strong>Know more</strong> or <strong>Unlock</strong> on any subject card to access full
            explanations, downloadable lecture slides, practice documents, and high-definition video walkthroughs.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="oc-curriculum-filter-bar mt-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div className="oc-search-input-wrap">
                  <i className="bi bi-search oc-search-icon" />
                  <input
                    type="text"
                    className="form-control oc-search-input"
                    placeholder="Search Python, Flask, Frontend, SQL..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="btn btn-sm oc-search-clear"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                    >
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-7">
                <div className="oc-category-pills-scroll">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`oc-cat-pill ${activeCategory === cat.id ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <i className={`bi ${cat.icon} me-1`} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Concept Cards Grid */}
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

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted fw-semibold">Loading concept modules&hellip;</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger p-4 rounded-4 shadow-sm text-center">
            <i className="bi bi-exclamation-triangle-fill text-danger me-2 fs-5" />
            {error}
          </div>
        )}

        {!loading && !error && concepts.length === 0 && (
          <div className="oc-empty-state text-center py-5">
            <div className="oc-empty-icon mb-3">
              <i className="bi bi-folder-x text-muted" style={{ fontSize: "3rem" }} />
            </div>
            <h4 className="text-dark fw-bold">No concepts found</h4>
            <p className="text-muted mb-3">
              {search
                ? `No concept matches "${search}". Try a different keyword.`
                : "No concepts have been published yet by the instructor."}
            </p>
            {search && (
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Concept Cards Grid (Modeled directly on reference image with Lock/Unlock indicators) */}
        {!loading && !error && concepts.length > 0 && (
          <div className="row g-4 oc-concept-grid">
            {concepts.map((concept) => {
              const unlocked = isConceptUnlocked(concept);
              const pricing = getOfferPricing(concept);
              const price = pricing.price;
              const isPaying = payingSlug === (concept.slug || concept.id);

              return (
                <div className="col-12 col-md-6 col-lg-4" key={concept.id}>
                  <div
                    className={`oc-concept-card oc-theme-${concept.color_scheme || "blue"}`}
                    onClick={() => navigate(`/lectures-and-materials/concept/${concept.slug || concept.id}`)}
                  >
                    {/* Top Colored Banner (Modeled on uploaded reference image) */}
                    {concept.image_url ? (
                      <div
                        className="oc-concept-banner oc-banner-custom-img"
                        style={{ backgroundImage: `url(${concept.image_url})` }}
                      >
                        <div className="oc-banner-overlay" />
                        <div className="oc-banner-content">
                          <span className="oc-banner-title">{concept.name.toUpperCase()}</span>
                        </div>
                      </div>
                    ) : (
                      renderBannerGraphic(concept)
                    )}

                    {/* Card Content Body */}
                    <div className="oc-concept-body">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h3 className="oc-concept-name mb-0">{concept.name}</h3>
                        {unlocked ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                            <i className="bi bi-check-circle-fill me-1" /> Unlocked
                          </span>
                        ) : (
                          <span className="d-inline-flex align-items-center gap-1">
                          {pricing.hasOffer && <span className="small text-muted text-decoration-line-through">₹{pricing.originalPrice}</span>}
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill small fw-bold">
                            <i className="bi bi-lock-fill me-1" /> ₹{price}
                          </span>
                          {pricing.hasOffer && <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill small">{pricing.discountPercent}% OFF</span>}
                          </span>
                        )}
                      </div>

                      {/* Star Rating Badge (5.0 ★★★★★ as in reference image) */}
                      <div className="oc-concept-rating">
                        <span className="oc-rating-score">
                          {concept.rating ? Number(concept.rating).toFixed(1) : "5.0"}
                        </span>
                        <div className="oc-rating-stars">
                          <i className="bi bi-star-fill" />
                          <i className="bi bi-star-fill" />
                          <i className="bi bi-star-fill" />
                          <i className="bi bi-star-fill" />
                          <i className="bi bi-star-fill" />
                        </div>
                        <span className="oc-concept-res-count ms-auto">
                          <i className="bi bi-files me-1" />
                          {concept.documents_count || 0} Docs &bull; {concept.videos_count || 0} Videos
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="oc-concept-desc">
                        {concept.short_description ||
                          "Explore comprehensive lecture notes, documents, and video walkthroughs for this curriculum."}
                      </p>

                      {/* Action Buttons: Unlocked -> 'Study Subject', Locked -> 'Unlock for ₹XXX' / 'Know more' */}
                      <div className="d-flex align-items-center gap-2 mt-auto pt-2">
                        {unlocked ? (
                          <button
                            type="button"
                            className="oc-btn-know-more w-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/lectures-and-materials/concept/${concept.slug || concept.id}`);
                            }}
                          >
                            <i className="bi bi-eye" />
                            <span>Study Subject</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary rounded-pill w-100 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                            onClick={(e) => handlePayForConcept(concept, e)}
                            disabled={isPaying}
                          >
                            {isPaying ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" />
                                <span>Connecting...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-unlock-fill" />
                                <span>Unlock Subject (₹{price})</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
