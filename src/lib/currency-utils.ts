export interface ExchangeRates {
  [currencyCode: string]: number; // units of currency per 1 USD
}

export const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  VND: 25000,
};

/**
 * Convert an amount from one currency to another via USD pivot.
 * All rates are expressed as "units of currency per 1 USD".
 *
 * Example: convertAmount(500000, "VND", "USD", { VND: 25300, USD: 1 }) => 19.76
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? FALLBACK_RATES[from] ?? 1;
  const toRate = rates[to] ?? FALLBACK_RATES[to] ?? 1;
  return (amount / fromRate) * toRate;
}

/**
 * Convert a Record<currency, total> map to a single number in targetCurrency.
 * Returns { total, wasConverted } — wasConverted is true when at least one
 * source currency differed from toCurrency (drives the "≈" prefix in UI).
 */
export function convertTotalsMap(
  totals: Record<string, number>,
  to: string,
  rates: ExchangeRates
): { total: number; wasConverted: boolean } {
  let total = 0;
  let wasConverted = false;
  for (const [currency, amount] of Object.entries(totals)) {
    if (amount === 0) continue;
    if (currency !== to) wasConverted = true;
    total += convertAmount(amount, currency, to, rates);
  }
  return { total, wasConverted };
}
