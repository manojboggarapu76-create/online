import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/client";
import { useUserAuth } from "../context/UserAuthContext.jsx";

// Generates or retrieves a lightweight persistent session identifier for tracing
function getOrCreateSessionId() {
  let sid = sessionStorage.getItem("oc_sec_session_id");
  if (!sid) {
    sid = "SEC-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    sessionStorage.setItem("oc_sec_session_id", sid);
  }
  return sid;
}

export function useContentProtection({
  sectionKey = null,
  documentId = null,
  enabled = true,
} = {}) {
  const { user } = useUserAuth();
  const [isBlurred, setIsBlurred] = useState(false);
  const [protestInfo, setProtestInfo] = useState(null); // { title, reason, timestamp }
  const [securityToast, setSecurityToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const lastLogTimeRef = useRef({});

  const sessionId = getOrCreateSessionId();

  const showSecurityNotice = useCallback((message, type = "warning") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSecurityToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 4000);
  }, []);

  // Dispatch audit log with throttling per event type to prevent spam
  const logSecurityEvent = useCallback(
    (eventType, meta = {}) => {
      const now = Date.now();
      const last = lastLogTimeRef.current[eventType] || 0;
      if (now - last < 1500) return; // 1.5s throttle per event type
      lastLogTimeRef.current[eventType] = now;

      api
        .post("/security/log", {
          event_type: eventType,
          section_key: sectionKey,
          document_id: documentId,
          username: user?.name || "Guest Student",
          session_id: sessionId,
          meta: {
            ...meta,
            client_time: new Date().toISOString(),
            url: window.location.href,
          },
        })
        .catch(() => {
          // fail silently to avoid breaking user experience
        });
    },
    [sectionKey, documentId, user?.name, sessionId]
  );

  // Trigger security notice immediately without blurring screen
  const triggerProtestShield = useCallback((reasonTitle, reasonDetails) => {
    setIsBlurred(false);
    showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
    logSecurityEvent("screen_capture_blocked", {
      title: reasonTitle,
      reason: reasonDetails,
    });
  }, [logSecurityEvent, showSecurityNotice]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Initial document access log
    logSecurityEvent("document_access", { action: "open" });

    // 2. Prevent right-click / context menu (silently, except in inputs)
    const handleContextMenu = (e) => {
      const isInput = e.target && e.target.matches && e.target.matches("input, textarea, [contenteditable='true']");
      if (!isInput) {
        e.preventDefault();
        logSecurityEvent("right_click_attempt");
        return false;
      }
    };

    // 3. Prevent copy, cut, drag (silently, except in inputs)
    const handleCopy = (e) => {
      const isInput = e.target && e.target.matches && e.target.matches("input, textarea, [contenteditable='true']");
      if (!isInput) {
        e.preventDefault();
        logSecurityEvent("copy_attempt");
        return false;
      }
    };

    const handleCut = (e) => {
      const isInput = e.target && e.target.matches && e.target.matches("input, textarea, [contenteditable='true']");
      if (!isInput) {
        e.preventDefault();
        logSecurityEvent("copy_attempt", { action: "cut" });
        return false;
      }
    };

    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    const metaDownRef = { current: false };
    const shiftDownRef = { current: false };
    const lastWinShiftTimeRef = { current: 0 };

    // 4. Fast Keyboard shortcuts interception (Windows + Shift + S, PrtScn, Screen Record, etc.)
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key || "";
      const code = e.code || "";
      const keyCode = e.keyCode || 0;

      const isMeta = key === "Meta" || keyCode === 91 || keyCode === 92 || code.startsWith("Meta") || code.startsWith("OS");
      const isShift = key === "Shift" || keyCode === 16 || code.startsWith("Shift");

      if (isMeta) {
        metaDownRef.current = true;
      }
      if (isShift) {
        shiftDownRef.current = true;
      }
      if ((isMeta && (e.shiftKey || shiftDownRef.current)) || (isShift && (e.metaKey || metaDownRef.current))) {
        lastWinShiftTimeRef.current = Date.now();
      }

      // PRE-EMPTIVE Win + Shift + S DETECTION
      const isWinShiftCombo = (e.metaKey || metaDownRef.current) && (e.shiftKey || shiftDownRef.current);
      const isSKey = key === "s" || key === "S" || keyCode === 83 || code === "KeyS";

      if (
        (isWinShiftCombo && isSKey) ||
        (isSKey && (e.shiftKey || shiftDownRef.current) && (e.metaKey || e.ctrlKey || e.altKey))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
        }
        triggerProtestShield(
          "SCREENSHOT BLOCKED",
          "You cannot able to take screen short. Win+Shift+S (Snipping Tool) and screen capture shortcuts are prohibited."
        );
        showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
        return false;
      }

      // Print Screen detection (PrntScrn key on Windows/Linux)
      if (key === "PrintScreen" || keyCode === 44 || code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
        }
        triggerProtestShield(
          "SCREENSHOT BLOCKED",
          "You cannot able to take screen short. PrintScreen key is disabled on this platform."
        );
        showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
        return false;
      }

      // Windows Snipping Tool (Ctrl+Shift+S / Meta+Shift+S / Alt+Shift+S) and Mac screenshots (Cmd+Shift+3/4/5)
      const isShiftS = e.shiftKey && (key === "s" || key === "S" || keyCode === 83);
      const isMacScreenshot =
        (e.metaKey || e.ctrlKey) && e.shiftKey && ["3", "4", "5"].includes(key);

      if ((isShiftS && (e.ctrlKey || e.metaKey || e.altKey)) || isMacScreenshot) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
        }
        triggerProtestShield(
          "SCREENSHOT BLOCKED",
          "You cannot able to take screen short. Ctrl+Shift+S, Win+Shift+S, and all snipping tool shortcuts are prohibited under platform security policies. This attempt has been logged."
        );
        showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
        return false;
      }

      // Screen Recording shortcuts (Win + G, Win + Alt + R)
      const isWinOrMetaKey = e.metaKey || metaDownRef.current;
      const isGameBarRecording = isWinOrMetaKey && ((key === "g" || key === "G") || (e.altKey && (key === "r" || key === "R")));
      if (isGameBarRecording) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtestShield(
          "SCREEN RECORDING PROHIBITED",
          "Video recording shortcut detected. Recording educational video streams or lecture slides is strictly prohibited."
        );
        return false;
      }

      // Ctrl + P (Print) — silently blocked
      if (isCtrlOrCmd && (key === "p" || key === "P")) {
        e.preventDefault();
        logSecurityEvent("print_attempt");
        return false;
      }

      // Ctrl + S (Save Page / Save File) — silently blocked
      if (isCtrlOrCmd && (key === "s" || key === "S") && !e.shiftKey) {
        e.preventDefault();
        logSecurityEvent("download_attempt");
        return false;
      }

      // Ctrl + C / Ctrl + X / Ctrl + U (View Source) — silently blocked
      if (isCtrlOrCmd && ["c", "C", "x", "X", "u", "U"].includes(key)) {
        e.preventDefault();
        logSecurityEvent("copy_attempt", { shortcut: key });
        return false;
      }

      // DevTools (F12 or Ctrl + Shift + I / J / C)
      if (key === "F12" || (isCtrlOrCmd && e.shiftKey && ["i", "I", "j", "J", "c", "C"].includes(key))) {
        logSecurityEvent("devtools_attempt");
      }
    };

    // 5. Window Blur & Visibility tracking
    // FIXED: Do NOT show security toast on normal window blur/focus events (these fire on
    // SPA page navigation, card clicks, form focus, iframe load, video interactions, etc.)
    // Only silently overwrite clipboard on actual window blur — no visible toast.
    const handleWindowBlur = () => {
      const isMediaActive = () => {
        try {
          if (document.fullscreenElement) return true;
          const mediaEls = document.querySelectorAll("video, audio");
          if (mediaEls.length > 0) return true;
          if (
            document.querySelector(
              ".oc-active-video-container, .oc-doc-viewer-modal, .oc-video-card, iframe[src*='youtube'], iframe[src*='vimeo'], iframe[src*='drive.google']"
            )
          ) {
            return true;
          }
          if (
            document.activeElement &&
            (document.activeElement.tagName === "IFRAME" ||
              document.activeElement.tagName === "VIDEO" ||
              document.activeElement.tagName === "AUDIO" ||
              document.activeElement.closest?.(
                ".oc-active-video-container, .oc-doc-viewer-modal, .oc-index-card, .oc-video-card"
              ))
          ) {
            return true;
          }
        } catch {}
        return false;
      };

      if (isMediaActive()) {
        metaDownRef.current = false;
        shiftDownRef.current = false;
        return;
      }

      const now = Date.now();
      const recentWinShift =
        metaDownRef.current && shiftDownRef.current && (now - lastWinShiftTimeRef.current < 1500);

      metaDownRef.current = false;
      shiftDownRef.current = false;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
      }

      if (recentWinShift) {
        triggerProtestShield(
          "SCREENSHOT BLOCKED",
          "You cannot able to take screen short. Snipping Tool shortcut (Win+Shift+S) was detected and blocked."
        );
        showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
      }
    };

    const handleWindowFocus = () => {
      // Reset modifier key state on focus return as well
      metaDownRef.current = false;
      shiftDownRef.current = false;
      // Silently overwrite clipboard — no toast shown
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      // Silently overwrite clipboard — no toast shown on tab visibility change
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short.").catch(() => {});
      }
    };

    // handleKeyUp: Handles PrintScreen and resets modifier tracking
    const handleKeyUp = (e) => {
      const key = e.key || "";
      const code = e.code || "";
      const keyCode = e.keyCode || 0;

      if (key === "Meta" || keyCode === 91 || keyCode === 92 || code.startsWith("Meta") || code.startsWith("OS")) {
        metaDownRef.current = false;
      }
      if (key === "Shift" || keyCode === 16 || code.startsWith("Shift")) {
        shiftDownRef.current = false;
      }

      if (key === "PrintScreen" || keyCode === 44 || code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText("🚫 [SECURITY NOTICE]: You cannot able to take screen short. DRM protection is active.")
            .catch(() => {});
        }
        triggerProtestShield(
          "SCREENSHOT BLOCKED",
          "You cannot able to take screen short. The PrintScreen key is disabled. This attempt has been logged."
        );
        showSecurityNotice("🚫 You cannot able to take screen short.", "danger");
      }
    };

    // Attach listeners with capture: true for instant zero-delay interception
    const listenerOptions = { capture: true, passive: false };
    window.addEventListener("contextmenu", handleContextMenu, listenerOptions);
    window.addEventListener("copy", handleCopy, listenerOptions);
    window.addEventListener("cut", handleCut, listenerOptions);
    window.addEventListener("dragstart", handleDragStart, listenerOptions);
    window.addEventListener("keydown", handleKeyDown, listenerOptions);
    window.addEventListener("keyup", handleKeyUp, listenerOptions);
    // NOTE: Only 'blur' (whole window loses focus) — NOT 'focusout' (fires on every card click/navigation)
    window.addEventListener("blur", handleWindowBlur, true);
    window.addEventListener("focus", handleWindowFocus, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, listenerOptions);
      window.removeEventListener("copy", handleCopy, listenerOptions);
      window.removeEventListener("cut", handleCut, listenerOptions);
      window.removeEventListener("dragstart", handleDragStart, listenerOptions);
      window.removeEventListener("keydown", handleKeyDown, listenerOptions);
      window.removeEventListener("keyup", handleKeyUp, listenerOptions);
      window.removeEventListener("blur", handleWindowBlur, true);
      window.removeEventListener("focus", handleWindowFocus, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [enabled, logSecurityEvent, showSecurityNotice, triggerProtestShield]);

  const resumeViewing = useCallback(() => {
    setIsBlurred(false);
    setProtestInfo(null);
    showSecurityNotice("Session validated. Document viewing resumed.", "info");
  }, [showSecurityNotice]);

  return {
    isBlurred,
    protestInfo,
    resumeViewing,
    securityToast,
    sessionId,
    user,
  };
}
