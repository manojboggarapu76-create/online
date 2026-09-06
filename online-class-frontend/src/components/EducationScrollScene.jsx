import { useEffect, useRef, useState } from "react";

/**
 * EducationScrollScene
 * ------------------------------------------------------------------
 * A self-contained, education-themed 3D scroll animation.
 * A ring of academic icons (graduation cap, book, lightbulb, laptop,
 * calculator, award) orbits a glowing core in 3D space. The whole
 * scene tilts and spins as the user scrolls the section through the
 * viewport, driven purely by scroll position (no extra libraries).
 *
 * This component is additive — it does not modify any existing
 * component, route, or style. It only needs to be dropped into a
 * page inside a container that has "position-relative" ancestry,
 * which HomePage already provides.
 * ------------------------------------------------------------------
 */

const EDU_ORBIT_ITEMS = [
  { icon: "bi-mortarboard-fill", label: "Graduate", color: "#38bdf8" },
  { icon: "bi-book-half", label: "Study", color: "#a78bfa" },
  { icon: "bi-lightbulb-fill", label: "Ideas", color: "#fbbf24" },
  { icon: "bi-laptop", label: "Code", color: "#34d399" },
  { icon: "bi-calculator-fill", label: "Logic", color: "#fb923c" },
  { icon: "bi-award-fill", label: "Achieve", color: "#f472b6" },
];

export default function EducationScrollScene() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setProgress(0.5);
      return undefined;
    }

    let rafId = null;
    let lastProgress = -1;

    const computeProgress = () => {
      rafId = null;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewportHeight;
      const traveled = viewportHeight - rect.top;
      let p = total > 0 ? traveled / total : 0;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      // Avoid rendering for imperceptibly small scroll changes while keeping
      // the movement closely tied to the reader's position on the page.
      if (Math.abs(p - lastProgress) > 0.001) {
        lastProgress = p;
        setProgress(p);
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(computeProgress);
    };

    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const stageTiltX = (progress - 0.5) * -18;
  const stageTiltY = (progress - 0.5) * 30;
  const coreSpin = progress * 420;
  const sceneLift = Math.sin(progress * Math.PI) * 18;

  return (
    <section
      ref={sectionRef}
      className="oc-3d-edu-section position-relative overflow-hidden py-5 py-lg-6"
      aria-label="Interactive 3D learning showcase"
    >
      <div className="oc-3d-edu-glow oc-3d-edu-glow-a" />
      <div className="oc-3d-edu-glow oc-3d-edu-glow-b" />
      <div className="oc-hero-grid-pattern" />
      <div className="oc-3d-edu-stars" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="container position-relative">
        <div className="text-center mb-5">
          <span className="oc-section-eyebrow text-cyan">
            <i className="bi bi-stars me-1" /> Immersive Learning
          </span>
          <h2 className="oc-section-title text-white">Knowledge That Moves With You</h2>
          <p className="oc-3d-edu-subtitle mx-auto">
            Scroll through the page and watch core academic concepts orbit through your learning universe —
            a simple reminder that every subject here connects to the next.
          </p>
        </div>

        <div className="oc-3d-scene" role="presentation">
          <div className="oc-3d-scene-halo oc-3d-scene-halo-outer" />
          <div className="oc-3d-scene-halo oc-3d-scene-halo-inner" />
          <div
            className="oc-3d-scroll-meter"
            style={{ "--scroll-progress": progress }}
            aria-hidden="true"
          >
            <span />
          </div>
          <div
            className="oc-3d-stage"
            style={{ transform: `translateY(${-sceneLift}px) rotateX(${stageTiltX}deg) rotateY(${stageTiltY}deg)` }}
          >
            <div className="oc-3d-orbit oc-3d-orbit-one" />
            <div className="oc-3d-orbit oc-3d-orbit-two" />
            <div className="oc-3d-orbit oc-3d-orbit-three" />
            {EDU_ORBIT_ITEMS.map((item, idx) => {
              const baseAngle = (idx / EDU_ORBIT_ITEMS.length) * 360;
              const angle = baseAngle + progress * 420;
              const rad = (angle * Math.PI) / 180;
              const radius = 222;
              const x = Math.sin(rad) * radius;
              const z = Math.cos(rad) * radius;
              const depthRatio = (z + radius) / (radius * 2); // 0 (far) -> 1 (near)
              const scale = 0.72 + depthRatio * 0.5;
              const opacity = 0.32 + depthRatio * 0.68;
              const bob = Math.cos(rad * 2 + idx) * 16;

              return (
                <div
                  key={item.icon}
                  className="oc-3d-icon-card"
                  style={{
                    transform: `translate3d(${x}px, ${bob}px, ${z}px) rotateY(${-angle}deg) scale(${scale})`,
                    opacity,
                    borderColor: item.color,
                    boxShadow: `0 0 30px ${item.color}4d`,
                    zIndex: Math.round(z + radius),
                  }}
                >
                  <i className={`bi ${item.icon}`} style={{ color: item.color }} />
                  <span>{item.label}</span>
                </div>
              );
            })}

            <div
              className="oc-3d-center-core"
              style={{ transform: `translateZ(10px) rotateY(${coreSpin}deg)` }}
            >
              <span className="oc-3d-core-ring oc-3d-core-ring-a" />
              <span className="oc-3d-core-ring oc-3d-core-ring-b" />
              <i className="bi bi-mortarboard-fill" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
