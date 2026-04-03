"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { type ExchangeRates, FALLBACK_RATES } from "@/lib/currency-utils";

interface ExchangeRateResult {
  rates: ExchangeRates;
  ratesDate: string | null;
  loading: boolean;
  isLive: boolean;
}

export function useExchangeRates(): ExchangeRateResult {
  const [state, setState] = useState<ExchangeRateResult>({
    rates: FALLBACK_RATES,
    ratesDate: null,
    loading: true,
    isLive: false,
  });

  useEffect(() => {
    apiFetch("/api/exchange-rates")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setState({
          rates: data.rates ?? FALLBACK_RATES,
          ratesDate: data.date ?? null,
          loading: false,
          isLive: true,
        });
      })
      .catch(() => {
        setState((prev) => ({ ...prev, loading: false, isLive: false }));
      });
  }, []);

  return state;
}
