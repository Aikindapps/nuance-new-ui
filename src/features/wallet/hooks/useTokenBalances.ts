import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";

export type TokenBalances = Record<SupportedTokenSymbol, bigint>;

// Reads the caller's NUA / ICP / ckBTC balances from each ledger's main account
// (no subaccount) via anon-safe ICRC-1 queries. Restricted ("Free") NUA lives in
// a User-canister subaccount and is read separately (useFreeNuaBalance).
export function useTokenBalances() {
  const { principal } = useAuth();
  const { getIcrc1Balance } = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<TokenBalances>({
    queryKey: ["token-balances", principalText],
    enabled: principalText !== null,
    staleTime: 10 * 1000,
    // Poll while the wallet is open and refetch on tab focus, so an incoming
    // deposit appears without a manual refresh (matches the live product). The
    // interval pauses when the tab is hidden and stops when the page unmounts.
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!principalText) throw new Error("useTokenBalances: no principal");
      const results = await Promise.all(
        TOKEN_SYMBOLS.map((s) =>
          getIcrc1Balance(TOKENS[s].canisterId, principalText),
        ),
      );
      const out = {} as TokenBalances;
      TOKEN_SYMBOLS.forEach((s, i) => {
        out[s] = results[i];
      });
      return out;
    },
  });
}
