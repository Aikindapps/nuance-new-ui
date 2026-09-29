// Premium-mint field rules shared by the desktop step
// (PremiumMintStep) and the phone sheet (PremiumMintSheet) -- one
// source of truth, no drift. Pure functions only, no React.

import { premiumMintSheetCopy } from "../sections/premiumMintSheetCopy";

export const MAX_KEYS = 10000;
export const MIN_PRICE_E8S = 100000; // canister floor = 0.001 ICP

// Strip non-digits; "" stays ""; clamp to MAX_KEYS.
export function sanitizeKeys(raw: string): string {
  const v = raw.replace(/\D/g, "");
  if (v === "" || parseInt(v, 10) <= MAX_KEYS) return v;
  return String(MAX_KEYS);
}

// Returns raw when it matches the shape of an ICP amount (up to 4
// decimal places), else null (reject the keystroke).
export function sanitizePrice(raw: string): string | null {
  if (/^\d*\.?\d{0,4}$/.test(raw)) return raw;
  return null;
}

// Parses an ICP amount string into a number, 0 for "", "." or anything
// failing the shared price shape; else parseFloat.
export function parseIcpAmount(price: string): number {
  const bad =
    !price || price === "." || !/^\d*\.?\d{0,4}$/.test(price);
  if (bad) return 0;
  return parseFloat(price);
}

// Inline message under the price field (replaces the conversion line),
// or null. Explains why Publish is still disabled; the Publish rule
// itself is PremiumMintView's validateNft, unchanged.
export function priceErrorMessage(price: string): string | null {
  if (price === "") return null;
  const icp = parseIcpAmount(price);
  if (icp <= 0) return premiumMintSheetCopy.priceMustBePositive;
  if (Math.round(icp * 1e8) < MIN_PRICE_E8S) {
    return premiumMintSheetCopy.priceBelowMinimum;
  }
  return null;
}

// Inline message under the keys field, or null (no message while the
// editor count, and so the minimum, is unknown).
export function keysErrorMessage(
  keys: string,
  minKeys: number | null,
): string | null {
  if (keys === "" || minKeys == null) return null;
  return parseInt(keys, 10) < minKeys
    ? premiumMintSheetCopy.keysBelowMinimum.replace("{min}", String(minKeys))
    : null;
}
