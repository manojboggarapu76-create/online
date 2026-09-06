import { useEffect, useRef, useState, useCallback } from "react";

/**
 * ArchitectureScrollScene
 * ------------------------------------------------------------------
 * 3D Spatial Perspective Horizon Deck (New 3D Angle Design)
 *
 * Completely replaces the previous stacked slab/pedestal model with a
 * cinematic 3D Spatial Perspective Deck:
 * 1. Perspective Horizon Stage (perspective: 1100px):
 *    - The active tier is positioned front-and-center (rotateY: 0deg, translateZ: +80px),
 *      large, straight, and 100% crystal clear.
 *    - The flanking tiers angle symmetrically into 3D depth (rotateY: ±34deg, translateZ: -160px),
 *      providing a stunning bilateral 3D perspective without any overlapping text or clumsiness.
 * 2. Smooth 3D Gliding Scrollytelling:
 *    - As the user scrolls through the section, the cards glide fluidly across the 3D horizon,
 *      bringing each tier forward one by one into the active center spotlight.
 * 3. 1-Click Interactive Navigation:
 *    - Step pills above, side arrow paddles (< and >), and clicking any angled 3D card
 *      immediately glides that tier front-and-center.
 * ------------------------------------------------------------------
 */

const ARCH_LAYERS = [
  {
    id: "layer-cloud",
    step: "01",
    level: "Tier 01 · Infrastructure",
    title: "High-Availability Cloud Core",
    subtitle: "Enterprise REST Gateway & Resilient Data Persistence",
    desc: "The rock-solid infrastructure foundation of Online Class. Delivers sub-100ms API responses, indexes course curricula automatically, and synchronizes student progress across devices with zero data loss.",
    icon: "bi-server",
    badge: "99.9% Uptime SLA",
    accentColor: "#f59e0b", // Amber
    glowColor: "rgba(245, 158, 11, 0.45)",
    specs: ["REST Gateway", "Session Sync", "MySQL Relational", "Telemetry Engine"],
    stats: [
      { label: "Latency", value: "< 100ms" },
      { label: "Availability", value: "99.9%" },
      { label: "Database", value: "ACID Relational" },
    ],
  },
  {
    id: "layer-drm",
    step: "02",
    level: "Tier 02 · Protection",
    title: "DRM Security & Anti-Leak Core",
    subtitle: "Real-Time Watermarking & Dynamic Tamper Prevention",
    desc: "Protects proprietary course handbooks, slides, and videos. Dynamically stamps per-session student watermarks, encrypts media streams, and detects developer tools to prevent screen captures.",
    icon: "bi-shield-shaded",
    badge: "AES-256 DRM Guard",
    accentColor: "#a855f7", // Violet
    glowColor: "rgba(168, 85, 247, 0.45)",
    specs: ["Dynamic Watermarks", "Token Protection", "Screenshot Guard", "DevTools Shield"],
    stats: [
      { label: "Encryption", value: "AES-256" },
      { label: "Watermark", value: "Per-Student Dynamic" },
      { label: "Integrity", value: "Anti-Tamper" },
    ],
  },
  {
    id: "layer-media",
    step: "03",
    level: "Tier 03 · Pipeline",
    title: "Adaptive Video & Lecture Engine",
    subtitle: "Hardware-Accelerated HD Streaming & Synced Handbooks",
    desc: "Provides lag-free 1080p 60FPS video walkthroughs with browser-native speed toggles (0.75x to 2.0x), instant buffering, and timestamped links directly connected to course handbooks.",
    icon: "bi-play-circle-fill",
    badge: "HD 60FPS Video",
    accentColor: "#10b981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.45)",
    specs: ["1080p 60FPS Stream", "Playback Speed Controls", "Instant Buffering", "Timestamp Sync"],
    stats: [
      { label: "Resolution", value: "1080p HD" },
      { label: "Frame Rate", value: "60 FPS" },
      { label: "Speed Controls", value: "0.5x - 2.0x" },
    ],
  },
  {
    id: "layer-ui",
    step: "04",
    level: "Tier 04 · Experience",
    title: "Interactive Student Workspace",
    subtitle: "All-in-One Digital Binder, Notes & Code Viewer",
    desc: "Your complete classroom in one binder. Seamlessly integrates syllabus roadmaps, comprehensive handbooks, downloadable practice exercises, and live expert suggestions into a single focused workspace.",
    icon: "bi-laptop-fill",
    badge: "Interactive UI",
    accentColor: "#0ea5e9", // Sky Blue
    glowColor: "rgba(14, 165, 233, 0.45)",
    specs: ["Modular Binder", "Code Snippets", "Protected Slides", "Live Suggestions"],
    stats: [
      { label: "Workspace", value: "All-in-One" },
      { label: "Curriculum", value: "5.0 Star Rated" },
      { label: "Navigation", value: "One-Click Instant" },
    ],
  },
];

