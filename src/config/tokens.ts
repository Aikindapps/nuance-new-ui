// Token / ledger / DEX configuration for the wallet + tipping features (PR-1, decision #42).
//
// These are ICRC-1 ledgers and Sonic DEX pools — NOT Nuance canisters — so they
// live here as a typed module rather than in canister_ids.json. The Nuance User
// canister custodies restricted ("Free") NUA, so its id is re-exported from the
// canonical map to avoid drift.
//
// Values verified against the production frontend:
//   ~/Projects/aikindapps-Nuance/src/nuance_assets/shared/constants.ts

import canisterIds from "./canister_ids.json";

/** Nuance User canister — custodian of restricted (Free) NUA subaccounts. */
export const USER_CANISTER_ID: string = canisterIds.User.ic;

export const TOKEN_SYMBOLS = ["NUA", "ICP", "ckBTC"] as const;
export type SupportedTokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export type TokenConfig = {
  symbol: SupportedTokenSymbol;
  /** Subtitle shown under the symbol on the holdings card. */
  subtitle: string;
  /** ICRC-1 ledger canister id. */
  canisterId: string;
  /** Transfer fee, in the token's base units (e8s). */
  fee: bigint;
  /** Ledger decimals — all three Nuance tipping tokens use 8. */
  decimals: number;
};

export const TOKENS: Record<SupportedTokenSymbol, TokenConfig> = {
  NUA: {
    symbol: "NUA",
    subtitle: "Nuance token",
    canisterId: "rxdbk-dyaaa-aaaaq-aabtq-cai",
    fee: 100_000n,
    decimals: 8,
  },
  ICP: {
    symbol: "ICP",
    subtitle: "",
    canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    fee: 10_000n,
    decimals: 8,
  },
  ckBTC: {
    symbol: "ckBTC",
    subtitle: "",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
    fee: 10n,
    decimals: 8,
  },
};

export const NUA_LEDGER_CANISTER_ID: string = TOKENS.NUA.canisterId;

/**
 * Holdings-grid display order. "FreeNUA" is the restricted-NUA pseudo-row — it
 * shares the NUA ledger but is read from the User canister's per-user subaccount.
 * BNB (in the Figma) is intentionally dropped: it is not a real Nuance token.
 */
export type HoldingRow = "FreeNUA" | SupportedTokenSymbol;
export const DISPLAY_TOKEN_ORDER: readonly HoldingRow[] = [
  "FreeNUA",
  "NUA",
  "ICP",
  "ckBTC",
];

/**
 * Sonic DEX pools used to convert non-NUA balances to a NUA-equivalent for the
 * "= N NUA" sub-line. Both pools are ICP-input (so `zeroForOne` is false — see
 * useNuaEquivalent). `outputTokenSymbol` is the key under which a pool's quote is
 * stored as `icpEquivalence` (units of that token per 1 ICP, in e8s).
 */
export type SonicPool = {
  canisterId: string;
  inputTokenSymbol: SupportedTokenSymbol;
  outputTokenSymbol: SupportedTokenSymbol;
};
export const SONIC_POOLS: readonly SonicPool[] = [
  { canisterId: "ng4fu-zaaaa-aaaak-qtsaq-cai", inputTokenSymbol: "ICP", outputTokenSymbol: "NUA" },
  { canisterId: "uluvj-yiaaa-aaaak-qlr6a-cai", inputTokenSymbol: "ICP", outputTokenSymbol: "ckBTC" },
];
