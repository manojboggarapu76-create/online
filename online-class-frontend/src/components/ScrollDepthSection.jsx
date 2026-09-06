import { useEffect, useRef, useState } from "react";

/**
 * Adds a subtle, scroll-position-driven camera movement to an existing page
 * section. It deliberately owns only presentation: children, data, and click
 * behaviour remain exactly as supplied by the calling page.
 */
export default function ScrollDepthSection({
  as: Tag = "section",
  className = "",
  depth,
  fixedOverlaySafe = false,
  children,
}) {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    let frameId = null;
    let previousProgress = -1;

    const updateProgress = () => {
      frameId = null;
      const element = sectionRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const travelDistance = viewportHeight + rect.height;
      const nextProgress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / travelDistance));

      if (Math.abs(nextProgress - previousProgress) > 0.001) {
        previousProgress = nextProgress;
        setProgress(nextProgress);
      }
    };

    const requestUpdate = () => {
      if (frameId === null) frameId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  const centeredProgress = progress - 0.5;

  // Dashboard sections (depth="dashboard-*"), interactive pathways, and fixedOverlaySafe
  // sections must display perfectly flat and upright. Zeroing the tilt/yaw/rotate variables here
  // ensures the browser compositor never receives a non-zero 3D transform — preventing any slant
  // and ensuring mouse hit-testing and click handling are 100% accurate and responsive.
  const isFlat =
    (typeof depth === "string" && (depth.startsWith("dashboard-") || depth === "pathways")) ||
    Boolean(fixedOverlaySafe);

  const motionStyle = isFlat
    ? {
        "--oc-scroll-tilt": "0deg",
        "--oc-scroll-yaw": "0deg",
        "--oc-scroll-lift": "0px",
        "--oc-scroll-card-lift": "0px",
        "--oc-scroll-card-depth": "0px",
        "--oc-scroll-card-rotate": "0deg",
      }
    : {
        "--oc-scroll-tilt": `${centeredProgress * -12}deg`,
        "--oc-scroll-yaw": `${centeredProgress * 9}deg`,
        "--oc-scroll-lift": `${Math.sin(progress * Math.PI) * -18}px`,
        "--oc-scroll-card-lift": `${Math.sin(progress * Math.PI) * -10}px`,
        "--oc-scroll-card-depth": `${Math.sin(progress * Math.PI) * 34}px`,
        "--oc-scroll-card-rotate": `${centeredProgress * -4}deg`,
      };

  return (
    <Tag
      ref={sectionRef}
      className={`oc-scroll-depth-section ${className}`.trim()}
      data-depth={depth}
      data-fixed-overlay-safe={fixedOverlaySafe || undefined}
      style={motionStyle}
    >
      <div className="oc-scroll-depth-graphics" aria-hidden="true">
        <span className="oc-depth-orb oc-depth-orb-one" />
        <span className="oc-depth-orb oc-depth-orb-two" />
        <span className="oc-depth-grid" />
        <span className="oc-depth-shard oc-depth-shard-one" />
        <span className="oc-depth-shard oc-depth-shard-two" />
      </div>
      <div className="oc-scroll-depth-stage">{children}</div>
    </Tag>
  );
}
