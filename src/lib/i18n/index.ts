export type { Locale, Translations } from "./types";
export { en } from "./en";
export { vi } from "./vi";

import type { Locale, Translations } from "./types";
import { en } from "./en";
import { vi } from "./vi";

const dictionaries: Record<Locale, Translations> = { en, vi };

export function getDictionary(locale: Locale): Translations {
  return dictionaries[locale] ?? dictionaries.en;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Ti\u1ebfng Vi\u1ec7t",
};

export const LOCALES: Locale[] = ["en", "vi"];
