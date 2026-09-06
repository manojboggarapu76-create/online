import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import api, { fetchPublicReviews } from "../api/client";
import CareerPathwaysSection from "../components/CareerPathwaysSection.jsx";
import EducationScrollScene from "../components/EducationScrollScene.jsx";
import ArchitectureScrollScene from "../components/ArchitectureScrollScene.jsx";
import ScrollDepthSection from "../components/ScrollDepthSection.jsx";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";
import EducationLogo from "../components/EducationLogo.jsx";

export default function HomePage() {
  const { isAuthed, user } = useUserAuth();

  const [welcomeInfo, setWelcomeInfo] = useState({
    title: "Online Class",
    tagline: "Your whole classroom, in one binder",
    media_url: null,
  });
  const [liveReviews, setLiveReviews] = useState([]);

  useEffect(() => {
    // Load welcome info
    api
      .get("/welcome-screen")
      .then((res) => {
        if (res.data) setWelcomeInfo(res.data);
      })
      .catch(() => {});

    // Load student reviews
    fetchPublicReviews()
      .then((res) => {
        if (res.data?.data?.length) {
          setLiveReviews(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const testimonials = [
    {
      name: "Siddharth Verma",
      role: "Backend Software Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      rating: 5,
      comment:
        "The Python and Flask specialization modules made understanding complex backend architecture effortless. Having lecture slides, handbooks, and HD video walkthroughs in one place is unbeatable.",
    },
    {
      name: "Priya Sharma",
      role: "Full Stack Developer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
      rating: 5,
      comment:
        "The curriculum structure is top tier. The Frontend and React concepts were crystal clear, and the in-browser protected viewer let me study anywhere without worrying about missing slides.",
    },
    {
      name: "Arjun Mehta",
      role: "Data Analyst",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      rating: 5,
      comment:
        "The Database & SQL module gave me the exact query optimization and indexing knowledge I needed for production systems. 5 stars all the way!",
    },
  ];

  return (
    <div className="oc-home-page-root">
      {/* ============================================================
          1. HERO SECTION
          ============================================================ */}
      <ScrollDepthSection className="oc-hero-section position-relative overflow-hidden" depth="hero">
        {/* Ambient Hero Background Logo */}
        <PageBackgroundLogo variant="header" />
        {/* Animated Background Mesh & Glow */}
        <div className="oc-hero-ambient-glow oc-glow-1" />
        <div className="oc-hero-ambient-glow oc-glow-2" />
        <div className="oc-hero-grid-pattern" />

        <div className="container position-relative py-5 py-lg-6" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">
            {/* Left Hero Text */}
            <div className="col-12 col-lg-7 text-center text-lg-start">
              {/* Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill oc-hero-pill mb-3">
                <span className="oc-pill-dot" />
                <span className="oc-pill-text">Next-Gen Digital Learning &amp; Academic Platform</span>
              </div>

              {/* Headline */}
              <h1 className="oc-hero-headline text-white mb-3">
                Master Modern Engineering with <span className="oc-text-gradient-cyan">Interactive Concepts</span> &amp; Real Materials.
              </h1>

              {/* Subtitle */}
              <p className="oc-hero-subtext mb-4">
                {welcomeInfo.tagline ||
                  "Access structured concept modules, comprehensive study handbooks, protected lecture notes, and HD video walkthroughs — built for serious students and developers."}
              </p>

              {/* Dashboard access remains available to authenticated students. */}
              {isAuthed && (
                <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start align-items-center mb-4">
                  <Link to="/dashboard" className="btn oc-btn-hero-gradient">
                    <i className="bi bi-grid-fill me-2" />
                    Open Classroom Dashboard
                  </Link>
                </div>
              )}

              {/* Quick Feature Badges */}
              <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start oc-hero-badges">
                <span className="oc-badge-glass">
                  <i className="bi bi-shield-check text-success me-1" /> DRM Protected Handbooks
                </span>
                <span className="oc-badge-glass">
                  <i className="bi bi-camera-video text-info me-1" /> HD Video Lectures
                </span>
                <span className="oc-badge-glass">
                  <i className="bi bi-patch-check-fill text-warning me-1" /> 5.0 Star Curriculum
                </span>
              </div>
            </div>

            {/* Right Hero Card: Interactive Portal Box */}
            <div className="col-12 col-lg-5">
              <div className="oc-hero-card-glass p-4 p-md-5 rounded-4 shadow-lg text-center position-relative">
                <div className="oc-hero-logo-wrap mb-3">
                  <div className="oc-hero-logo-glow" />
                  <div className="oc-hero-logo-icon d-flex align-items-center justify-content-center">
                    <EducationLogo size={54} />
                  </div>
                </div>

                <h2 className="text-white fw-bold h4 mb-2">{welcomeInfo.title || "Online Class"}</h2>
                <p className="text-white-50 small mb-4">
                  Seamless portal for lecture slides, study notes, live sessions, expert suggestions, and proxy support.
                </p>

                {isAuthed ? (
                  /* Properly styled Active Student Session */
                  <div
                    className="p-4 rounded-4 text-start"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge bg-success text-white px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1 small">
                        <span className="oc-pill-dot bg-white" style={{ width: 6, height: 6 }} />
                        <span className="fw-bold">Active Student Session</span>
                      </span>
                      <span className="badge bg-white-subtle text-white-50 border border-white-subtle rounded-pill small">
                        Online
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm flex-shrink-0"
                        style={{
                          width: 48,
                          height: 48,
                          fontSize: "1.25rem",
                          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : <i className="bi bi-person-fill" />}
                      </div>
                      <div>
                        <small className="text-white-50 d-block" style={{ fontSize: "0.78rem" }}>
                          Logged in as
                        </small>
                        <h3 className="h5 text-white fw-bold mb-0 text-capitalize">
                          {user?.name || "kumar"}
                        </h3>
                        {user?.email && (
                          <small className="text-white-50" style={{ fontSize: "0.78rem" }}>
                            {user.email}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </ScrollDepthSection>

      <EducationScrollScene />

      {/* ============================================================
          1B. 3D SCROLL ANIMATION — EDUCATION SHOWCASE
          ============================================================ */}
      {/* ============================================================
          2. FEATURES / SERVICES SECTION
          ============================================================ */}
      <ScrollDepthSection className="oc-features-section py-5 py-lg-6" depth="features">
        {/* Background Watermark Logo — matching Curriculum Page clarity */}
        <PageBackgroundLogo
          variant="section"
          className="oc-home-section-bg-logo oc-features-bg-logo"
          opacity={0.16}
          size="min(860px, 88vw)"
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="oc-section-eyebrow text-emerald">
              <i className="bi bi-lightning-charge-fill me-1" /> Platform Capabilities
            </span>
            <h2 className="oc-section-title">Everything You Need To Master Technology</h2>
            <p className="oc-section-subtitle">
              Engineered with academic precision, high security, and dynamic multimedia resources for accelerated learning.
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="oc-feature-card oc-feat-emerald">
                <div className="oc-feat-icon-box">
                  <i className="bi bi-journal-code" />
                </div>
                <h3 className="oc-feat-title">Concept-Driven Curriculum</h3>
                <p className="oc-feat-desc">
                  Structured modules connecting overview information, syllabus topics, code examples, and practice documents.
                </p>
                <div className="oc-feat-tag">Structured Learning</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="oc-feature-card oc-feat-teal">
                <div className="oc-feat-icon-box">
                  <i className="bi bi-play-circle-fill" />
                </div>
                <h3 className="oc-feat-title">HD Video Lectures</h3>
                <p className="oc-feat-desc">
                  Topic-specific video demonstrations and recordings playable directly in your browser with responsive speed controls.
                </p>
                <div className="oc-feat-tag">Instant Streaming</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="oc-feature-card oc-feat-violet">
                <div className="oc-feat-icon-box">
                  <i className="bi bi-shield-lock-fill" />
                </div>
                <h3 className="oc-feat-title">Protected Content Guard</h3>
                <p className="oc-feat-desc">
                  Built-in DRM viewers with real-time student watermarks and encrypted delivery to safeguard academic integrity.
                </p>
                <div className="oc-feat-tag">DRM Watermarked</div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="oc-feature-card oc-feat-amber">
                <div className="oc-feat-icon-box">
                  <i className="bi bi-people-fill" />
                </div>
                <h3 className="oc-feat-title">Proxy &amp; Session Support</h3>
                <p className="oc-feat-desc">
                  Stand-in coverage, missed session summaries, instructor suggestions, and dedicated classroom assistance.
                </p>
                <div className="oc-feat-tag">Student Assistance</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollDepthSection>

      {/* ============================================================
          3. 3D SCROLL ANIMATION — ARCHITECTURAL DECONSTRUCTION (Isometric Exploded Stack)
          ============================================================ */}
      <ArchitectureScrollScene />

      {/* ============================================================
          4. CAREER PATHWAYS / CURATED ENGINEERING SPECIALIZATIONS (Shown only when Logged In)
          ============================================================ */}
      {isAuthed && (
        <ScrollDepthSection
          as="div"
          className="oc-home-pathways-depth position-relative"
          depth="pathways"
          fixedOverlaySafe
        >
          {/* Background Watermark Logo — Display very big & prominent matching Curriculum Page */}
          <PageBackgroundLogo
            variant="section"
            className="oc-home-section-bg-logo oc-pathways-bg-logo"
            opacity={0.18}
            size="min(940px, 94vw)"
          />
          <div className="position-relative" style={{ zIndex: 1 }}>
            <CareerPathwaysSection />
          </div>
        </ScrollDepthSection>
      )}

      {/* ============================================================
          5. TESTIMONIALS SECTION
          ============================================================ */}
      <ScrollDepthSection className="oc-testimonials-section py-5 py-lg-6" depth="testimonials">
        {/* Background Watermark Logo — matching Curriculum Page clarity */}
        <PageBackgroundLogo
          variant="section"
          className="oc-home-section-bg-logo oc-testimonials-bg-logo"
          opacity={0.16}
          size="min(860px, 88vw)"
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="oc-section-eyebrow text-indigo">
              <i className="bi bi-chat-square-quote-fill me-1" /> Student Feedback
            </span>
            <h2 className="oc-section-title">Loved by Students &amp; Software Engineers</h2>
            <p className="oc-section-subtitle">
              Read how our structured classroom materials and live curriculum helped engineers land top tech roles.
            </p>
          </div>

          <div className="row g-4">
            {(liveReviews.length > 0
              ? liveReviews.map((r) => ({
                  name: r.user?.name || "Student Reviewer",
                  role: "Verified Student",
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || "Student")}&background=4f46e5&color=fff`,
                  rating: r.rating || 5,
                  comment: r.review,
                }))
              : testimonials
            ).map((t, idx) => (
              <div className="col-12 col-md-4" key={idx}>
                <div className="oc-testimonial-card p-4 rounded-4 shadow-sm bg-white border h-100 d-flex flex-column">
                  <div className="d-flex align-items-center gap-1 text-warning mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <i className="bi bi-star-fill" key={i} />
                    ))}
                  </div>
                  <p className="text-muted flex-grow-1 mb-4" style={{ fontSize: "0.93rem", lineHeight: 1.6 }}>
                    &ldquo;{t.comment}&rdquo;
                  </p>
                  <div className="d-flex align-items-center gap-3 pt-3 border-top mt-auto">
                    <img src={t.avatar} alt={t.name} className="oc-testi-avatar" />
                    <div>
                      <h4 className="h6 fw-bold mb-0 text-dark">{t.name}</h4>
                      <small className="text-muted">{t.role}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollDepthSection>

      {/* ============================================================
          6. CALL TO ACTION (CTA) SECTION
          ============================================================ */}
      {isAuthed && (
        <ScrollDepthSection className="oc-cta-section py-5" depth="cta">
          <div className="container">
            <div className="oc-cta-banner p-4 p-md-5 rounded-4 shadow-lg text-center text-md-start">
              <div className="row align-items-center g-4">
                <div className="col-12">
                  <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold mb-2">
                    <i className="bi bi-stars me-1" /> Unlimited Academic Access
                  </span>
                  <h2 className="text-white fw-bold display-6 mb-2">
                    Ready to Start Learning With Online Class?
                  </h2>
                  <p className="text-white-50 mb-0" style={{ maxWidth: 720 }}>
                    Join thousands of students studying Python, Flask, Frontend, Machine Learning, and SQL. Explore all
                    educational materials, interactive handbooks, and live classes today.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollDepthSection>
      )}
    </div>
  );
}
