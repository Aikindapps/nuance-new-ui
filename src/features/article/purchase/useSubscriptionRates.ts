import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useNuaPrices, priceBetween } from "../../wallet/hooks/useNuaEquivalent";
import type { WriterSubscriptionDetails } from "../../../candid/Subscription/Subscription";
import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";

// ckUSDC Sonic pool (ICP→ckUSDC). ckUSDC has 6 decimals — NOT 8. Do NOT use
// decimalsOf() which defaults to 8 for unknown tokens; compute locally here.
const CKUSDC_POOL_CANISTER_ID = "drywa-daaaa-aaaak-qlsbq-cai";
const CKUSDC_DECIMALS = 6;

export type PlanRates = {
  /** "= N ICP" or null if the NUA/ICP Sonic price is unavailable. */
  icpLine: string | null;
  /** "= N ckBTC" or null if the NUA/ckBTC Sonic price is unavailable. */
  ckBtcLine: string | null;
  /** "= N USD" or null if the ICP/ckUSDC Sonic price is unavailable. */
  usdLine: string | null;
};

// Per-interval plan rates map (SubscriptionTimeInterval → PlanRates).
// Only intervals that have a fee in `details` will appear in the map.
export type PlanRatesMap = Partial<Record<SubscriptionTimeInterval, PlanRates>>;

// Map an interval to the fee field name on WriterSubscriptionDetails.
function feeField(
  interval: SubscriptionTimeInterval,
): keyof Pick<
  WriterSubscriptionDetails,
  "weeklyFee" | "monthlyFee" | "annuallyFee" | "lifeTimeFee"
> {
  switch (interval) {
    case SubscriptionTimeInterval.Weekly:
      return "weeklyFee";
    case SubscriptionTimeInterval.Monthly:
      return "monthlyFee";
    case SubscriptionTimeInterval.Annually:
      return "annuallyFee";
    case SubscriptionTimeInterval.LifeTime:
      return "lifeTimeFee";
  }
}

// Convert a raw e8s fee string to a display number (NUA has 8 decimals).
function feeToDisplay(rawE8s: string): number {
  return Number(BigInt(rawE8s)) / 1e8;
}

// Format a display number as a minimal-trailing-zero string (e.g. 0.3, 1, 6, 12).
function fmtDisplay(n: number): string {
  // Up to 4 decimal places; strip trailing zeros.
  return parseFloat(n.toFixed(4)).toString();
}

/**
 * Isolated hook that computes live NUA→ICP, NUA→ckBTC, and NUA→USD (via
 * ckUSDC) rate lines for each subscription plan offered by `details`.
 *
 * Rules (per design spec):
 * - Never modifies shared wallet files (config/tokens.ts, useNuaEquivalent.ts).
 * - Any line whose quote is null/unavailable is hidden (set to null).
 * - ckUSDC is 6 decimals — computed locally, never via decimalsOf().
 */
export function useSubscriptionRates(
  details: WriterSubscriptionDetails | null,
): PlanRatesMap {
  const { getSonicQuote } = useActors();
  const { data: prices } = useNuaPrices();

  // All intervals we might render (in display order).
  const INTERVALS = [
    SubscriptionTimeInterval.Weekly,
    SubscriptionTimeInterval.Monthly,
    SubscriptionTimeInterval.Annually,
    SubscriptionTimeInterval.LifeTime,
  ] as const;

  // Collect the display NUA amounts for intervals that have a fee.
  const planAmounts: Partial<Record<SubscriptionTimeInterval, number>> = {};
  if (details) {
    for (const interval of INTERVALS) {
      const raw = details[feeField(interval)];
      if (raw !== undefined && raw !== null) {
        planAmounts[interval] = feeToDisplay(raw);
      }
    }
  }

  // ICP amounts per plan — computed synchronously from prices.
  const icpAmounts: Partial<Record<SubscriptionTimeInterval, number | null>> = {};
  for (const interval of INTERVALS) {
    const displayNua = planAmounts[interval];
    if (displayNua === undefined) continue;
    icpAmounts[interval] =
      prices ? priceBetween(prices, "NUA", "ICP", displayNua) : null;
  }

  // ckBTC amounts per plan — computed synchronously from prices.
  const ckBtcAmounts: Partial<Record<SubscriptionTimeInterval, number | null>> = {};
  for (const interval of INTERVALS) {
    const displayNua = planAmounts[interval];
    if (displayNua === undefined) continue;
    ckBtcAmounts[interval] =
      prices ? priceBetween(prices, "NUA", "ckBTC", displayNua) : null;
  }

  // USD amounts via ckUSDC Sonic pool. We query once for each distinct ICP
  // amount. Amounts are collected into an array; the query fetches all in a
  // single Promise.all. Cache key includes the rounded e8s ICP amounts so
  // rate refreshes (from useNuaPrices refetch) retrigger this query too.
  const icpE8sInputs: Partial<Record<SubscriptionTimeInterval, number>> = {};
  for (const interval of INTERVALS) {
    const icpDisplay = icpAmounts[interval];
    if (icpDisplay == null) continue;
    icpE8sInputs[interval] = Math.round(icpDisplay * 1e8);
  }

  const cacheKey = JSON.stringify(icpE8sInputs);

  const usdQuery = useQuery<Partial<Record<SubscriptionTimeInterval, number | null>>>({
    queryKey: ["subscription-rates-usd", cacheKey],
    staleTime: 2 * 60 * 1000,
    enabled: Object.keys(icpE8sInputs).length > 0,
    queryFn: async () => {
      const results: Partial<Record<SubscriptionTimeInterval, number | null>> = {};
      await Promise.all(
        (Object.entries(icpE8sInputs) as [SubscriptionTimeInterval, number][]).map(
          async ([interval, icpE8s]) => {
            if (!icpE8s || icpE8s <= 0) {
              results[interval] = null;
              return;
            }
            try {
              const res = await getSonicQuote(CKUSDC_POOL_CANISTER_ID, {
                amountIn: icpE8s.toString(),
                zeroForOne: false,
                amountOutMinimum: "",
              });
              if (res.__kind__ === "ok") {
                // ckUSDC has 6 decimals — compute locally.
                results[interval] = Number(res.ok) / 10 ** CKUSDC_DECIMALS;
              } else {
                results[interval] = null;
              }
            } catch {
              results[interval] = null;
            }
          },
        ),
      );
      return results;
    },
  });

  // Assemble final map.
  const map: PlanRatesMap = {};
  for (const interval of INTERVALS) {
    if (planAmounts[interval] === undefined) continue;

    const icpVal = icpAmounts[interval];
    const ckBtcVal = ckBtcAmounts[interval];
    const usdVal = usdQuery.data?.[interval];

    map[interval] = {
      icpLine:
        icpVal != null ? `= ${fmtDisplay(icpVal)} ICP` : null,
      ckBtcLine:
        ckBtcVal != null ? `= ${fmtDisplay(ckBtcVal)} ckBTC` : null,
      usdLine:
        usdVal != null ? `= ${usdVal.toFixed(2)} USD` : null,
    };
  }
  return map;
}
