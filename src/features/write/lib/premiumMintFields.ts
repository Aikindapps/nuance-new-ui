// Premium-mint field rules shared by the desktop modal
// (PremiumMintView) and the phone sheet (PremiumMintSheet) -- one
// source of truth, no drift. Pure functions only, no React.

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
