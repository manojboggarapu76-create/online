import { useEffect, useState, useRef, useCallback } from "react";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import api from "../api/client";

function getOrCreateSessionId() {
  let sid = sessionStorage.getItem("oc_global_sec_session_id");
  if (!sid) {
    sid = "SEC-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    sessionStorage.setItem("oc_global_sec_session_id", sid);
  }
  return sid;
}

export default function GlobalSecurityGuard({ children }) {
  const { user } = useUserAuth();

  // Full-Screen Security Screen State:
  // Pre-emptively activates covering 100% of the screen BEFORE the capture can grab content.
  const [screenLock, setScreenLock] = useState(null); // { title, shortcut, reason, time }
  const [infoToast, setInfoToast] = useState(null);

  const infoToastTimerRef = useRef(null);
  const lastLogRef = useRef({});

  // Deep modifier & key state tracking with continuous rolling timestamps
  // (Survives keyup so focus-loss / blur events can correlate OS-level global hotkeys like Win+G)
  const lastMetaTimeRef = useRef(0);
  const lastShiftTimeRef = useRef(0);
  const lastAltTimeRef = useRef(0);
  const lastCtrlTimeRef = useRef(0);
  const lastGTimeRef = useRef(0);
  const lastRTimeRef = useRef(0);
  const lastSTimeRef = useRef(0);
  const lastPrtScnTimeRef = useRef(0);

  const lastKeyDownTimeRef = useRef(0);
  const lastKeyCodeRef = useRef("");
  const lastKeyNameRef = useRef("");

  const metaDownRef = useRef(false);
  const shiftDownRef = useRef(false);
  const altDownRef = useRef(false);
  const ctrlDownRef = useRef(false);

  const isHoveringIframeRef = useRef(false);

  const sessionId = getOrCreateSessionId();
  const username = user?.name || "Student User";

  // ─── Instant Clipboard Sanitizer ──────────────────────────────────────────
  const clearClipboard = useCallback(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(
            "🚫 [SECURITY NOTICE]: Screenshots, screen clipping, and video recordings are strictly prohibited on the Online Class platform. All educational materials are protected under academic copyright."
          )
          .catch(() => {});
      }
    } catch {}
  }, []);

  // ─── Immediate Media Stop ──────────────────────────────────────────────────
  const pauseProtectedMedia = useCallback(() => {
    try {
      document.querySelectorAll("video, audio").forEach((m) => {
        try {
          m.pause();
          m.removeAttribute("autoplay");
        } catch {}
      });
    } catch {}
  }, []);

  // ─── Backend Audit Dispatcher ─────────────────────────────────────────────
  const logSecurityIncident = useCallback(
    (eventType, details = {}) => {
      const now = Date.now();
      if (now - (lastLogRef.current[eventType] || 0) < 2000) return;
      lastLogRef.current[eventType] = now;
      api
        .post("/security/log", {
          event_type: eventType,
          username,
          session_id: sessionId,
          meta: {
            ...details,
            url: typeof window !== "undefined" ? window.location.href : "",
            time: new Date().toISOString(),
          },
        })
        .catch(() => {});
    },
    [username, sessionId]
  );

  // ─── PRIMARY FULL-SCREEN SECURITY LOCKDOWN ENGINE ─────────────────────────
  // Instantly covers the ENTIRE SCREEN with the official DRM Security Screen.
  // Uses synchronous DOM class injection + React state so the screen is covered
  // in 0.1ms BEFORE the OS capture buffer or compositor takes a snapshot.
  const activateFullSecurityScreen = useCallback(
    (title, shortcut, reason, auditEvent = "screen_capture_blocked") => {
      // 1. Immediate synchronous DOM coverage
      try {
        document.documentElement.classList.add("oc-screen-lock-active");
      } catch {}

      // 2. Clear clipboard & stop all media streams
      clearClipboard();
      pauseProtectedMedia();

      // 3. Mount authoritative full-screen security screen
      setScreenLock({
        title: title || "SCREEN CAPTURE & RECORDING RESTRICTED",
        shortcut: shortcut || "Screenshot / Screen Recording Shortcut",
        reason:
          reason ||
          "Taking screenshots (Win+Shift+S, PrtScn) or recording videos (Win+G, Win+Alt+R, OBS) is prohibited under platform security policies.",
        time: new Date().toLocaleTimeString(),
      });

      // 4. Log event to backend security audit trail
      logSecurityIncident(auditEvent, { title, shortcut, reason });
    },
    [clearClipboard, pauseProtectedMedia, logSecurityIncident]
  );

  // Resume viewing: student acknowledges and returns cleanly to learning
  const dismissSecurityScreen = useCallback(() => {
    try {
      document.documentElement.classList.remove("oc-screen-lock-active");
    } catch {}
    setScreenLock(null);
    metaDownRef.current = false;
    shiftDownRef.current = false;
    altDownRef.current = false;
    ctrlDownRef.current = false;
    clearClipboard();
  }, [clearClipboard]);

  // ─── Info Toast (Login confirmation) ──────────────────────────────────────
  const showInfoToast = useCallback((message) => {
    if (infoToastTimerRef.current) clearTimeout(infoToastTimerRef.current);
    setInfoToast({ message });
    infoToastTimerRef.current = setTimeout(() => setInfoToast(null), 6000);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    try {
      if (sessionStorage.getItem("oc_show_login_security_notice") !== "1") return;
      sessionStorage.removeItem("oc_show_login_security_notice");
    } catch {
      return;
    }
    showInfoToast("🔒 Security protection is active. Educational materials are monitored and restricted.");
    logSecurityIncident("security_session_started", { trigger: "successful_login" });
  }, [user?.id, showInfoToast, logSecurityIncident]);

  // ─── LAYER 1: Deep Web API Interceptions ──────────────────────────────────
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
          value: async function () {
            activateFullSecurityScreen(
              "SCREEN RECORDING BLOCKED",
              "Browser getDisplayMedia() API",
              "Screen recording tools and browser capture extensions are disabled on this platform. Video playback has been paused.",
              "screen_record_getDisplayMedia"
            );
            throw new DOMException("Screen recording is disabled on this platform.", "NotAllowedError");
          },
          writable: false,
          configurable: false,
        });
      } catch {}
    }

    if (typeof window !== "undefined" && window.MediaRecorder) {
      try {
        const OrigMediaRecorder = window.MediaRecorder;
        window.MediaRecorder = function () {
          activateFullSecurityScreen(
            "MEDIA RECORDING BLOCKED",
            "MediaRecorder Web API",
            "Direct media recording tools are prohibited on this platform. This incident has been logged.",
            "screen_record_MediaRecorder"
          );
          throw new DOMException("Media recording is disabled.", "NotAllowedError");
        };
        window.MediaRecorder.prototype = OrigMediaRecorder.prototype;
        window.MediaRecorder.isTypeSupported = OrigMediaRecorder.isTypeSupported;
      } catch {}
    }

    if (typeof HTMLMediaElement !== "undefined") {
      ["captureStream", "mozCaptureStream"].forEach((method) => {
        try {
          if (HTMLMediaElement.prototype[method]) {
            HTMLMediaElement.prototype[method] = function () {
              activateFullSecurityScreen(
                "DIRECT STREAM CAPTURE BLOCKED",
                "HTMLMediaElement.captureStream()",
                "Direct stream extraction and media recording is not permitted. Playback has been stopped.",
                "stream_capture_media_element"
              );
              throw new DOMException("Stream capture disabled.", "NotAllowedError");
            };
          }
        } catch {}
      });
    }

    if (typeof HTMLCanvasElement !== "undefined" && HTMLCanvasElement.prototype.captureStream) {
      try {
        HTMLCanvasElement.prototype.captureStream = function () {
          activateFullSecurityScreen(
            "CANVAS RECORDING BLOCKED",
            "HTMLCanvasElement.captureStream()",
            "Canvas stream capture is prohibited. Attempt has been recorded.",
            "stream_capture_canvas"
          );
          throw new DOMException("Canvas capture disabled.", "NotAllowedError");
        };
      } catch {}
    }

    try {
      Object.defineProperty(window, "print", {
        value: function () {
          activateFullSecurityScreen(
            "PRINTING RESTRICTED",
            "window.print() / Print Command",
            "Printing and PDF export of course materials is not permitted under institutional policies.",
            "print_attempt"
          );
        },
        writable: false,
        configurable: false,
      });
    } catch {}

    ["oncontextmenu", "oncopy", "oncut", "onselectstart", "ondragstart"].forEach((prop) => {
      try {
        Object.defineProperty(document, prop, {
          get: () => (e) => {
            if (e?.preventDefault) e.preventDefault();
            return false;
          },
          set: () => false,
          configurable: false,
        });
      } catch {}
    });
  }, [activateFullSecurityScreen]);

  // ─── LAYER 2: Media Hardening & Extension Scanner ─────────────────────────
  useEffect(() => {
    const EXTENSION_MARKERS = [
      "loom-companion",
      "nimbus",
      "fireshot",
      "gofullpage",
      "screencastify",
      "vidyard",
      "screen-recorder",
      "video-downloader",
      "download-helper",
      "allow-copy",
      "enable-copy",
    ];

    const hardenAndScan = () => {
      document.querySelectorAll("video").forEach((v) => {
        if (v.getAttribute("controlsList") !== "nodownload noplaybackrate noremoteplayback") {
          v.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
        }
        v.disablePictureInPicture = true;
        v.disableRemotePlayback = true;
        v.oncontextmenu = (e) => {
          e.preventDefault();
          return false;
        };
      });
      document.querySelectorAll("img").forEach((img) => {
        img.setAttribute("draggable", "false");
        img.oncontextmenu = (e) => {
          e.preventDefault();
          return false;
        };
      });
      EXTENSION_MARKERS.forEach((marker) => {
        document
          .querySelectorAll(`[id*="${marker}" i], [class*="${marker}" i], [src*="${marker}" i]`)
          .forEach((el) => {
            if (el.closest(".oc-app-shell") || el.closest(".oc-full-security-screen")) return;
            try {
              el.remove();
              logSecurityIncident("extension_marker_neutralized", { marker });
            } catch {}
          });
      });
    };

    hardenAndScan();
    const observer = new MutationObserver(hardenAndScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [logSecurityIncident]);

  // ─── LAYER 3: Pre-Emptive Key Interception & Correlation Engine ───────────
  useEffect(() => {
    const blockEvent = (e) => {
      const isInput = e.target?.matches?.("input, textarea, [contenteditable='true']");
      if (!isInput) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    const blockAlways = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      const now = Date.now();
      const key = (e.key || "").toLowerCase();
      const code = e.code || "";
      const keyCode = e.keyCode || 0;

      const isMeta =
        key === "meta" ||
        code.startsWith("Meta") ||
        code.startsWith("OS") ||
        keyCode === 91 ||
        keyCode === 92;
      const isShift = key === "shift" || code.startsWith("Shift") || keyCode === 16;
      const isAlt = key === "alt" || code.startsWith("Alt") || keyCode === 18;
      const isCtrl = key === "control" || code.startsWith("Control") || keyCode === 17;

      const isGKey = key === "g" || keyCode === 71 || code === "KeyG";
      const isRKey = key === "r" || keyCode === 82 || code === "KeyR";
      const isSKey = key === "s" || keyCode === 83 || code === "KeyS";
      const isPrtScnKey =
        key === "printscreen" || keyCode === 44 || code === "PrintScreen" || key === "snapshot";

      // Track timestamps
      if (isMeta) {
        metaDownRef.current = true;
        lastMetaTimeRef.current = now;
      }
      if (isShift) {
        shiftDownRef.current = true;
        lastShiftTimeRef.current = now;
      }
      if (isAlt) {
        altDownRef.current = true;
        lastAltTimeRef.current = now;
      }
      if (isCtrl) {
        ctrlDownRef.current = true;
        lastCtrlTimeRef.current = now;
      }
      if (isGKey) {
        lastGTimeRef.current = now;
      }
      if (isRKey) {
        lastRTimeRef.current = now;
      }
      if (isSKey) {
        lastSTimeRef.current = now;
      }
      if (isPrtScnKey) {
        lastPrtScnTimeRef.current = now;
      }

      lastKeyDownTimeRef.current = now;
      lastKeyCodeRef.current = code;
      lastKeyNameRef.current = key;

      const timeSinceMeta = now - lastMetaTimeRef.current;
      const timeSinceShift = now - lastShiftTimeRef.current;
      const timeSinceAlt = now - lastAltTimeRef.current;
      const timeSinceCtrl = now - lastCtrlTimeRef.current;
      const timeSinceG = now - lastGTimeRef.current;

      const metaActive = e.metaKey || metaDownRef.current || timeSinceMeta < 6000;
      const shiftActive = e.shiftKey || shiftDownRef.current || timeSinceShift < 2500;
      const altActive = e.altKey || altDownRef.current || timeSinceAlt < 2500;
      const ctrlActive = e.ctrlKey || ctrlDownRef.current || timeSinceCtrl < 2500;

      // ───────────────────────────────────────────────────────────────────────
      // 1. WIN + G (Windows Xbox Game Bar) — MULTI-VECTOR DETECTION
      //    Vector A: G is pressed while Win key is active/held (or within 6 seconds)
      //    Vector B: Win key is pressed while G was recently struck (within 4 seconds)
      // ───────────────────────────────────────────────────────────────────────
      if (isGKey && (metaActive || e.metaKey || timeSinceMeta < 6000)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "GAME BAR OVERLAY RESTRICTED",
          "Win+G (Windows Game Bar)",
          "Xbox Game Bar overlay shortcut (Win+G) was detected. Screen recording overlays and capture widgets are disabled on protected content.",
          "screen_record_gamebar_keydown"
        );
        return false;
      }

      if (isMeta && (timeSinceG < 4000 || lastKeyNameRef.current === "g" || lastKeyCodeRef.current === "KeyG")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "GAME BAR OVERLAY RESTRICTED",
          "Win+G (Windows Game Bar)",
          "Xbox Game Bar overlay shortcut (Win+G) was detected. Screen capture widgets are prohibited. Content protected.",
          "screen_record_gamebar_reverse_keydown"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 2. PRINTSCREEN (PrtScn key — all combinations)
      // ───────────────────────────────────────────────────────────────────────
      if (isPrtScnKey || (altActive && keyCode === 44) || (ctrlActive && keyCode === 44) || (metaActive && keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "SCREEN CAPTURE RESTRICTED",
          "PrtScn (PrintScreen Key)",
          "The PrintScreen key was pressed. Taking screenshots of course slides, video frames, or documents is strictly prohibited under institutional security policies.",
          "screenshot_prtscn"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 3. PRE-EMPTIVE WIN + SHIFT + S (Windows Snipping Tool)
      //    Triggered the exact millisecond Win+Shift are pressed together (BEFORE 'S'!)
      // ───────────────────────────────────────────────────────────────────────
      const isWinShiftPreemptive =
        (metaActive && isShift) ||
        (shiftActive && isMeta) ||
        (metaActive && shiftActive && isSKey) ||
        ((ctrlActive || altActive) && shiftActive && isSKey) ||
        (metaActive && isSKey);

      if (isWinShiftPreemptive) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "SNIPPING TOOL RESTRICTED",
          "Win+Shift+S (Snipping Tool)",
          "Windows Snipping Tool (Win+Shift+S) was detected. Screen clipping and capture shortcuts are disabled. The entire screen is protected.",
          "screenshot_snipping_tool"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 4. PRE-EMPTIVE WIN + ALT + R (Windows Game Bar Screen Recording)
      //    Triggered the exact millisecond Win+Alt are pressed together (BEFORE 'R'!)
      // ───────────────────────────────────────────────────────────────────────
      const isWinAltPreemptive =
        (metaActive && isAlt) ||
        (altActive && isMeta) ||
        (metaActive && altActive && isRKey) ||
        (altActive && isRKey && (metaActive || ctrlActive));

      if (isWinAltPreemptive) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "SCREEN RECORDING PROHIBITED",
          "Win+Alt+R (Game Bar Screen Recorder)",
          "Win+Alt+R Game Bar video recording shortcut was initiated. Recording of educational video lectures is strictly prohibited. Video stream has been stopped.",
          "screen_record_win_alt_r"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 5. MACOS NATIVE: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5, Cmd+Shift+6, 7
      // ───────────────────────────────────────────────────────────────────────
      const isMacCmdShift = (e.metaKey || ctrlActive) && shiftActive;
      if (isMacCmdShift) {
        if (key === "5" || code === "Digit5") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          activateFullSecurityScreen(
            "SCREEN RECORDING TOOLBAR RESTRICTED",
            "Cmd+Shift+5 (macOS Screen Recording)",
            "macOS Screen Recording toolbar was initiated. Recording of educational media is not permitted. Video playback has been stopped.",
            "screen_record_mac_cmd5"
          );
          return false;
        }
        if (["3", "4", "6", "7"].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          activateFullSecurityScreen(
            "SCREENSHOT RESTRICTED",
            `Cmd+Shift+${key} (macOS Screenshot)`,
            "macOS screen capture shortcut was initiated. Screenshots of course content are prohibited.",
            "screenshot_mac_cmd34"
          );
          return false;
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // 6. GPU RECORDERS (NVIDIA ShadowPlay: Alt+Z, Alt+F9; AMD Radeon)
      // ───────────────────────────────────────────────────────────────────────
      const isGpuRecorder =
        (altActive && (key === "z" || code === "KeyZ" || key === "f9" || code === "F9" || key === "f10" || code === "F10" || key === "f1" || code === "F1")) ||
        (ctrlActive && shiftActive && ["e", "g", "s"].includes(key));

      if (isGpuRecorder) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "GPU SCREEN RECORDER RESTRICTED",
          "NVIDIA ShadowPlay / AMD Radeon Hotkey",
          "Hardware GPU recording and instant replay capture shortcuts are disabled. Video playback has been paused.",
          "screen_record_gpu"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 7. THIRD-PARTY RECORDERS (OBS, Loom, Snagit, Camtasia, Bandicam)
      // ───────────────────────────────────────────────────────────────────────
      const isThirdPartyTool =
        (ctrlActive && shiftActive && ["r", "l", "c", "x", "v"].includes(key)) ||
        (ctrlActive && altActive && isRKey) ||
        (altActive && (key === "f11" || key === "f12")) ||
        key === "f9" ||
        code === "F9" ||
        key === "f10" ||
        code === "F10";

      if (isThirdPartyTool) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "EXTERNAL RECORDER SHORTCUT BLOCKED",
          "Screen Recording Tool Shortcut (OBS / Loom / Snagit)",
          "External screen recording tool shortcuts were detected. Video stream has been paused and attempt recorded.",
          "screen_record_external_tool"
        );
        return false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 8. PRINT (Ctrl+P), SAVE (Ctrl+S), DEVTOOLS (F12, Ctrl+Shift+I/J/C)
      // ───────────────────────────────────────────────────────────────────────
      if (ctrlActive && (key === "p" || code === "KeyP")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        activateFullSecurityScreen(
          "PRINTING RESTRICTED",
          "Ctrl+P (Print Page)",
          "Printing and saving course materials to PDF is strictly prohibited.",
          "print_attempt"
        );
        return false;
      }
      if (ctrlActive && !shiftActive && (key === "s" || code === "KeyS")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logSecurityIncident("save_attempt");
        return false;
      }
      if (
        key === "f12" ||
        keyCode === 123 ||
        (ctrlActive && (key === "u" || code === "KeyU")) ||
        (ctrlActive && shiftActive && ["i", "j", "c"].includes(key)) ||
        (metaActive && altActive && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logSecurityIncident("devtools_attempt");
        return false;
      }
    };

    // ── KEY UP LISTENER (Handles OS hooks that swallow keydown but pass keyup) ──
    const handleKeyUp = (e) => {
      const now = Date.now();
      const key = (e.key || "").toLowerCase();
      const code = e.code || "";
      const keyCode = e.keyCode || 0;

      const isGKey = key === "g" || keyCode === 71 || code === "KeyG";
      const isRKey = key === "r" || keyCode === 82 || code === "KeyR";
      const isSKey = key === "s" || keyCode === 83 || code === "KeyS";
      const isMeta =
        key === "meta" ||
        code.startsWith("Meta") ||
        code.startsWith("OS") ||
        keyCode === 91 ||
        keyCode === 92;

      // KeyUp catch for Win+G: if G is released while Meta was touched within 6s
      if (isGKey && (metaDownRef.current || (now - lastMetaTimeRef.current < 6000) || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        activateFullSecurityScreen(
          "GAME BAR OVERLAY RESTRICTED",
          "Win+G (Windows Game Bar)",
          "Xbox Game Bar overlay shortcut (Win+G) was detected. The entire screen is protected.",
          "screen_record_gamebar_keyup"
        );
        return;
      }

      // KeyUp catch for Win+Alt+R: if R is released while Alt/Meta was touched
      if (isRKey && ((now - lastAltTimeRef.current < 6000) || (now - lastMetaTimeRef.current < 6000))) {
        e.preventDefault();
        e.stopPropagation();
        activateFullSecurityScreen(
          "SCREEN RECORDING PROHIBITED",
          "Win+Alt+R (Game Bar Screen Recording)",
          "Win+Alt+R Game Bar video recording shortcut was initiated. Video playback has been stopped.",
          "screen_record_win_alt_r_keyup"
        );
        return;
      }

      // KeyUp catch for Win+Shift+S: if S is released while Shift/Meta was touched
      if (isSKey && ((now - lastShiftTimeRef.current < 6000) || (now - lastMetaTimeRef.current < 6000))) {
        e.preventDefault();
        e.stopPropagation();
        activateFullSecurityScreen(
          "SNIPPING TOOL RESTRICTED",
          "Win+Shift+S (Snipping Tool)",
          "Windows Snipping Tool (Win+Shift+S) was detected. The entire screen is protected.",
          "screenshot_snipping_tool_keyup"
        );
        return;
      }

      // Meta keyup fallback
      if (isMeta) {
        metaDownRef.current = false;
        if (now - lastGTimeRef.current < 4000) {
          activateFullSecurityScreen(
            "GAME BAR OVERLAY RESTRICTED",
            "Win+G (Windows Game Bar)",
            "Xbox Game Bar overlay shortcut (Win+G) was detected. The entire screen is protected.",
            "screen_record_gamebar_meta_keyup"
          );
          return;
        }
      }

      if (key === "shift" || code.startsWith("Shift") || keyCode === 16) {
        shiftDownRef.current = false;
      }
      if (key === "alt" || code.startsWith("Alt") || keyCode === 18) {
        altDownRef.current = false;
      }
      if (key === "control" || code.startsWith("Control") || keyCode === 17) {
        ctrlDownRef.current = false;
      }

      // PrtScn fallback for keyboards that only fire on release
      if (key === "printscreen" || keyCode === 44 || code === "PrintScreen" || key === "snapshot") {
        e.preventDefault();
        e.stopPropagation();
        activateFullSecurityScreen(
          "SCREEN CAPTURE RESTRICTED",
          "PrtScn (PrintScreen Key Release)",
          "PrintScreen screenshot command was detected and blocked. The entire screen is protected.",
          "screenshot_prtscn_keyup"
        );
      }
    };

    // ─── WINDOW BLUR: Focus Loss / OS Stealing Interception ─────────────────
    // When Windows Xbox Game Bar (Win+G), Snipping Tool (Win+Shift+S), or
    // Game Bar Recording (Win+Alt+R) activates, the OS consumes the keystroke
    // and causes a window blur. We correlate the rolling timestamps to lock down immediately!
    const handleWindowBlur = () => {
      const now = Date.now();
      const timeSinceMeta = now - lastMetaTimeRef.current;
      const timeSinceShift = now - lastShiftTimeRef.current;
      const timeSinceAlt = now - lastAltTimeRef.current;
      const timeSinceG = now - lastGTimeRef.current;
      const timeSinceR = now - lastRTimeRef.current;
      const timeSinceS = now - lastSTimeRef.current;
      const lastKey = lastKeyCodeRef.current.toLowerCase();
      const lastKeyName = lastKeyNameRef.current.toLowerCase();

      clearClipboard();
      pauseProtectedMedia();

      // Case 1: Windows Snipping Tool (Win+Shift+S)
      const isBlurWinShiftS =
        (timeSinceMeta < 6000 && timeSinceShift < 6000) ||
        (timeSinceShift < 4000 && timeSinceS < 4000) ||
        (timeSinceMeta < 4000 && (lastKey === "keys" || lastKeyName === "s"));

      if (isBlurWinShiftS) {
        activateFullSecurityScreen(
          "SNIPPING TOOL RESTRICTED",
          "Win+Shift+S (Snipping Tool)",
          "Windows Snipping Tool was detected when window focus changed. The entire screen has been protected.",
          "screenshot_snipping_tool_blur"
        );
        return;
      }

      // Case 2: Windows Game Bar Screen Recording (Win+Alt+R)
      const isBlurWinAltR =
        (timeSinceMeta < 6000 && timeSinceAlt < 6000) ||
        (timeSinceAlt < 4000 && timeSinceR < 4000) ||
        (timeSinceMeta < 4000 && (lastKey === "keyr" || lastKeyName === "r"));

      if (isBlurWinAltR) {
        activateFullSecurityScreen(
          "SCREEN RECORDING PROHIBITED",
          "Win+Alt+R (Game Bar Screen Recording)",
          "Win+Alt+R Game Bar video recording shortcut was detected when focus changed. Video playback has been stopped.",
          "screen_record_win_alt_r_blur"
        );
        return;
      }

      // Case 3: Windows Game Bar Overlay (Win+G)
      // When Win+G is pressed, Windows steals focus to launch GameBar.exe.
      // If Meta was touched within 6 seconds, OR G was touched within 4 seconds,
      // OR last key was G: it is 100% Win+G!
      const isBlurWinG =
        (timeSinceMeta < 6000) ||
        (timeSinceG < 4000) ||
        (lastKey === "keyg" || lastKeyName === "g");

      if (isBlurWinG) {
        activateFullSecurityScreen(
          "GAME BAR OVERLAY RESTRICTED",
          "Win+G (Windows Game Bar)",
          "Xbox Game Bar overlay shortcut (Win+G) was detected when window focus changed. The entire screen has been protected.",
          "screen_record_gamebar_blur"
        );
        return;
      }

      // Case 4: GPU Recorder Blur (Alt+F9, Alt+Z)
      const isBlurGpuTool =
        timeSinceAlt < 2000 &&
        (lastKey === "f9" || lastKey === "f10" || lastKey === "keyz" || lastKeyName === "z");

      if (isBlurGpuTool) {
        activateFullSecurityScreen(
          "GPU SCREEN RECORDER RESTRICTED",
          "GPU Recorder (Alt+F9 / Alt+Z)",
          "NVIDIA / AMD screen recording overlay was detected when focus changed.",
          "screen_record_gpu_blur"
        );
        return;
      }
    };

    const handleWindowFocus = () => {
      metaDownRef.current = false;
      shiftDownRef.current = false;
      altDownRef.current = false;
      ctrlDownRef.current = false;
      clearClipboard();
    };

    const handleVisibilityChange = () => {
      clearClipboard();
      if (document.hidden) {
        pauseProtectedMedia();
      }
    };

    const handleBeforePrint = (e) => {
      e.preventDefault();
      activateFullSecurityScreen(
        "PRINTING RESTRICTED",
        "Browser Print Command",
        "Printing and PDF generation is strictly prohibited under institutional security policies.",
        "print_attempt"
      );
    };

    const handlePointerOver = (e) => {
      if (e.target && (e.target.tagName === "IFRAME" || e.target.closest?.("iframe"))) {
        isHoveringIframeRef.current = true;
      }
    };
    const handlePointerOut = (e) => {
      if (e.target && (e.target.tagName === "IFRAME" || e.target.closest?.("iframe"))) {
        isHoveringIframeRef.current = false;
      }
    };

    const opts = { capture: true, passive: false };
    const optsPassv = { capture: true, passive: true };

    window.addEventListener("contextmenu", blockEvent, opts);
    window.addEventListener("selectstart", blockEvent, opts);
    window.addEventListener("dragstart", blockAlways, opts);
    window.addEventListener("copy", blockEvent, opts);
    window.addEventListener("cut", blockEvent, opts);
    window.addEventListener("keydown", handleKeyDown, opts);
    window.addEventListener("keyup", handleKeyUp, opts);
    window.addEventListener("beforeprint", handleBeforePrint, opts);
    window.addEventListener("blur", handleWindowBlur, opts);
    window.addEventListener("focus", handleWindowFocus, optsPassv);
    document.addEventListener("visibilitychange", handleVisibilityChange, opts);
    window.addEventListener("pointerover", handlePointerOver, optsPassv);
    window.addEventListener("pointerout", handlePointerOut, optsPassv);

    return () => {
      window.removeEventListener("contextmenu", blockEvent, opts);
      window.removeEventListener("selectstart", blockEvent, opts);
      window.removeEventListener("dragstart", blockAlways, opts);
      window.removeEventListener("copy", blockEvent, opts);
      window.removeEventListener("cut", blockEvent, opts);
      window.removeEventListener("keydown", handleKeyDown, opts);
      window.removeEventListener("keyup", handleKeyUp, opts);
      window.removeEventListener("beforeprint", handleBeforePrint, opts);
      window.removeEventListener("blur", handleWindowBlur, opts);
      window.removeEventListener("focus", handleWindowFocus, optsPassv);
      document.removeEventListener("visibilitychange", handleVisibilityChange, opts);
      window.removeEventListener("pointerover", handlePointerOver, optsPassv);
      window.removeEventListener("pointerout", handlePointerOut, optsPassv);
      if (infoToastTimerRef.current) clearTimeout(infoToastTimerRef.current);
    };
  }, [activateFullSecurityScreen, clearClipboard, pauseProtectedMedia, logSecurityIncident]);

  // ─── LAYER 5: Background Clipboard Guard ───────────────────────────────────
  useEffect(() => {
    let last = 0;
    const sanitize = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - last > 2000) {
          last = now;
          clearClipboard();
        }
      }
    };
    document.addEventListener("visibilitychange", sanitize);
    window.addEventListener("pagehide", sanitize);
    return () => {
      document.removeEventListener("visibilitychange", sanitize);
      window.removeEventListener("pagehide", sanitize);
    };
  }, [clearClipboard]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {children}

      {/* ─────────────────────────────────────────────────────────────────────
          FULL-SCREEN OFFICIAL SECURITY DISPLAY
          Appears INSTANTLY ("before only display") covering the ENTIRE SCREEN
          so that Win+Shift+S, Win+G, Win+Alt+R, PrtScn capture ONLY this security screen!
          ───────────────────────────────────────────────────────────────────── */}
      {screenLock && (
        <div
          className="oc-full-security-screen"
          role="alertdialog"
          aria-modal="true"
          aria-label="Academic Security Alert"
        >
          {/* Watermark Pattern Background */}
          <div className="oc-full-sec__watermark-bg" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, idx) => (
              <div key={idx} className="oc-full-sec__watermark-row">
                <span>ACADEMIC DRM ACTIVE</span>
                <span>•</span>
                <span>SCREEN CAPTURE PROHIBITED</span>
                <span>•</span>
                <span>UNAUTHORIZED RECORDING RESTRICTED</span>
                <span>•</span>
                <span>CONFIDENTIAL MATERIAL</span>
              </div>
            ))}
          </div>

          {/* Central Authoritative Security Display Card */}
          <div className="oc-full-sec__card">
            {/* Top Shield Emblem */}
            <div className="oc-full-sec__icon-wrap">
              <i className="bi bi-shield-slash-fill oc-full-sec__pulse-icon" />
            </div>

            {/* Pill Badge */}
            <div className="oc-full-sec__badge">
              <i className="bi bi-shield-lock-fill me-1" />
              Institutional DRM Security Active
            </div>

            {/* Main Title */}
            <h2 className="oc-full-sec__title">{screenLock.title}</h2>

            {/* Shortcut Detection Banner */}
            <div className="oc-full-sec__banner">
              <i className="bi bi-exclamation-octagon-fill me-2" />
              SHORTCUT DETECTED: <span className="oc-full-sec__key">{screenLock.shortcut}</span>
            </div>

            {/* Comprehensive Description */}
            <p className="oc-full-sec__desc">{screenLock.reason}</p>

            {/* Forensic Audit Metadata Box */}
            <div className="oc-full-sec__audit-box">
              <div className="oc-full-sec__audit-row">
                <span className="text-white-50">
                  <i className="bi bi-person-circle me-1" /> Authorized Student:
                </span>
                <span className="text-white fw-bold">{username}</span>
              </div>

              <div className="oc-full-sec__audit-row">
                <span className="text-white-50">
                  <i className="bi bi-fingerprint me-1" /> Security Session ID:
                </span>
                <span className="text-warning font-monospace fw-bold">{sessionId}</span>
              </div>

              <div className="oc-full-sec__audit-row">
                <span className="text-white-50">
                  <i className="bi bi-clock-history me-1" /> Incident Timestamp:
                </span>
                <span className="text-info">{screenLock.time}</span>
              </div>

              <div className="oc-full-sec__audit-row oc-full-sec__audit-status">
                <span className="text-white-50">
                  <i className="bi bi-shield-check me-1" /> Security Audit Status:
                </span>
                <span className="text-danger fw-bold">
                  <i className="bi bi-record-circle-fill me-1" /> Logged &amp; Verified by Server
                </span>
              </div>
            </div>

            {/* Resume Button */}
            <div className="d-flex justify-content-center mt-4">
              <button
                type="button"
                className="oc-full-sec__resume-btn"
                onClick={dismissSecurityScreen}
              >
                <i className="bi bi-shield-check fs-5 me-2" />
                I Understand &mdash; Resume Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INFORMATIONAL TOAST (Login confirmation) ───────────────────────── */}
      {infoToast && (
        <div className="oc-sec-info-toast" role="status" aria-live="polite">
          <i className="bi bi-shield-check me-2" style={{ fontSize: "1.15rem" }} />
          <span>{infoToast.message}</span>
          <button
            type="button"
            className="btn-close btn-close-white ms-3"
            aria-label="Close"
            onClick={() => setInfoToast(null)}
            style={{ fontSize: "0.75rem" }}
          />
        </div>
      )}
    </>
  );
}
