/**
 * Single source of truth for "how much does N applauds cost" and "can the
 * reader afford it" -- used by BOTH the TipModal display line and the
 * useTipAuthor transfer, so what's shown on screen is what gets sent
 * (NIC-543). No React here; pure functions only.
 */

import { TOKENS } from "../../../config/tokens";

/**
 * Base-unit (e8s) cost of `applauds` applauds. Tipping is NUA-only (D-520), so
 * this is always exactly `applauds * 10^decimals`.
 */
export function tipAmountE8s(applauds: number): bigint {
  return BigInt(applauds) * 10n ** BigInt(TOKENS.NUA.decimals);
}

export type TipPlan = {
  token: "NUA";
  applauds: number;
  amountE8s: bigint;
  /** The portion spent from restricted (Free) NUA. */
  restrictedE8s: bigint;
  /** The portion moved by a regular ICRC-1 transfer. */
  regularE8s: bigint;
  /** Total network fee(s) the reader is charged for this plan. */
  feeE8s: bigint;
  affordable: boolean;
};

/**
 * Builds the exact leg breakdown for sending `amountE8s` NUA, given the
 * reader's regular wallet balance and restricted Free-NUA balance. Mirrors the
 * ICRC-1 fee-from-source rule for every leg, so `affordable` matches what the
 * ledger will actually accept.
 */
export function planTip(
  applauds: number,
  amountE8s: bigint,
  walletE8s: bigint,
  freeNuaE8s: bigint,
): TipPlan {
  const A = amountE8s;

  const F = TOKENS.NUA.fee;
  const R = freeNuaE8s;
  const spendableRestricted = R - F;

  if (spendableRestricted > 0n && A <= spendableRestricted) {
    // Wholly covered by Free NUA, which already reserves its own fee.
    return {
      token: "NUA",
      applauds,
      amountE8s: A,
      restrictedE8s: A,
      regularE8s: 0n,
      feeE8s: F,
      affordable: true,
    };
  }

  if (spendableRestricted > 0n) {
    // Free NUA covers part; the rest is a regular NUA transfer -- two legs,
    // two fees.
    const restricted = spendableRestricted;
    const regular = A - restricted;
    return {
      token: "NUA",
      applauds,
      amountE8s: A,
      restrictedE8s: restricted,
      regularE8s: regular,
      feeE8s: F + F,
      affordable: walletE8s >= regular + F,
    };
  }

  // No usable Free NUA (dust <= fee is not spendable) -- one regular leg.
  return {
    token: "NUA",
    applauds,
    amountE8s: A,
    restrictedE8s: 0n,
    regularE8s: A,
    feeE8s: F,
    affordable: walletE8s >= A + F,
  };
}

/**
 * Largest applaud count in [0, cap] the reader can afford, found by binary
 * search -- affordability is monotone (non-increasing) in the applaud count
 * for every branch of `planTip`.
 */
export function maxAffordableApplauds(
  walletE8s: bigint,
  freeNuaE8s: bigint,
  cap: number,
): number {
  const affordableAt = (n: number): boolean =>
    planTip(n, tipAmountE8s(n), walletE8s, freeNuaE8s).affordable;

  if (!affordableAt(0)) return 0;

  let lo = 0;
  let hi = cap;
  while (lo < hi) {
    const mid = lo + Math.ceil((hi - lo) / 2);
    if (affordableAt(mid)) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

/**
 * Formats a base-unit (e8s) bigint as an exact decimal string using
 * bigint/string math only (no Number, no toFixed), so a displayed amount is
 * never off by a rounding step from what actually gets sent. Trailing
 * fractional zeros are trimmed; no thousands grouping.
 */
export function formatExactE8s(raw: bigint, decimals = 8): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
}
