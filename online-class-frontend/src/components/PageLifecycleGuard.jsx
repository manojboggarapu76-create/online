import { useCallback, useEffect, useRef } from "react";

export default function PageLifecycleGuard({ children }) {
  const sleepTimerRef = useRef(null);

  const setLifecycle = useCallback((sleeping) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    window.__OC_APP_SLEEPING__ = Boolean(sleeping);
    document.documentElement.dataset.ocLifecycle = sleeping ? "sleeping" : "active";

    if (sleeping) {
      document.querySelectorAll("video, audio").forEach((media) => {
        try { media.pause(); } catch {}
      });
      try { window.getSelection?.()?.removeAllRanges(); } catch {}
    }

    window.dispatchEvent(new CustomEvent("oc:app-lifecycle", {
      detail: { state: sleeping ? "sleeping" : "active" },
    }));
  }, []);

  const evaluateLifecycle = useCallback(() => {
    if (typeof document === "undefined") return;
    setLifecycle(document.visibilityState !== "visible" || !document.hasFocus());
  }, [setLifecycle]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    evaluateLifecycle();

    const handleVisibility = () => evaluateLifecycle();
    const handleFocus = () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
      evaluateLifecycle();
    };
    const handleBlur = () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = setTimeout(() => {
        sleepTimerRef.current = null;
        evaluateLifecycle();
      }, 50);
    };

    document.addEventListener("visibilitychange", handleVisibility, true);
    window.addEventListener("focus", handleFocus, true);
    window.addEventListener("blur", handleBlur, true);
    window.addEventListener("pageshow", evaluateLifecycle, true);
    window.addEventListener("pagehide", () => setLifecycle(true), true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility, true);
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      delete window.__OC_APP_SLEEPING__;
      delete document.documentElement.dataset.ocLifecycle;
    };
  }, [evaluateLifecycle, setLifecycle]);

  return children;
}
