import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { User } from "../../../candid/User/User";

// Claims restricted ("Free") NUA. The canister returns the updated User (fresh
// claimInfo.lastClaimDate → restarts the countdown, and a subaccount if this is
// the first claim). On success we write that server truth into the profile cache
// and invalidate the balance queries so the holdings + claim card refresh.
export function useClaimFreeNua() {
  const { principal } = useAuth();
  const { claimRestrictedTokens } = useActors();
  const queryClient = useQueryClient();
  const principalText = principal?.toText() ?? null;

  return useMutation<User, Error, void>({
    mutationFn: async () => {
      const result = await claimRestrictedTokens();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (updatedUser) => {
      if (principalText) {
        queryClient.setQueryData(["my-profile", principalText], updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ["free-nua-balance"] });
      queryClient.invalidateQueries({ queryKey: ["token-balances"] });
    },
  });
}
