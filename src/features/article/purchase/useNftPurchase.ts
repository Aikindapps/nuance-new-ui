import { useCallback, useEffect, useRef, useState } from "react";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { TOKENS } from "../../../config/tokens";
import {
  principalToAccountIdentifier,
  accountIdBytesFromHex,
} from "../../../lib/accountIdentifier";
import { extTokenIdentifier } from "../../../lib/extTokenId";
import type { PremiumArticleSellingInformation } from "../../../candid/ExtV2/ExtV2";

// State machine for the NFT purchase flow (NIC-128 §3.4).
// loading      → confirm | soldout   (on modal open, after getAvailableToken)
// confirm      → processing           (on terms-checked confirm)
// processing   → success | insufficient | error
// insufficient → closed / /wallet
// error        → confirm (try again, pre-payment) | processing (settle retry, post-payment)
// soldout      → closed / author profile
// success      → closed / read article

export type NftPurchaseStage =
  | "loading"
  | "confirm"
  | "processing"
  | "success"
  | "insufficient"
  | "error"
  | "soldout";

export type NftPurchaseState = {
  stage: NftPurchaseStage;
  saleInfo: PremiumArticleSellingInformation | null;
  /** User's ICP balance (e8s) — populated only in the insufficient state. */
  balance: bigint | null;
  errorMessage: string | null;
  /**
   * True when transferIcp has returned Ok. If the error stage is reached with
   * paid=true, ICP HAS left the user's account — "Try again" must only retry
   * settle(), never re-run the full lock→pay sequence.
   */
  paid: boolean;
  /**
   * The EXT token identifier used in the most recent lock/settle attempt.
   * Persisted in state so a settle-retry can call settleExtToken with the
   * same tokenId that was already locked and paid for.
   */
  lastTokenId: string | null;
};

export type NftPurchaseHook = NftPurchaseState & {
  /** Execute the purchase sequence. Must be called with terms checked. */
  confirm: () => Promise<void>;
  /**
   * "Try again" handler — behaviour differs by error variant:
   *   • paid=false (pre-payment error): resets to confirm stage; user re-runs
   *     the full lock→pay→settle sequence.
   *   • paid=true (post-payment, settle-only error): retries settleExtToken on
   *     the same tokenId without re-locking or re-paying. NEVER charges again.
   * Returns Promise<void> so callers can `void purchase.retry()`.
   */
  retry: () => Promise<void>;
};

