// Static currency conversion table -> USD. No live FX API by design (internal tool).
// Update these when they drift materially. Rates as of 2026-07-13 (approximate, editable).
// See decisions-log.md 6.3: every monetary figure is normalized to USD before scoring or summing.

export type Currency = "USD" | "INR" | "EUR" | "GBP" | "CHF";

export const FX_TO_USD: Record<Currency, number> = {
  USD: 1,
  INR: 0.0116, // 1 INR ~ $0.0116  (~86 INR / USD)
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
};

export const FX_TABLE_VERSION = "2026-07-13";

export function toUsd(amount: number, currency: Currency): number {
  const rate = FX_TO_USD[currency] ?? 1;
  return amount * rate;
}

