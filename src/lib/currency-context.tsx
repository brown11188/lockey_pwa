"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { fetchSettings, invalidateSettingsCache } from "@/lib/settings-cache";

type Currency = "VND" | "USD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "VND",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("VND");

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data.currency === "VND" || data.currency === "USD") {
        setCurrencyState(data.currency);
      }
    });
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    invalidateSettingsCache();
    apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "currency", value: c }),
    }).catch(() => {});
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