export function useNftPurchase(
  nftCanisterId: string | undefined,
): NftPurchaseHook {
  const actors = useActors();
  const { principal } = useAuth();

  const [state, setState] = useState<NftPurchaseState>({
    stage: "loading",
    saleInfo: null,
    balance: null,
    errorMessage: null,
    paid: false,
    lastTokenId: null,
  });

  // Guard against double-submit — also tracked in the state machine via
  // the 'processing' stage, but this ref prevents a second call sneaking in
  // between the setState and the first await.
  const inFlightRef = useRef(false);

  // Load sale info when the modal mounts (canisterId is known).
  useEffect(() => {
    if (!nftCanisterId) return;
    let cancelled = false;

    async function load() {
      setState({
        stage: "loading",
        saleInfo: null,
        balance: null,
        errorMessage: null,
        paid: false,
        lastTokenId: null,
      });
      try {
        const info = await actors.getAvailableToken(nftCanisterId!);
        if (cancelled) return;
        if (info.availableTokenIndex === undefined) {
          setState({
            stage: "soldout",
            saleInfo: info,
            balance: null,
            errorMessage: null,
            paid: false,
            lastTokenId: null,
          });
        } else {
          setState({
            stage: "confirm",
            saleInfo: info,
            balance: null,
            errorMessage: null,
            paid: false,
            lastTokenId: null,
          });
        }
      } catch {
        if (cancelled) return;
        setState({
          stage: "error",
          saleInfo: null,
          balance: null,
          errorMessage: "Couldn\u2019t load sale information. Please try again.",
          paid: false,
          lastTokenId: null,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftCanisterId]);

  const confirm = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!nftCanisterId) return;

    const principalText = principal?.toText() ?? null;
    if (!principalText) return; // caller must be authed

    const { saleInfo } = state;
    if (!saleInfo || saleInfo.availableTokenIndex === undefined) return;

    inFlightRef.current = true;
    setState((s) => ({
      ...s,
      stage: "processing",
      balance: null,
      errorMessage: null,
      paid: false,
      lastTokenId: null,
    }));

    try {
      // Step 1: balance pre-check
      const bal = await actors.getIcrc1Balance(
        TOKENS.ICP.canisterId,
        principalText,
      );
      if (bal < saleInfo.price + TOKENS.ICP.fee) {
        inFlightRef.current = false;
        setState((s) => ({ ...s, stage: "insufficient", balance: bal }));
        return;
      }

      // Step 2: build token identifier + buyer account
      const tokenId = extTokenIdentifier(
        nftCanisterId,
        Number(saleInfo.availableTokenIndex),
      );
      const buyerAccountIdHex = principalToAccountIdentifier(principalText);

      // Step 3: lock
      const lock = await actors.lockExtToken(
        nftCanisterId,
        tokenId,
        saleInfo.price,
        buyerAccountIdHex,
      );
      if (lock.__kind__ === "err") {
        const msg =
          lock.err.__kind__ === "Other"
            ? lock.err.Other
            : `Invalid token: ${lock.err.InvalidToken}`;
        inFlightRef.current = false;
        // paid=false: lock failed before any ICP left the wallet
        setState((s) => ({ ...s, stage: "error", errorMessage: msg, paid: false }));
        return;
      }

      const paymentAddressHex = lock.ok;

      // Step 4: transfer ICP
      const paymentBytes = accountIdBytesFromHex(paymentAddressHex);
      if (!paymentBytes) {
        inFlightRef.current = false;
        // paid=false: transfer never attempted
        setState((s) => ({
          ...s,
          stage: "error",
          errorMessage: "Invalid payment address returned by canister.",
          paid: false,
        }));
        return;
      }

      const pay = await actors.transferIcp(paymentBytes, saleInfo.price);
      if (pay.__kind__ === "Err") {
        inFlightRef.current = false;
        // paid=false: transfer returned an error, no ICP deducted
        setState((s) => ({
          ...s,
          stage: "error",
          errorMessage: "ICP transfer failed. Please try again.",
          paid: false,
        }));
        return;
      }

      // ── ICP HAS LEFT THE BUYER'S WALLET ──
      // Set paid=true and store tokenId BEFORE calling settle so that if
      // settle fails (or throws), retry() knows to skip lock/pay entirely.
      setState((s) => ({ ...s, paid: true, lastTokenId: tokenId }));

      // Step 5: settle
      const settle = await actors.settleExtToken(nftCanisterId, tokenId);
      if (settle.__kind__ === "err") {
        const msg =
          settle.err.__kind__ === "Other"
            ? settle.err.Other
            : `Settlement error: ${settle.err.InvalidToken}`;
        inFlightRef.current = false;
        // paid=true: ICP was transferred; settle-retry must NOT re-pay
        setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
        return;
      }

      inFlightRef.current = false;
      setState((s) => ({ ...s, stage: "success" }));
    } catch (e: unknown) {
      inFlightRef.current = false;
      const msg =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      // paid flag carries through from wherever the throw happened
      setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
    }
  }, [actors, nftCanisterId, principal, state]);

  /**
   * "Try again" — two paths based on whether ICP was already transferred:
   *
   *   paid=false → reset to confirm; the full lock→pay→settle will run again.
   *   paid=true  → retry settle ONLY on the stored tokenId. Never re-pays.
   */
  const retry = useCallback(async () => {
    const { paid, lastTokenId } = state;

    if (paid && lastTokenId && nftCanisterId) {
      // Post-payment settle retry — must not re-lock or re-pay.
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setState((s) => ({
        ...s,
        stage: "processing",
        errorMessage: null,
      }));
      try {
        const settle = await actors.settleExtToken(nftCanisterId, lastTokenId);
        if (settle.__kind__ === "err") {
          const msg =
            settle.err.__kind__ === "Other"
              ? settle.err.Other
              : `Settlement error: ${settle.err.InvalidToken}`;
          inFlightRef.current = false;
          // Still paid=true; user can retry settle again
          setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
          return;
        }
        inFlightRef.current = false;
        setState((s) => ({ ...s, stage: "success" }));
      } catch (e: unknown) {
        inFlightRef.current = false;
        const msg =
          e instanceof Error ? e.message : "An unexpected error occurred.";
        setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
      }
    } else {
      // Pre-payment error — safe to restart the full sequence.
      setState((s) => ({
        ...s,
        stage:
          s.saleInfo?.availableTokenIndex !== undefined ? "confirm" : "soldout",
        errorMessage: null,
        balance: null,
        paid: false,
        lastTokenId: null,
      }));
    }
  }, [actors, nftCanisterId, state]);

  return { ...state, confirm, retry };
}
