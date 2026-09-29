/**
 * Single source of truth for "how much does N applauds cost" and "can the
 * reader afford it" -- used by BOTH the TipModal display line and the
 * useTipAuthor transfer, so what's shown on screen is what gets sent
 * (NIC-543). No React here; pure functions only.
 */

import { TOKENS, type SupportedTokenSymbol } from "../../../config/tokens";
import { tokenE8sForNua, type TokenPrice } from "../hooks/useNuaEquivalent";

/**
 * Base-unit (e8s) cost of `applauds` applauds in `token`. NUA is always
 * exactly `applauds * 10^decimals` and never looks at prices -- NUA must
 * never wait on or be blocked by the Sonic price lookup. ICP/ckBTC go
 * through the Sonic cross-rate and return null when a quote is missing
 * (including while `prices` hasn't loaded yet) so the caller can show the
 * loading/unavailable state instead of a wrong number. May return 0n when
 * the applaud amount is too small to round to a whole base unit.
 */
export function tipAmountE8s(
  prices: TokenPrice[] | undefined,
  token: SupportedTokenSymbol,
  applauds: number,
): bigint | null {
  const cfg = TOKENS[token];
  if (token === "NUA") {
    return BigInt(applauds) * 10n ** BigInt(cfg.decimals);
  }
  if (!prices) return null;
  const e8s = tokenE8sForNua(prices, token, applauds * 10 ** cfg.decimals);
  if (e8s == null || !Number.isFinite(e8s)) return null;
  return BigInt(Math.floor(e8s));
}

/** True when a quote is available for `token` (NUA always is). */
export function hasQuote(
  prices: TokenPrice[] | undefined,
  token: SupportedTokenSymbol,
): boolean {
  if (token === "NUA") return true;
  return tipAmountE8s(prices, token, 1) !== null;
}

/**
 * Smallest tip (base units) the Nuance back end can pay out (NIC-568, D-137).
 * The post bucket's payout sends floor(10% of the escrow) minus one fee to the
 * DAO and traps when that is negative; at exactly 10 fees the DAO share is 0
 * (a zero-amount transfer). So require a DAO share of at least 1 base unit:
 * 10 * (fee + 1). ICP 100,010 e8s, ckBTC 110 sats, NUA 0.0100001 NUA. Needs no
 * price.
 */
export function minPayableTipE8s(token: SupportedTokenSymbol): bigint {
  return 10n * (TOKENS[token].fee + 1n);
}

/**
 * Smallest applaud count in [1, cap] whose cost reaches `minPayableTipE8s`,
 * found by binary search (`tipAmountE8s` never decreases as the count grows).
 * Returns null when no price quote is available for `token` (same contract as
 * `maxAffordableApplauds`), and cap + 1 when even `cap` applauds are below the
 * minimum, so every amount the input allows counts as too small. NUA is 1.
 */
export function minTipApplauds(
  prices: TokenPrice[] | undefined,
  token: SupportedTokenSymbol,
  cap: number,
): number | null {
  if (!hasQuote(prices, token)) return null;

  const min = minPayableTipE8s(token);
  const reachesMin = (n: number): boolean => {
    const amountE8s = tipAmountE8s(prices, token, n);
    return amountE8s != null && amountE8s >= min;
  };

  if (!reachesMin(cap)) return cap + 1;

  let lo = 1;
  let hi = cap;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (reachesMin(mid)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

export type TipPlan = {
  token: SupportedTokenSymbol;
  applauds: number;
  amountE8s: bigint;
  /** NUA only: the portion spent from restricted (Free) NUA. */
  restrictedE8s: bigint;
  /** The portion moved by a regular ICRC-1 transfer. */
  regularE8s: bigint;
  /** Total network fee(s) the reader is charged for this plan. */
  feeE8s: bigint;
  affordable: boolean;
};

/**
 * Builds the exact leg breakdown for sending `amountE8s` of `token`, given
 * the reader's regular wallet balance and (for NUA) restricted Free-NUA
 * balance. Mirrors the ICRC-1 fee-from-source rule for every leg, so
 * `affordable` matches what the ledger will actually accept. For ICP/ckBTC,
 * `freeNuaE8s` is ignored and `restrictedE8s` is always 0.
 */
export function planTip(
  token: SupportedTokenSymbol,
  applauds: number,
  amountE8s: bigint,
  walletE8s: bigint,
  freeNuaE8s: bigint,
): TipPlan {
  const cfg = TOKENS[token];
  const A = amountE8s;

  if (token !== "NUA") {
    const fee = cfg.fee;
    return {
      token,
      applauds,
      amountE8s: A,
      restrictedE8s: 0n,
      regularE8s: A,
      feeE8s: fee,
      affordable: walletE8s >= A + fee,
    };
  }

  const F = TOKENS.NUA.fee;
  const R = freeNuaE8s;
  const spendableRestricted = R - F;

  if (spendableRestricted > 0n && A <= spendableRestricted) {
    // Wholly covered by Free NUA, which already reserves its own fee.
    return {
      token,
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
      token,
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
    token,
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
 * for every branch of `planTip`. Returns null when no price quote is
 * available for `token` (ICP/ckBTC while loading/unavailable), so the "Max"
 * control can hide itself instead of showing a stale estimate.
 */
export function maxAffordableApplauds(
  prices: TokenPrice[] | undefined,
  token: SupportedTokenSymbol,
  walletE8s: bigint,
  freeNuaE8s: bigint,
  cap: number,
): number | null {
  if (!hasQuote(prices, token)) return null;

  const affordableAt = (n: number): boolean => {
    const amountE8s = tipAmountE8s(prices, token, n);
    if (amountE8s == null) return false;
    return planTip(token, n, amountE8s, walletE8s, freeNuaE8s).affordable;
  };

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
