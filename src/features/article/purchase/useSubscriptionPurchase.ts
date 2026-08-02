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

export type SubscriptionPurchaseStage =
  | "loading"
  | "noplans"
  | "confirm"
  | "processing"
  | "success"
  | "insufficient"
  | "error";

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
};

export type SubscriptionPurchaseHook = SubscriptionPurchaseState & {
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
  isPublication: boolean;
  /** Publication or author handle — used to look up the pub canister principal. */
  handle: string;
  /** Creator's principal text — used directly for author (non-pub) subscriptions. */
  creatorPrincipal: string;
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
  isPublication,
  handle,
  creatorPrincipal,
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
      });

      try {
        // Step 1: resolve the writer principal ID.
        let writerId: string | null = null;

        if (isPublication) {
          const cans = await actors.getPublicationCanisters();
          const match = cans.find(
            ([h]) => h.toLowerCase() === handle.toLowerCase(),
          );
          writerId = match?.[1] ?? null;
        } else {
          writerId = creatorPrincipal;
        }

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
          setState((s) => ({
            ...s,
            stage: "error",
            writerPrincipalId: writerId,
            errorMessage: result.err || "Couldn\u2019t load subscription details.",
          }));
          return;
        }

        const details = result.ok;

        if (!hasAnyPlan(details)) {
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
  }, [isPublication, handle, creatorPrincipal]);

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

  return { ...state, select, confirm, retry };
}
