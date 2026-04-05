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

const COOKIE_NAME = "lockey-locale";

/** Read the locale cookie synchronously (works on client only) */
function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "vi";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const val = match?.[1];
  if (val === "en" || val === "vi") return val;
  return "vi"; // default to Vietnamese
}

/** Write locale to a long-lived cookie (400 days, lax, path=/) */
function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=${60 * 60 * 24 * 400};samesite=lax`;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "vi",
  setLocale: () => {},
  t: getDictionary("vi"),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Read cookie synchronously for instant correct language on first paint
  const [locale, setLocaleState] = useState<Locale>(readLocaleCookie);

  // Sync from server settings (in case cookie is missing/stale)
  useEffect(() => {
    fetchSettings().then((data) => {
      if (data.language === "en" || data.language === "vi") {
        if (data.language !== locale) {
          setLocaleState(data.language);
          writeLocaleCookie(data.language);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeLocaleCookie(l);
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
