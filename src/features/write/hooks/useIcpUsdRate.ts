import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";

// ICP -> USD rate for the key price conversion line ("approx N.NN USD") on
// the limited-edition mint setup and on Keys & sales (D-142, NIC-526).
// Display only: no payment is ever computed from this number.
//
// Source: ICPSwap ckUSDC/ICP pool. token0 = ICP, token1 = ckUSDC, so
// ICP -> ckUSDC is zeroForOne: true (the opposite of the old Sonic ckUSDC
// call). The pool answers the same `quote` method as the Sonic pools, so the
// existing getSonicQuote binding is reused unchanged. Its quotes are linear
// for small inputs, so one cached 1-ICP quote times the ICP price is accurate
// enough for an approximate line -- no request per keystroke.
const ICPSWAP_CKUSDC_ICP_POOL = "mohjv-bqaaa-aaaag-qjyia-cai";
// ckUSDC has 6 decimals, not 8.
const CKUSDC_DECIMALS = 6;
const ONE_ICP_E8S = "100000000";
const ICP_USD_STALE_MS = 2 * 60 * 1000;

// USD value of 1 ICP, or null while loading / when the quote fails. The
// query key is shared, so every screen reads the same cached quote.
export function useIcpUsdRate(): number | null {
  const { getSonicQuote } = useActors();
  const { data } = useQuery<number>({
    queryKey: ["icp-usd-rate"],
    staleTime: ICP_USD_STALE_MS,
    // At most one quote per screen open; a failure shows the dash.
    retry: false,
    queryFn: async () => {
      const res = await getSonicQuote(ICPSWAP_CKUSDC_ICP_POOL, {
        amountIn: ONE_ICP_E8S,
        zeroForOne: true,
        amountOutMinimum: "",
      });
      if (res.__kind__ !== "ok") throw new Error("ICP/USD quote unavailable");
      const usd = Number(res.ok) / 10 ** CKUSDC_DECIMALS;
      if (!Number.isFinite(usd) || usd <= 0) {
        throw new Error("ICP/USD quote unavailable");
      }
      return usd;
    },
  });
  return data ?? null;
}

// USD value of `icpAmount` (display units), or null when either the rate is
// missing or the amount is not a positive number.
export function icpToUsd(
  usdPerIcp: number | null,
  icpAmount: number,
): number | null {
  if (usdPerIcp == null || !(icpAmount > 0)) return null;
  return icpAmount * usdPerIcp;
}
