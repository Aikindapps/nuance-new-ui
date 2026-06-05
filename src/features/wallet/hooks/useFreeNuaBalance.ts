import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import { useMyProfile } from "../../../lib/useMyProfile";
import {
  NUA_LEDGER_CANISTER_ID,
  USER_CANISTER_ID,
} from "../../../config/tokens";

// Reads the caller's restricted ("Free") NUA balance. These tokens are custodied
// by the User canister in a per-user subaccount (claimInfo.subaccount), so the
// balance is `icrc1_balance_of` on the NUA ledger with owner = USER canister and
// that subaccount. No subaccount yet (never claimed) → balance is 0.
export function useFreeNuaBalance() {
  const { principal } = useAuth();
  const { getIcrc1Balance } = useActors();
  const { data: profile } = useMyProfile();
  const principalText = principal?.toText() ?? null;
  const subaccount = profile?.claimInfo.subaccount;

  return useQuery<bigint>({
    // profile (and thus the subaccount) is loaded before this runs; a claim
    // invalidates this key so a freshly-created subaccount gets re-read.
    queryKey: ["free-nua-balance", principalText],
    enabled: principalText !== null && profile !== undefined,
    staleTime: 10 * 1000,
    // Match useTokenBalances: poll + refetch on focus for live updates.
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!subaccount || subaccount.length === 0) return 0n;
      return getIcrc1Balance(NUA_LEDGER_CANISTER_ID, USER_CANISTER_ID, subaccount);
    },
  });
}
