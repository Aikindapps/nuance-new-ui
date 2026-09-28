import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Principal } from "@icp-sdk/core/principal";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { TOKENS, NUA_LEDGER_CANISTER_ID } from "../../../config/tokens";
import { toBase256 } from "../../../lib/tokenMath";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";
import type { TipPlan } from "./tipAmount";
import { transferErrText } from "../lib/transferErrText";

// The tip transfer engine (mirrors prod clap-modal's executeTransaction).
//
// The mutation variables are a frozen TipPlan -- the exact leg breakdown the
// dialog already computed and displayed (tipAmount.ts). This function does
// NOT re-derive the amount from prices or re-read Free NUA: what was shown is
// what gets sent, by construction. Settlement (checkTippingByTokenSymbol) is
// fire-and-forget -- the CANISTER splits the escrow (writer / publication /
// DAO) and pays out; the frontend never computes the split.
export function useTipAuthor(postId: string, bucketCanisterId: string) {
  const {
    spendRestrictedTokensForTipping,
    transferIcrc1,
    checkTippingByTokenSymbol,
  } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const principalText = principal?.toText() ?? null;

  return useMutation<TipPlan, Error, TipPlan>({
    mutationFn: async (plan) => {
      const { token, amountE8s, restrictedE8s, regularE8s } = plan;
      const cfg = TOKENS[token];

      if (amountE8s <= 0n) throw new Error("That amount is too small to send.");
      if (restrictedE8s + regularE8s !== amountE8s) {
        throw new Error("Internal error: tip plan legs don't add up.");
      }

      // postId is a numeric (Nat) string from the canister; guard anyway so a
      // malformed id can't become NaN → toBase256 → all-zeros subaccount, which
      // would silently misdirect funds to the bucket's default account.
      const postNat = parseInt(postId, 10);
      if (!Number.isFinite(postNat)) {
        throw new Error("Invalid post reference — can’t send this tip.");
      }
      const to = {
        owner: Principal.fromText(bucketCanisterId),
        subaccount: toBase256(postNat, 32),
      };

      if (token === "NUA") {
        if (restrictedE8s > 0n && regularE8s === 0n) {
          const r = await spendRestrictedTokensForTipping(
            bucketCanisterId,
            postId,
            restrictedE8s,
          );
          if (r.__kind__ === "err") throw new Error(r.err);
        } else if (restrictedE8s > 0n) {
          // Restricted covers part; the rest is a regular NUA transfer. Both
          // legs must succeed, else surface a precise partial-failure error.
          // KNOWN LIMITATION: the two legs aren't atomic. If one succeeds and
          // the other fails, the successful leg's funds are already in the
          // post escrow but we throw (no settlement call this run). They are
          // NOT lost -- the next checkTippingByTokenSymbol for this post settles
          // the accumulated escrow -- but the user sees "failed" after partial
          // movement. Acceptable (mirrors prod's escrow model); revisit if a
          // true rollback is ever required. Untested on live UAT.
          const [restrictedRes, regularRes] = await Promise.all([
            spendRestrictedTokensForTipping(
              bucketCanisterId,
              postId,
              restrictedE8s,
            ),
            transferIcrc1(NUA_LEDGER_CANISTER_ID, to, regularE8s, cfg.fee),
          ]);
          if (restrictedRes.__kind__ === "err" && regularRes.__kind__ === "Err") {
            throw new Error(
              `Tip failed: ${restrictedRes.err}; ${transferErrText(regularRes.Err)}`,
            );
          }
          if (restrictedRes.__kind__ === "err") {
            throw new Error(`Free-NUA portion failed: ${restrictedRes.err}`);
          }
          if (regularRes.__kind__ === "Err") {
            throw new Error(`NUA portion failed: ${transferErrText(regularRes.Err)}`);
          }
        } else {
          const r = await transferIcrc1(NUA_LEDGER_CANISTER_ID, to, regularE8s, cfg.fee);
          if (r.__kind__ === "Err") throw new Error(transferErrText(r.Err));
        }
      } else {
        const r = await transferIcrc1(cfg.canisterId, to, regularE8s, cfg.fee);
        if (r.__kind__ === "Err") throw new Error(transferErrText(r.Err));
      }

      // Settlement: the canister reads the escrow, splits, pays out, notifies.
      // Fire-and-forget — do not block the success screen on it.
      void checkTippingByTokenSymbol(bucketCanisterId, postId, token);
      return plan;
    },
    onSuccess: ({ applauds }) => {
      // Optimistic applause bump (1 applaud = 1 NUA-equivalent). Settlement is
      // async, so reflect the tip now rather than refetch a not-yet-settled
      // count. Balances are stale — the wallet's own poll refreshes them.
      queryClient.setQueryData<PostKeyProperties | null>(
        ["post-meta", postId],
        (old) =>
          old ? { ...old, claps: String((Number(old.claps) || 0) + applauds) } : old,
      );
      if (principalText) {
        queryClient.invalidateQueries({ queryKey: ["token-balances", principalText] });
        queryClient.invalidateQueries({ queryKey: ["free-nua-balance", principalText] });
      }
    },
  });
}
