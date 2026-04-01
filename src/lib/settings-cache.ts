"use client";

import { apiFetch } from "@/lib/api";

type SettingsData = Record<string, string>;

let cachedPromise: Promise<SettingsData> | null = null;
let cachedData: SettingsData | null = null;

/**
 * Shared settings fetcher — deduplicates the GET /api/settings call
 * across CurrencyProvider, LanguageProvider, and OnboardingProvider.
 * All three mount at the same time and would otherwise triple-fetch.
 */
export function fetchSettings(): Promise<SettingsData> {
  if (cachedData) return Promise.resolve(cachedData);
  if (cachedPromise) return cachedPromise;

  cachedPromise = apiFetch("/api/settings")
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch settings");
      return r.json() as Promise<SettingsData>;
    })
    .then((data) => {
      cachedData = data;
      return data;
    })
    .catch(() => {
      cachedPromise = null;
      return {} as SettingsData;
    });

  return cachedPromise;
}

/**
 * Invalidate the cached settings (call after a PUT to /api/settings)
 */
export function invalidateSettingsCache() {
  cachedPromise = null;
  cachedData = null;
}
