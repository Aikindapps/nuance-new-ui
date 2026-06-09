import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import {
  SONIC_POOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";

// Sonic DEX price points: how much of `tokenSymbol` you get for 1 ICP, in that
// token's base units (e8s). Mirrors the production frontend's TokenPrice shape.
export type TokenPrice = { tokenSymbol: SupportedTokenSymbol; icpEquivalence: number };

// Fetches a price quote per Sonic pool (1 ICP in → output token out) and keeps
// the successful ones. A failing pool is simply omitted — the "= N NUA" line
// degrades (hidden) rather than blocking the holdings render.
export function useNuaPrices() {
  const { getSonicQuote } = useActors();
  return useQuery<TokenPrice[]>({
    queryKey: ["sonic-prices"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const responses = await Promise.all(
        SONIC_POOLS.map((pool) =>
          getSonicQuote(pool.canisterId, {
            amountIn: (10 ** 8).toString(), // 1 ICP, in e8s
            zeroForOne: pool.inputTokenSymbol !== "ICP",
            amountOutMinimum: "",
          }).catch(() => null),
        ),
      );
      const prices: TokenPrice[] = [];
      responses.forEach((res, i) => {
        if (res && res.__kind__ === "ok") {
          const pool = SONIC_POOLS[i];
          prices.push({
            tokenSymbol:
              pool.inputTokenSymbol === "ICP"
                ? pool.outputTokenSymbol
                : pool.inputTokenSymbol,
            icpEquivalence: Number(res.ok),
          });
        }
      });
      return prices;
    },
  });
}

function decimalsOf(symbol: string): number {
  return symbol in TOKENS ? TOKENS[symbol as SupportedTokenSymbol].decimals : 8;
}

// Cross-rate between two tokens via their shared ICP pricing. Ported verbatim
// from the production `getPriceBetweenTokens`. Returns null when a required
// quote is missing. `amount` is in display units (not e8s).
function priceBetween(
  prices: TokenPrice[],
  token0: string,
  token1: string,
  amount: number,
): number | null {
  if (token0 === token1) return amount;
  if (token0 === "ICP") {
    const oneIcp = prices.find((p) => p.tokenSymbol === token1)?.icpEquivalence;
    if (oneIcp == null) return null;
    return (amount * oneIcp) / 10 ** decimalsOf(token1);
  }
  const t0Raw = prices.find((p) => p.tokenSymbol === token0)?.icpEquivalence;
  if (t0Raw == null) return null;
  const t0Icp = t0Raw / 10 ** decimalsOf(token0);
  let t1Icp: number | null = 1;
  if (token1 !== "ICP") {
    const t1Raw = prices.find((p) => p.tokenSymbol === token1)?.icpEquivalence;
    t1Icp = t1Raw == null ? null : t1Raw / 10 ** decimalsOf(token1);
  }
  if (t1Icp == null) return null;
  return amount * (t1Icp / t0Icp);
}

// NUA-equivalent of `displayAmount` units of `symbol`. NUA is 1:1; ICP/ckBTC go
// through Sonic. Returns null when the needed quote is unavailable so the caller
// can hide the conversion line.
export function nuaEquivalentOf(
  prices: TokenPrice[],
  symbol: SupportedTokenSymbol,
  displayAmount: number,
): number | null {
  if (symbol === "NUA") return displayAmount;
  return priceBetween(prices, symbol, "NUA", displayAmount);
}

// Inverse of nuaEquivalentOf for the tip flow: how many base units (e8s) of
// `symbol` are worth `nuaBaseUnits` base units of NUA. `priceBetween` is linear,
// so passing e8s in yields e8s out. NUA is 1:1. Returns null when a quote is
// missing. The caller floors + BigInts the result before transferring.
export function tokenE8sForNua(
  prices: TokenPrice[],
  symbol: SupportedTokenSymbol,
  nuaBaseUnits: number,
): number | null {
  if (symbol === "NUA") return nuaBaseUnits;
  return priceBetween(prices, "NUA", symbol, nuaBaseUnits);
}
