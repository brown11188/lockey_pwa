"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

export function HtmlLangUpdater() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
