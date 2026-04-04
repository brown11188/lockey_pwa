"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { fetchSettings, invalidateSettingsCache } from "@/lib/settings-cache";
import type { Locale, Translations } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: getDictionary("en"),
});

const LOCALE_STORAGE_KEY = "lockey_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Restore locale from localStorage immediately (synchronous, no network delay).
    // Wrapped in try-catch in case localStorage is unavailable (e.g., private browsing).
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "en" || saved === "vi") {
        setLocaleState(saved);
      }
    } catch (e) {
      console.warn("Failed to read locale from localStorage:", e);
    }

    // Verify and sync with server settings
    fetchSettings().then((data) => {
      if (data.language === "en" || data.language === "vi") {
        setLocaleState(data.language);
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, data.language);
        } catch (e) {
          console.warn("Failed to save locale to localStorage:", e);
        }
      }
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch (e) {
      console.warn("Failed to save locale to localStorage:", e);
    }
    invalidateSettingsCache();
    apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "language", value: l }),
    }).catch(() => {});
  }, []);

  const t = useMemo(() => getDictionary(locale), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
