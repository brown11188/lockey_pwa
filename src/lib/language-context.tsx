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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data.language === "en" || data.language === "vi") {
        setLocaleState(data.language);
      }
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    invalidateSettingsCache();
    apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "language", value: l }),
    }).catch(() => {});
  }, []);

  const t = useMemo(() => getDictionary(locale), [locale]);

  // Memoize context value to prevent re-renders when parent re-renders
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
