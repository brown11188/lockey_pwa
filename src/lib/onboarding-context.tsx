"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { fetchSettings, invalidateSettingsCache } from "@/lib/settings-cache";

interface OnboardingContextType {
  showOnboarding: boolean;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  showOnboarding: false,
  completeOnboarding: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (data.onboarding_done !== "true") {
          setShowOnboarding(true);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    invalidateSettingsCache();
    apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "onboarding_done", value: "true" }),
    }).catch(() => {});
  }, []);

  if (!loaded) return null;

  return (
    <OnboardingContext.Provider value={{ showOnboarding, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
