import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Principal } from "@icp-sdk/core/principal";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { TOKENS, type SupportedTokenSymbol } from "../../../config/tokens";
import { accountIdBytesFromHex } from "../../../lib/accountIdentifier";
import { transferErrText } from "../lib/transferErrText";

export type WithdrawVars = {
  token: SupportedTokenSymbol;
  /** Validated upstream: a principal text, or (ICP only) a 64-hex account id. */
  receiver: string;
  /** Transfer amount in base units (e8s) — fee NOT included (ledger adds it). */
  amount: bigint;
};

// Withdraw transfer engine (PR #14, decision #43). Two paths:
//  - ICP to a 64-hex account identifier → legacy ledger `transfer` (the form
//    exchanges and the NNS dapp hand out).
//  - everything else (principal receivers, all tokens) → `icrc1_transfer` on
//    the token's ledger. ICP principal receivers land in the same underlying
//    account as their account-id form, so both paths are equivalent for ICP.
// Free (restricted) NUA is NOT withdrawable — it sits in the User canister's
// custody subaccount; only the caller's regular ledger balances move here.
export function useWithdraw() {
  const { transferIcrc1, transferIcp } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const principalText = principal?.toText() ?? null;

  return useMutation<WithdrawVars, Error, WithdrawVars>({
    mutationFn: async ({ token, receiver, amount }) => {
      if (amount <= 0n) throw new Error("That amount is too small to send.");
      const cfg = TOKENS[token];
      const accountBytes =
        token === "ICP" ? accountIdBytesFromHex(receiver) : null;
      if (accountBytes) {
        const r = await transferIcp(accountBytes, amount);
        if (r.__kind__ === "Err") throw new Error(transferErrText(r.Err));
      } else {
        const r = await transferIcrc1(
          cfg.canisterId,
          { owner: Principal.fromText(receiver) },
          amount,
          cfg.fee,
        );
        if (r.__kind__ === "Err") throw new Error(transferErrText(r.Err));
      }
      return { token, receiver, amount };
    },
    onSuccess: () => {
      if (principalText) {
        queryClient.invalidateQueries({ queryKey: ["token-balances", principalText] });
        queryClient.invalidateQueries({ queryKey: ["wallet-history", principalText] });
      }
    },
  });
}
