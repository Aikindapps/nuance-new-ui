import { useCallback, useEffect, useRef, useState } from "react";
import { Principal } from "@icp-sdk/core/principal";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { useFreeNuaBalance } from "../../wallet/hooks/useFreeNuaBalance";
import { TOKENS, NUA_LEDGER_CANISTER_ID } from "../../../config/tokens";
import { transferErrText } from "../../wallet/lib/transferErrText";
import type {
  WriterSubscriptionDetails,
} from "../../../candid/Subscription/Subscription";
import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";
import canisterIds from "../../../config/canister_ids.json";
import { subscriptionPurchaseCopy } from "../../../constants/copy";
import {
  cardTiers,
  createCardCheckout,
  openCheckoutTab,
  type CardTier,
} from "./cardCheckout";

const SUBSCRIPTION_CANISTER_ID: string = canisterIds.Subscription.ic;

// State machine for the subscription purchase flow (NIC-129 §3.5/§3.6).
//
// loading       → confirm | noplans | error   (on mount, after resolving writer + loading plans)
// noplans       → closed                       (author has no active plan)
// confirm       → processing                   (reader selects a plan + checks terms)
// processing    → success | insufficient | error
// insufficient  → closed / /wallet
// error (paid=false) → confirm (retry)
// error (paid=true)  → closed ONLY (funds being auto-returned — no retry)
// success       → closed / read article
//
// Card path (NIC-621, publications only; frames 3085:11951 / 3088:12960 /
// 3089:12973 / 3089:12982):
// confirm (method=card) → redirecting       (Continue to payment; Stripe tab opened)
// redirecting           → closed            (checkout URL loaded in the Stripe tab)
//                       → alreadySubscribed (server 409)
//                       → checkoutError     (server unreachable / any other failure)
// checkoutError         → redirecting (Try again) | confirm, method=wallet (Pay with wallet)

export type SubscriptionPurchaseStage =
  | "loading"
  | "noplans"
  | "confirm"
  | "processing"
  | "success"
  | "insufficient"
  | "error"
  | "redirecting"
  | "alreadySubscribed"
  | "checkoutError";

/** Which picker the confirm screen shows (tabs only when both exist, D-168). */
export type PaymentMethodTab = "wallet" | "card";

export type SubscriptionPurchaseState = {
  stage: SubscriptionPurchaseStage;
  /** The resolved writer subscription plan details (populated after loading). */
  details: WriterSubscriptionDetails | null;
  /** Resolved writer principal ID (either creatorPrincipal or the pub canister ID). */
  writerPrincipalId: string | null;
  /** The interval the reader has selected on the confirm screen. */
  selected: SubscriptionTimeInterval | null;
  /**
   * Reader's total spendable NUA (regular + restricted), e8s bigint.
   * Populated only in the insufficient state so the modal can display it.
   */
  balance: bigint | null;
  errorMessage: string | null;
  /**
   * True when regular NUA has left the reader's wallet.
   * If error is reached with paid=true, the retry action is suppressed
   * (funds are being auto-returned by pendingStuckTokensHeartbeatExternal).
   */
  paid: boolean;
  /** Picker shown on the confirm screen. */
  method: PaymentMethodTab;
  /** The card plan the reader has selected (card picker). */
  cardSelected: SubscriptionTimeInterval | null;
};

export type SubscriptionPurchaseHook = SubscriptionPurchaseState & {
  /** Card plans on offer (publications with an active Stripe account only). */
  cardPlans: CardTier[];
  /** True when the writer/publication has at least one wallet (NUA) plan. */
  hasWalletPlans: boolean;
  /** Switch the confirm screen's picker (tab bar). */
  setMethod: (method: PaymentMethodTab) => void;
  /** Pick a plan on the card picker. */
  selectCard: (interval: SubscriptionTimeInterval) => void;
  /**
   * Continue to payment (card). MUST be called synchronously from the click
   * handler: it opens the Stripe tab before its first await. Resolves true
   * once Stripe is loading in that tab (the caller closes the modal).
   */
  startCardCheckout: () => Promise<boolean>;
  /** "Pay with wallet" on a card error: back to the picker, wallet tab. */
  payWithWallet: () => void;
  /** Pick a plan interval on the confirm screen. */
  select: (interval: SubscriptionTimeInterval) => void;
  /** Execute the full payment sequence. Call with terms checked and a plan selected. */
  confirm: () => Promise<void>;
  /**
   * "Try again" — only valid when paid=false.
   * Resets to confirm stage keeping existing details/writerPrincipalId/selected.
   * MUST NOT be called when paid=true (funds already moved; race with refund).
   */
  retry: () => void;
};

