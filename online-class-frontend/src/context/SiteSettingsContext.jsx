import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { fetchSiteSettings, fetchCustomSections, SECTION_LIST } from "../api/client";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cached_site_settings");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [customSections, setCustomSections] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cached_custom_sections");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [educationLogoUrl, setEducationLogoUrl] = useState(() => {
    return (
      sessionStorage.getItem("oc_cached_education_logo") ||
      sessionStorage.getItem("oc_cache_dashboard_logo") ||
      null
    );
  });

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchSiteSettings();
      if (res.data?.data) {
        const data = res.data.data;
        setSettings(data);
        sessionStorage.setItem("oc_cached_site_settings", JSON.stringify(data));
        if (data.education_logo_url) {
          setEducationLogoUrl(data.education_logo_url);
          sessionStorage.setItem("oc_cached_education_logo", data.education_logo_url);
          sessionStorage.setItem("oc_cache_dashboard_logo", data.education_logo_url);
        } else {
          // Secondary fallback to check welcome-screen
          try {
            const wsRes = await api.get("/welcome-screen");
            if (wsRes.data?.dashboard_logo_url) {
              setEducationLogoUrl(wsRes.data.dashboard_logo_url);
              sessionStorage.setItem("oc_cached_education_logo", wsRes.data.dashboard_logo_url);
              sessionStorage.setItem("oc_cache_dashboard_logo", wsRes.data.dashboard_logo_url);
              return;
            }
          } catch {}
          setEducationLogoUrl(null);
          sessionStorage.removeItem("oc_cached_education_logo");
          sessionStorage.removeItem("oc_cache_dashboard_logo");
        }
      }
    } catch {}
  }, []);

  const loadCustomSections = useCallback(async () => {
    try {
      const res = await fetchCustomSections();
      if (res.data?.data) {
        setCustomSections(res.data.data);
        sessionStorage.setItem("oc_cached_custom_sections", JSON.stringify(res.data.data));
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
    loadCustomSections();

    const handleLogoUpdate = () => {
      loadSettings();
    };
    const handleSectionsUpdate = () => {
      loadCustomSections();
    };

    window.addEventListener("oc-logo-updated", handleLogoUpdate);
    window.addEventListener("oc-sections-updated", handleSectionsUpdate);
    return () => {
      window.removeEventListener("oc-logo-updated", handleLogoUpdate);
      window.removeEventListener("oc-sections-updated", handleSectionsUpdate);
    };
  }, [loadSettings, loadCustomSections]);

  let parsedSectionColors = null;
  if (settings?.section_colors) {
    try {
      parsedSectionColors = typeof settings.section_colors === "string" 
        ? JSON.parse(settings.section_colors) 
        : settings.section_colors;
    } catch {}
  }

  // Combined sections list (Built-in + Custom sections)
  const allSections = [
    ...SECTION_LIST,
    ...customSections.filter(cs => !SECTION_LIST.some(bs => bs.key === cs.key)),
  ];

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        educationLogoUrl,
        educationLogoName: settings?.education_logo_name || "Education Logo",
        sectionColors: parsedSectionColors,
        customSections,
        allSections,
        reloadSettings: loadSettings,
        reloadCustomSections: loadCustomSections,
        setEducationLogoUrl,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  return ctx || {};
}
