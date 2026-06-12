/**
 * Token amount helpers for the wallet + tipping features (PR-1, decision #42).
 *
 * Ledger amounts are kept as `bigint` end-to-end (balances, fees, transfer
 * amounts). `number` appears only at the display boundary (`formatAmount`) and
 * for the inherently-float Sonic cross-rate. This is a deliberate improvement on
 * the production frontend, which used `number` throughout and risked precision
 * loss on large e8s values.
 */

/** Convert a base-unit (e8s) bigint to a display number. Display-only. */
export function fromE8s(raw: bigint, decimals = 8): number {
  return Number(raw) / 10 ** decimals;
}

/**
 * Format a base-unit (e8s) bigint for display with a fixed number of decimal
 * places. The 4-dp default matches the Figma (NUA "64.0000", ICP "0.1020");
 * callers rendering balances pass the token's `TokenConfig.displayDecimals`
 * (ckBTC needs 8 — PR #13), and the Free-NUA card passes 0 (whole numbers).
 *
 * Above 4 decimal places, trailing zeros are trimmed back down to 4: ckBTC
 * "0.00012345" keeps its precision, but "0.01000000" renders "0.0100" — the
 * extra zeros cramped the holdings card and history column (visual pass,
 * 2026-06-12). NUA/ICP at 4 dp are unaffected (Figma's fixed-width zeros stay).
 */
export function formatAmount(
  raw: bigint,
  { decimals = 8, displayDecimals = 4 }: { decimals?: number; displayDecimals?: number } = {},
): string {
  const fixed = fromE8s(raw, decimals).toFixed(displayDecimals);
  if (displayDecimals <= 4) return fixed;
  const [whole, frac] = fixed.split(".");
  const trimmed = frac.replace(/0+$/, "").padEnd(4, "0");
  return `${whole}.${trimmed}`;
}

/**
 * Convert a user-entered display amount to base units (e8s). Rounds to the
 * nearest base unit. Returns a bigint suitable for a ledger transfer.
 */
export function toE8s(amount: number, decimals = 8): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

/**
 * Derive a 32-byte big-endian subaccount from a Nat (used for per-post tipping
 * subaccounts). Mirrors the canister's `natToSubAccount` exactly, so a transfer
 * into `toBase256(postId)` lands in the same subaccount the PostBucket reads
 * during settlement. Always pass the explicit array to a transfer (never an
 * empty subaccount): `toBase256(0)` and an empty subaccount both resolve to the
 * all-zeros account, so an explicit array is correct for every postId.
 *
 * Source: ~/Projects/aikindapps-Nuance/src/nuance_assets/shared/utils.ts (toBase256)
 *         ~/Projects/aikindapps-Nuance/src/shared/utils.mo (natToSubAccount)
 */
export function toBase256(num: number, digitCount = 32): Uint8Array {
  const bytes: number[] = [];
  let n = num;
  while (n > 0) {
    bytes.unshift(n % 256);
    n = Math.floor(n / 256);
  }
  while (bytes.length < digitCount) {
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}