export default function ArchitectureScrollScene() {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeTierIdx, setActiveTierIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isButtonNavRef = useRef(false);
  const buttonNavTimerRef = useRef(null);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setProgress(0);
      return undefined;
    }

    let rafId = null;

    const computeProgress = () => {
      rafId = null;
      const el = trackRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const totalScrollable = el.offsetHeight - viewportHeight;
      if (totalScrollable <= 0) return;

      // When the top of track hits top of window: rect.top <= 0
      // Scrolled distance inside track = -rect.top
      const scrolled = -rect.top;
      let p = scrolled / totalScrollable;
      if (p < 0) p = 0;
      if (p > 1) p = 1;

      if (Math.abs(p - lastProgressRef.current) > 0.0008) {
        lastProgressRef.current = p;
        setProgress(p);

        // While scrolling naturally (not during an instant button click), update active tier
        if (!isButtonNavRef.current) {
          const scrollTier = Math.min(
            ARCH_LAYERS.length - 1,
            Math.max(0, Math.floor(p * ARCH_LAYERS.length))
          );
          setActiveTierIdx(scrollTier);
        }
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(computeProgress);
      }
    };

    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      checkMobile();
      onScroll();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (buttonNavTimerRef.current) clearTimeout(buttonNavTimerRef.current);
    };
  }, []);

  const activeIndex = activeTierIdx;
  const activeTier = ARCH_LAYERS[activeIndex];

  // Subtle camera tilt tracking progress (2deg to 6deg)
  const cameraPitch = 5 - (progress - 0.5) * 3;

  // Smoothly jump to a specific tier within the pinned track (seamless looping)
  const goToTier = useCallback((targetIndex) => {
    const nextIdx = (targetIndex + ARCH_LAYERS.length) % ARCH_LAYERS.length;
    setActiveTierIdx(nextIdx);

    const targetProgresses = [0.04, 0.32, 0.62, 0.92];
    const targetP = targetProgresses[nextIdx];
    lastProgressRef.current = targetP;
    setProgress(targetP);

    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const trackTop = currentScrollY + rect.top;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const totalScrollable = track.offsetHeight - viewportHeight;

    if (totalScrollable > 0) {
      const targetY = trackTop + targetP * totalScrollable;

      isButtonNavRef.current = true;
      if (buttonNavTimerRef.current) clearTimeout(buttonNavTimerRef.current);
      buttonNavTimerRef.current = setTimeout(() => {
        isButtonNavRef.current = false;
      }, 600);

      // Temporarily override global html smooth-scroll so window.scrollTo is instant,
      // preventing intermediate scroll frames from fighting with activeTierIdx
      const rootHtml = document.documentElement;
      const prevBehavior = rootHtml.style.scrollBehavior;
      rootHtml.style.scrollBehavior = "auto";

      try {
        window.scrollTo({ top: targetY, behavior: "instant" });
      } catch {
        window.scrollTo(0, targetY);
      }

      requestAnimationFrame(() => {
        rootHtml.style.scrollBehavior = prevBehavior;
      });
    }
  }, []);

  const handlePrev = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    goToTier(activeTierIdx - 1);
  }, [activeTierIdx, goToTier]);

  const handleNext = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    goToTier(activeTierIdx + 1);
  }, [activeTierIdx, goToTier]);

  // Keyboard navigation support when viewing section
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;

      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top <= 120 && rect.bottom >= window.innerHeight - 120;
      if (!inView) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Reference index for calculating bilateral 3D card layout
  const referenceIndex = activeTierIdx;

  return (
    <section
      ref={trackRef}
      className="oc-spatial-scroll-track position-relative"
      aria-label="Interactive 3D Spatial Perspective Architecture Showcase"
    >
      {/* Pinned Sticky Stage: Stays in viewport while scrolling through all 4 tiers */}
      <div className="oc-spatial-sticky-stage">
        {/* Background ambient lighting */}
        <div className="oc-spatial-glow oc-spatial-glow-a" />
        <div className="oc-spatial-glow oc-spatial-glow-b" />
        <div className="oc-hero-grid-pattern" />

        <div className="container position-relative h-100 d-flex flex-column justify-content-center py-2 py-md-3" style={{ zIndex: 2, maxHeight: "100vh" }}>
          {/* Section Header */}
          <div className="text-center mb-2 mb-md-3">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill oc-spatial-pill mb-2">
              <span className="oc-pill-dot" style={{ background: activeTier.accentColor }} />
              <span className="oc-pill-text text-cyan">System Architecture · 3D Spatial Perspective Deck</span>
            </div>
            <h2 className="oc-section-title text-white mb-1" style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)" }}>
              Deconstructed Inside The Digital Binder
            </h2>
            <p className="oc-spatial-subtitle mx-auto mb-0" style={{ fontSize: "clamp(0.85rem, 1.4vw, 0.98rem)" }}>
              Scroll down to inspect each architectural layer one by one in 3D perspective space before entering career pathways.
            </p>
          </div>

          {/* Step Indicator Bar */}
          <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center mb-3 oc-spatial-timeline">
            {ARCH_LAYERS.map((layer, idx) => {
              const isCurrent = activeIndex === idx;
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`btn btn-sm oc-spatial-step-btn ${isCurrent ? "is-active" : ""}`}
                  onClick={() => goToTier(idx)}
                  style={{
                    borderColor: isCurrent ? layer.accentColor : undefined,
                    boxShadow: isCurrent ? `0 0 16px ${layer.glowColor}` : undefined,
                  }}
                  title={`Jump to ${layer.level}`}
                >
                  <span
                    className="oc-step-badge"
                    style={{
                      background: isCurrent ? layer.accentColor : "rgba(255,255,255,0.18)",
                      color: isCurrent ? "#050b14" : "#ffffff",
                    }}
                  >
                    {layer.step}
                  </span>
                  <span className="oc-step-text">{layer.title.split(" ")[0]} {layer.title.split(" ")[1]}</span>
                </button>
              );
            })}
          </div>


          {/* 3D Spatial Perspective Horizon Stage */}
          <div className="oc-spatial-stage-wrapper position-relative">
            {/* Perspective Viewport */}
            <div className="oc-spatial-viewport">
              {/* Cyber Runway Horizon Grid Line on Floor */}
              <div className="oc-spatial-runway" aria-hidden="true">
                <div className="oc-runway-line" style={{ background: activeTier.accentColor }} />
              </div>

              {/* 3D Stage Container */}
              <div
                className="oc-spatial-deck"
                style={{
                  transform: `rotateX(${cameraPitch}deg)`,
                }}
              >
                {ARCH_LAYERS.map((layer, idx) => {
                  // Continuous distance relative to current reference index
                  const offset = idx - referenceIndex;
                  const isCurrent = activeIndex === idx;
                  const absOffset = Math.abs(offset);

                  // 3D Spatial Positioning:
                  // - Active card (offset ~ 0): center, straight (rotateY: 0deg), elevated (translateZ: 75px)
                  // - Left cards (offset < 0): angled rightward (rotateY: +34deg), pushed back (translateZ: -140px)
                  // - Right cards (offset > 0): angled leftward (rotateY: -34deg), pushed back (translateZ: -140px)
                  const spreadDist = isMobile ? 150 : 230;
                  const posX = offset * spreadDist;
                  const posZ = isCurrent ? 75 : -140 - (absOffset - 1) * 70;
                  const rotY = offset === 0 ? 0 : offset < 0 ? Math.min(36, 32 + absOffset * 2) : Math.max(-36, -32 - absOffset * 2);
                  const scale = isCurrent ? 1.03 : Math.max(0.72, 0.86 - (absOffset - 1) * 0.08);
                  const opacity = isCurrent ? 1.0 : Math.max(0.24, 0.65 - (absOffset - 1) * 0.25);
                  const zIndex = isCurrent ? 50 : Math.max(10, 30 - Math.round(absOffset * 5));

                  return (
                    <div
                      key={layer.id}
                      className={`oc-spatial-card ${isCurrent ? "is-active-card" : "is-flanking-card"}`}
                      style={{
                        transform: `translate3d(${posX}px, 0, ${posZ}px) rotateY(${rotY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                        borderColor: isCurrent ? layer.accentColor : "rgba(255,255,255,0.14)",
                        boxShadow: isCurrent
                          ? `0 20px 50px rgba(0,0,0,0.8), 0 0 45px ${layer.glowColor}`
                          : `0 10px 25px rgba(0,0,0,0.45)`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToTier(idx);
                      }}
                      title={!isCurrent ? `Click to inspect ${layer.title}` : undefined}
                    >
                      {/* Glowing Top Accent Bar */}
                      <div
                        className="oc-spatial-card-bar"
                        style={{ background: layer.accentColor }}
                      />

                      {/* Card Content */}
                      <div className="p-3 p-md-4 d-flex flex-column h-100">
                        {/* Top Header */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="oc-spatial-icon-box"
                              style={{
                                background: `${layer.accentColor}25`,
                                color: layer.accentColor,
                                border: `1.5px solid ${layer.accentColor}`,
                                boxShadow: isCurrent ? `0 0 20px ${layer.glowColor}` : undefined,
                              }}
                            >
                              <i className={`bi ${layer.icon}`} />
                            </div>
                            <div>
                              <span
                                className="oc-spatial-tier-tag"
                                style={{ color: layer.accentColor }}
                              >
                                {layer.level}
                              </span>
                              <h3 className="h5 text-white fw-bold mb-0">{layer.title}</h3>
                            </div>
                          </div>

                          {/* Status Chip */}
                          <div
                            className="oc-spatial-chip"
                            style={{
                              borderColor: layer.accentColor,
                              background: `${layer.accentColor}18`,
                              color: layer.accentColor,
                            }}
                          >
                            <span
                              className="oc-spatial-chip-dot"
                              style={{ background: layer.accentColor }}
                            />
                            {layer.badge}
                          </div>
                        </div>

                        {/* Subtitle & Description */}
                        <p className="text-cyan small fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                          {layer.subtitle}
                        </p>
                        <p className="text-white-50 mb-3" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
                          {layer.desc}
                        </p>

                        {/* Live KPI Metric Highlights */}
                        <div className="row g-2 mb-3">
                          {layer.stats.map((st) => (
                            <div key={st.label} className="col-4">
                              <div className="oc-spatial-kpi p-2 rounded-3 text-center">
                                <span className="d-block text-white-50" style={{ fontSize: "0.7rem" }}>
                                  {st.label}
                                </span>
                                <span className="fw-bold text-white" style={{ fontSize: "0.84rem" }}>
                                  {st.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Verified Capabilities */}
                        <div className="mt-auto">
                          <span className="text-white-50 small d-block mb-1 text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                            Verified Capabilities
                          </span>
                          <div className="d-flex flex-wrap gap-1 gap-md-2">
                            {layer.specs.map((spec) => (
                              <span key={spec} className="oc-spatial-pill-tag">
                                <i className="bi bi-check-circle-fill me-1" style={{ color: layer.accentColor }} />
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Glossy specular sheen */}
                      <div
                        className="oc-spatial-card-sheen"
                        style={{
                          background: `linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 60%)`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Bottom Counter Indicator */}
          <div className="text-center mt-2">
            <span className="text-white-50 small d-inline-flex align-items-center gap-2" style={{ fontSize: "0.82rem" }}>
              <i className="bi bi-arrows-expand me-1 text-cyan" />
              Tier <strong className="text-white">0{activeIndex + 1}</strong> of <strong className="text-white">04</strong> Active · {
                activeIndex < 3
                  ? "Scroll down or use arrows (← →) to explore next tier"
                  : "All 4 tiers complete · Continue scrolling down to enter Career Pathways ↓"
              }
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}