type Props = {
  /**
   * The subscription writer/target principal, taken from the post's
   * `postOwnerPrincipal`: the writer's principal for a personal post, or the
   * publication canister id for a publication post. This is exactly the id the
   * backend keys subscriptions on (isReaderSubscriber(postOwnerPrincipal, …)).
   */
  writerPrincipalId: string;
  /**
   * Card payments are offered for publications only (NIC-616 scope; an
   * individual writer's card path is NIC-619).
   */
  isPublication?: boolean;
};

// Map a SubscriptionTimeInterval to the WriterSubscriptionDetails fee field.
function intervalFeeField(
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

// Determine whether WriterSubscriptionDetails has at least one active plan.
function hasAnyPlan(details: WriterSubscriptionDetails): boolean {
  return (
    details.weeklyFee !== undefined ||
    details.monthlyFee !== undefined ||
    details.annuallyFee !== undefined ||
    details.lifeTimeFee !== undefined
  );
}

export function useSubscriptionPurchase({
  writerPrincipalId,
  isPublication = false,
}: Props): SubscriptionPurchaseHook {
  const actors = useActors();
  const { principal } = useAuth();
  const freeNua = useFreeNuaBalance();

  const [state, setState] = useState<SubscriptionPurchaseState>({
    stage: "loading",
    details: null,
    writerPrincipalId: null,
    selected: null,
    balance: null,
    errorMessage: null,
    paid: false,
    method: "wallet",
    cardSelected: null,
  });

  // Double-submit guard (mirrors useNftPurchase).
  const inFlightRef = useRef(false);

  // ── LOAD EFFECT ──────────────────────────────────────────────────────────
  // Runs once on mount: resolve writerPrincipalId then fetch plan details.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({
        stage: "loading",
        details: null,
        writerPrincipalId: null,
        selected: null,
        balance: null,
        errorMessage: null,
        paid: false,
        method: "wallet",
        cardSelected: null,
      });

      try {
        // Step 1: the subscribe target is the post's postOwnerPrincipal, passed
        // straight through (writer principal for a personal post; publication
        // canister id for a publication post).
        const writerId = writerPrincipalId;

        if (!writerId) {
          if (cancelled) return;
          setState((s) => ({
            ...s,
            stage: "error",
            errorMessage: "Couldn\u2019t load subscription details.",
          }));
          return;
        }

        // Step 2: fetch the writer's subscription plan.
        const result =
          await actors.getWriterSubscriptionDetailsByPrincipalId(writerId);

        if (cancelled) return;

        if (result.__kind__ === "err") {
          // The only `err` this query returns is a missing subscription record,
          // i.e. the writer has not configured any plans — surface the graceful
          // no-plans state, not the payment-error state (whose "Try again" is
          // futile at load time, before any payment has been attempted).
          setState((s) => ({
            ...s,
            stage: "noplans",
            writerPrincipalId: writerId,
          }));
          return;
        }

        const details = result.ok;
        const hasCard = isPublication && cardTiers(details).length > 0;

        if (!hasAnyPlan(details) && !hasCard) {
          setState((s) => ({
            ...s,
            stage: "noplans",
            details,
            writerPrincipalId: writerId,
          }));
          return;
        }

        setState((s) => ({
          ...s,
          stage: "confirm",
          details,
          writerPrincipalId: writerId,
          // Wallet first when it exists (today's default); card-only → card.
          method: hasAnyPlan(details) ? "wallet" : "card",
        }));
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error
            ? e.message
            : "Couldn\u2019t load subscription details.";
        setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writerPrincipalId, isPublication]);

  // ── SELECT ───────────────────────────────────────────────────────────────
  const select = useCallback((interval: SubscriptionTimeInterval) => {
    setState((s) => ({ ...s, selected: interval }));
  }, []);

  // ── CONFIRM ──────────────────────────────────────────────────────────────
  const confirm = useCallback(async () => {
    if (inFlightRef.current) return;

    const { selected, writerPrincipalId, details } = state;
    const principalText = principal?.toText() ?? null;

    if (!selected || !principalText || !writerPrincipalId || !details) return;

    // Raw fee string → e8s bigint.
    const rawFee = details[intervalFeeField(selected)];
    if (!rawFee) return;
    const amount = BigInt(rawFee);

    inFlightRef.current = true;
    setState((s) => ({
      ...s,
      stage: "processing",
      balance: null,
      errorMessage: null,
      paid: false,
    }));

    try {
      // ── STEP 1: balance pre-check ─────────────────────────────────────
      const regular = await actors.getIcrc1Balance(
        NUA_LEDGER_CANISTER_ID,
        principalText,
      );
      const restricted = freeNua.data ?? 0n;
      const spendable = regular + restricted;

      if (spendable < amount + TOKENS.NUA.fee) {
        inFlightRef.current = false;
        setState((s) => ({
          ...s,
          stage: "insufficient",
          balance: spendable,
        }));
        return;
      }

      // ── STEP 2: create payment request ───────────────────────────────
      const pr = await actors.createPaymentRequestAsReader(
        writerPrincipalId,
        selected,
        amount,
      );

      if (pr.__kind__ === "err") {
        inFlightRef.current = false;
        setState((s) => ({
          ...s,
          stage: "error",
          paid: false,
          errorMessage: pr.err || "Failed to create payment request.",
        }));
        return;
      }

      const paymentFee = BigInt(pr.ok.paymentFee);
      const subaccount = pr.ok.subaccount;
      const eventId = pr.ok.subscriptionEventId;

      // ── STEP 3: route by available restricted NUA ─────────────────────
      const restrictedUsed = restricted > 1_000_000n;
      // details2 is set to a truthy value on any successful completion path.
      // We use `unknown` here to avoid a type clash between the Subscription
      // binding's ReaderSubscriptionDetails and the User binding's variant
      // (they differ in stripePricing/stripeIsActive on WriterSubscriptionDetails).
      let details2: unknown = null;

      if (restrictedUsed && restricted >= paymentFee + 1_000_000n) {
        // Pure restricted NUA path.
        const r = await actors.spendRestrictedTokensForSubscription(
          eventId,
          paymentFee,
        );
        if (r.__kind__ === "ok") {
          details2 = r.ok;
        } else {
          inFlightRef.current = false;
          setState((s) => ({
            ...s,
            stage: "error",
            paid: false,
            errorMessage: r.err || "Subscription failed.",
          }));
          return;
        }
      } else if (restrictedUsed) {
        // Mixed path: regular NUA covers the remainder after restricted.
        const regularAmt = paymentFee - restricted + 1_000_000n;
        const t = await actors.transferIcrc1(
          NUA_LEDGER_CANISTER_ID,
          {
            owner: Principal.fromText(SUBSCRIPTION_CANISTER_ID),
            subaccount,
          },
          regularAmt,
          TOKENS.NUA.fee,
        );

        if (t.__kind__ === "Err") {
          inFlightRef.current = false;
          setState((s) => ({
            ...s,
            stage: "error",
            paid: false,
            errorMessage: transferErrText(t.Err),
          }));
          return;
        }

        // Regular NUA has left the wallet.
        setState((s) => ({ ...s, paid: true }));

        const r = await actors.spendRestrictedTokensForSubscription(
          eventId,
          restricted - 1_000_000n,
        );

        if (r.__kind__ === "ok") {
          details2 = r.ok;
        } else {
          // Post-payment failure: trigger recovery and surface error.
          void actors.pendingStuckTokensHeartbeatExternal();
          inFlightRef.current = false;
          setState((s) => ({
            ...s,
            stage: "error",
            paid: true,
            errorMessage: r.err || "Subscription could not be finalised.",
          }));
          return;
        }
      } else {
        // Pure regular NUA path.
        const t = await actors.transferIcrc1(
          NUA_LEDGER_CANISTER_ID,
          {
            owner: Principal.fromText(SUBSCRIPTION_CANISTER_ID),
            subaccount,
          },
          paymentFee,
          TOKENS.NUA.fee,
        );

        if (t.__kind__ === "Err") {
          inFlightRef.current = false;
          setState((s) => ({
            ...s,
            stage: "error",
            paid: false,
            errorMessage: transferErrText(t.Err),
          }));
          return;
        }

        // Regular NUA has left the wallet.
        setState((s) => ({ ...s, paid: true }));

        const r = await actors.completeSubscriptionEvent(eventId);

        if (r.__kind__ === "ok") {
          details2 = r.ok;
        } else {
          // Post-payment failure: trigger recovery.
          void actors.pendingStuckTokensHeartbeatExternal();
          inFlightRef.current = false;
          setState((s) => ({
            ...s,
            stage: "error",
            paid: true,
            errorMessage: r.err || "Subscription could not be finalised.",
          }));
          return;
        }
      }

      // ── STEP 4: success ──────────────────────────────────────────────
      if (details2) {
        // Fire-and-forget disperse (canister splits the fee to the writer).
        void actors.disperseTokensForSuccessfulSubscription(eventId);
        inFlightRef.current = false;
        setState((s) => ({ ...s, stage: "success" }));
      }
    } catch (e: unknown) {
      inFlightRef.current = false;
      const msg =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      // paid flag is carried from wherever the throw happened (set in state already).
      setState((s) => ({ ...s, stage: "error", errorMessage: msg }));
    }
  }, [actors, freeNua.data, principal, state]);

  // ── RETRY ────────────────────────────────────────────────────────────────
  // Only valid when paid=false. When paid=true the error is terminal — the
  // user's only action is Close (the modal renders no Try Again button in
  // that case). This diverges from the NFT flow deliberately: a second
  // completeSubscriptionEvent call could race with the auto-refund.
  const retry = useCallback(() => {
    setState((s) => {
      if (s.paid) return s; // Guard: never reset a paid error.
      return {
        ...s,
        stage: "confirm",
        errorMessage: null,
        balance: null,
      };
    });
  }, []);

  // ── CARD (NIC-621) ───────────────────────────────────────────────────────
  const cardPlans = isPublication ? cardTiers(state.details) : [];
  const hasWalletPlans = state.details !== null && hasAnyPlan(state.details);

  const setMethod = useCallback((method: PaymentMethodTab) => {
    setState((s) => (s.stage === "confirm" ? { ...s, method } : s));
  }, []);

  const selectCard = useCallback((interval: SubscriptionTimeInterval) => {
    setState((s) => ({ ...s, cardSelected: interval }));
  }, []);

  const payWithWallet = useCallback(() => {
    setState((s) => ({
      ...s,
      stage: "confirm",
      method: "wallet",
      errorMessage: null,
    }));
  }, []);

  const startCardCheckout = useCallback((): Promise<boolean> => {
    if (inFlightRef.current) return Promise.resolve(false);
    const { cardSelected, writerPrincipalId, details } = state;
    const readerId = principal?.toText() ?? null;
    const tier = cardTiers(details).find((t) => t.interval === cardSelected);
    if (!isPublication || !tier || !readerId || !writerPrincipalId) {
      return Promise.resolve(false);
    }

    inFlightRef.current = true;
    // Synchronous, inside the click: the browser allows this tab.
    const tab = openCheckoutTab(subscriptionPurchaseCopy.card.redirectingTitle);
    setState((s) => ({ ...s, stage: "redirecting", errorMessage: null }));

    return (async () => {
      const res = await createCardCheckout({
        authorize: actors.authorizeForProxy,
        priceId: tier.priceId,
        writerId: writerPrincipalId,
        readerId,
      });
      inFlightRef.current = false;

      if (res.kind === "url") {
        if (tab && !tab.closed) {
          tab.location.href = res.url;
        } else {
          // Tab blocked or closed by the reader: continue in this tab.
          window.location.assign(res.url);
        }
        return true;
      }

      if (tab && !tab.closed) tab.close();
      setState((s) => ({
        ...s,
        stage: res.kind === "already" ? "alreadySubscribed" : "checkoutError",
        errorMessage: res.kind === "error" ? res.message : null,
      }));
      return false;
    })();
  }, [actors, isPublication, principal, state]);

  return {
    ...state,
    select,
    confirm,
    retry,
    cardPlans,
    hasWalletPlans,
    setMethod,
    selectCard,
    startCardCheckout,
    payWithWallet,
  };
}
