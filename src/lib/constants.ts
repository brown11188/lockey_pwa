import type { Translations } from "@/lib/i18n";

export const CATEGORIES = [
  { value: "food", labelKey: "food" as const, emoji: "🍜" },
  { value: "transport", labelKey: "transport" as const, emoji: "🚗" },
  { value: "shopping", labelKey: "shopping" as const, emoji: "🛍️" },
  { value: "health", labelKey: "health" as const, emoji: "💊" },
  { value: "housing", labelKey: "housing" as const, emoji: "🏠" },
  { value: "entertainment", labelKey: "entertainment" as const, emoji: "🎮" },
  { value: "education", labelKey: "education" as const, emoji: "📚" },
  { value: "travel", labelKey: "travel" as const, emoji: "✈️" },
  { value: "work", labelKey: "work" as const, emoji: "💼" },
  { value: "gifts", labelKey: "gifts" as const, emoji: "🎁" },
  { value: "bills", labelKey: "bills" as const, emoji: "💡" },
  { value: "pets", labelKey: "pets" as const, emoji: "🐾" },
  { value: "other", labelKey: "other" as const, emoji: "➕" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  VND: "₫",
  USD: "$",
};

export function getCategoryInfo(value: string, t?: Translations["categories"]) {
  const cat = CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[5];
  const label = t ? t[cat.labelKey] : cat.labelKey.charAt(0).toUpperCase() + cat.labelKey.slice(1);
  return { ...cat, label };
}

