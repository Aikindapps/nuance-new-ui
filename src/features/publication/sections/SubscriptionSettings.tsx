import { useState, useId } from "react";
import Skeleton from "@mui/material/Skeleton";
import { Principal } from "@icp-sdk/core/principal";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useSubscriptionSettings } from "../hooks/useSubscriptionSettings";
import { useSubscriptionRates } from "../../article/purchase/useSubscriptionRates";
import { useToast } from "../../../services/toast/useToast";
import { manageSubscriptionsCopy as c } from "../../../constants/copy";
import {
  SubscriptionTimeInterval,
  type WriterSubscriptionDetails,
  type UpdateSubscriptionDetailsModel,
} from "../../../candid/Subscription/Subscription";
import type { UseMutationResult } from "@tanstack/react-query";

// Validate a principal-text string.
function isValidPrincipal(text: string): boolean {
  try {
    return Principal.fromText(text).toText() === text;
  } catch {
    return false;
  }
}

// Format an e8s fee string (optional) to a display decimal string, or "" if absent.
function feeToText(raw: string | undefined): string {
  if (!raw) return "";
  return parseFloat((Number(BigInt(raw)) / 1e8).toFixed(4)).toString();
}

// Plan configuration (display order matches Figma 1:42178).
const PLANS = [
  {
    interval: SubscriptionTimeInterval.Weekly,
    label: c.planWeekly,
    feeField: "weeklyFee" as const,
  },
  {
    interval: SubscriptionTimeInterval.Monthly,
    label: c.planMonthly,
    feeField: "monthlyFee" as const,
  },
  {
    interval: SubscriptionTimeInterval.Annually,
    label: c.planAnnually,
    feeField: "annuallyFee" as const,
  },
  {
    interval: SubscriptionTimeInterval.LifeTime,
    label: c.planLifetime,
    feeField: "lifeTimeFee" as const,
  },
] as const;

type PlanKey = "weekly" | "monthly" | "annually" | "lifetime";

const INTERVAL_TO_KEY: Record<SubscriptionTimeInterval, PlanKey> = {
  [SubscriptionTimeInterval.Weekly]: "weekly",
  [SubscriptionTimeInterval.Monthly]: "monthly",
  [SubscriptionTimeInterval.Annually]: "annually",
  [SubscriptionTimeInterval.LifeTime]: "lifetime",
};

type PlanState = {
  enabled: boolean;
  amountText: string;
};

type FormState = Record<PlanKey, PlanState>;

function initFormState(details: WriterSubscriptionDetails): FormState {
  return {
    weekly: {
      enabled: !!details.weeklyFee,
      amountText: feeToText(details.weeklyFee),
    },
    monthly: {
      enabled: !!details.monthlyFee,
      amountText: feeToText(details.monthlyFee),
    },
    annually: {
      enabled: !!details.annuallyFee,
      amountText: feeToText(details.annuallyFee),
    },
    lifetime: {
      enabled: !!details.lifeTimeFee,
      amountText: feeToText(details.lifeTimeFee),
    },
  };
}

// Build a synthetic WriterSubscriptionDetails from current form state so
// useSubscriptionRates can compute live conversions.
function buildSyntheticDetails(form: FormState): WriterSubscriptionDetails {
  function toE8sString(key: PlanKey): string | undefined {
    const { enabled, amountText } = form[key];
    const n = parseFloat(amountText);
    if (!enabled || !amountText || isNaN(n) || n <= 0) return undefined;
    return String(Math.round(n * 1e8));
  }
  return {
    weeklyFee: toE8sString("weekly"),
    monthlyFee: toE8sString("monthly"),
    annuallyFee: toE8sString("annually"),
    lifeTimeFee: toE8sString("lifetime"),
    paymentReceiverPrincipalId: "",
    writerPrincipalId: "",
    writerSubscriptions: [],
    stripePricing: [],
    isSubscriptionActive: false,
    stripeIsActive: false,
  } as unknown as WriterSubscriptionDetails;
}

// Individual plan card — Figma 1:42178.
function PlanCard({
  label,
  state,
  onToggle,
  onAmountChange,
  conversionLines,
}: {
  label: string;
  state: PlanState;
  onToggle: () => void;
  onAmountChange: (v: string) => void;
  conversionLines: string[];
}) {
  const inputId = useId();
  const errorId = useId();
  const enabled = state.enabled;

  // Per-plan amount validation: only flag when enabled.
  const amountN = parseFloat(state.amountText);
  const amountInvalid =
    enabled &&
    (state.amountText === "" || isNaN(amountN) || amountN <= 0);

  // Active card has brand-purple border; disabled card has ink-border dimmed.
  const cardBorder = enabled
    ? "border-[color:rgba(84,5,212,0.4)]"
    : "border-ink-border/20";

  return (
    <div
      className={`flex flex-col gap-[calc(16*var(--fpx))] rounded-[calc(16*var(--fpx))] border p-[calc(40*var(--fpx))_calc(32*var(--fpx))] ${cardBorder}`}
    >
      {/* Label + amount row */}
      <div className="flex flex-col gap-[calc(8*var(--fpx))]">
        <span
          className="text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-ink"
          style={{ opacity: 1 }}
        >
          {label}
        </span>
        <div className="flex flex-row items-center gap-[calc(8*var(--fpx))]">
          {/* Amount input */}
          <label htmlFor={inputId} className="sr-only">
            {c.amountLabel}
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            disabled={!enabled}
            value={state.amountText}
            placeholder="0"
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d{0,8}$/.test(v)) onAmountChange(v);
            }}
            aria-label={`${label} ${c.amountLabel} in ${c.unit}`}
            aria-invalid={amountInvalid}
            aria-describedby={errorId}
            className={`w-[calc(62*var(--fpx))] rounded-[calc(6*var(--fpx))] border px-[calc(16*var(--fpx))] py-[calc(10*var(--fpx))] text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink focus:border-brand-purple focus:outline-none ${
              enabled
                ? "border-[color:rgba(55,58,73,0.1)] bg-[rgba(55,58,73,0.05)]"
                : "border-transparent bg-[rgba(55,58,73,0.05)] text-ink/40"
            }`}
          />
          {/* NUA unit label */}
          <span
            className="text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-ink"
            style={{ opacity: 0.6 }}
          >
            {c.unit}
          </span>
        </div>
        {/* Per-plan amount error — mirrors WithdrawModal pattern */}
        <p
          id={errorId}
          className="text-label text-error empty:hidden"
        >
          {amountInvalid ? c.errorAmount : ""}
        </p>
      </div>

      {/* Conversion lines */}
      <div
        className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink"
        style={{ opacity: 0.6 }}
        aria-live="polite"
      >
        {conversionLines.length > 0 ? (
          conversionLines.map((line, i) => <div key={i}>{line}</div>)
        ) : (
          // Reserve the same vertical space so the card height is stable.
          <div className="invisible" aria-hidden="true">
            {"\u00a0"}
          </div>
        )}
      </div>

      {/* Enable/disable toggle — Figma NUR/Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label} plan`}
        onClick={onToggle}
        className="w-[calc(24*var(--fpx))] flex-shrink-0 self-start"
      >
        {enabled ? (
          /* State=Selected — fill #5405D4, white handle right */
          <span
            className="relative inline-flex h-[calc(16*var(--fpx))] w-[calc(24*var(--fpx))] items-center rounded-full"
            style={{ backgroundColor: "#5405D4" }}
          >
            <span
              className="absolute right-[calc(3*var(--fpx))] h-[calc(10*var(--fpx))] w-[calc(10*var(--fpx))] rounded-full bg-white"
            />
          </span>
        ) : (
          /* State=Deselected — transparent bg, border, dark handle left */
          <span
            className="relative inline-flex h-[calc(16*var(--fpx))] w-[calc(24*var(--fpx))] items-center rounded-full"
            style={{
              border: "1px solid rgba(32,33,35,0.6)",
              backgroundColor: "transparent",
            }}
          >
            <span
              className="absolute left-[calc(3*var(--fpx))] h-[calc(10*var(--fpx))] w-[calc(10*var(--fpx))] rounded-full"
              style={{ backgroundColor: "rgba(32,33,35,0.6)" }}
            />
          </span>
        )}
      </button>
    </div>
  );
}

// The inner form — receives details + canisterId + save as props (no hook call here).
function SubscriptionSettingsForm({
  canisterId,
  initialDetails,
  save,
}: {
  canisterId: string;
  initialDetails: WriterSubscriptionDetails;
  save: UseMutationResult<WriterSubscriptionDetails, Error, UpdateSubscriptionDetailsModel>;
}) {
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() =>
    initFormState(initialDetails),
  );
  const [paymentAddress, setPaymentAddress] = useState(() => {
    const p = initialDetails.paymentReceiverPrincipalId;
    return isValidPrincipal(p) ? p : "";
  });

  // Build synthetic details for live conversion lines.
  const syntheticDetails = buildSyntheticDetails(form);
  const rates = useSubscriptionRates(syntheticDetails);

  // Validation.
  const paymentTrimmed = paymentAddress.trim();
  const paymentValid = paymentTrimmed !== "" && isValidPrincipal(paymentTrimmed);

  const anyEnabled =
    form.weekly.enabled ||
    form.monthly.enabled ||
    form.annually.enabled ||
    form.lifetime.enabled;

  // When all plans are OFF, fall back to the on-record receiver so re-enabling
  // later preserves routing without forcing a re-entry of the address.
  const effectiveReceiver: string | null = paymentValid
    ? paymentTrimmed
    : !anyEnabled && isValidPrincipal(initialDetails.paymentReceiverPrincipalId)
      ? initialDetails.paymentReceiverPrincipalId
      : null;

  const enabledAmountsValid = PLANS.every(({ feeField: _field }) => {
    // Map feeField to plan key.
    const key = _field === "weeklyFee"
      ? "weekly"
      : _field === "monthlyFee"
        ? "monthly"
        : _field === "annuallyFee"
          ? "annually"
          : "lifetime";
    const { enabled, amountText } = form[key as PlanKey];
    if (!enabled) return true;
    const n = parseFloat(amountText);
    return amountText !== "" && !isNaN(n) && n > 0;
  });

  const canSave =
    enabledAmountsValid &&
    !save.isPending &&
    (anyEnabled ? paymentValid : effectiveReceiver !== null);

  function handleToggle(key: PlanKey) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  }

  function handleAmountChange(key: PlanKey, v: string) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], amountText: v },
    }));
  }

  function handleSave() {
    if (!canSave) return;

    function toE8s(key: PlanKey): bigint | undefined {
      const { enabled, amountText } = form[key];
      const n = parseFloat(amountText);
      if (!enabled || !amountText || isNaN(n) || n <= 0) return undefined;
      return BigInt(Math.round(n * 1e8));
    }

    const model: UpdateSubscriptionDetailsModel = {
      weeklyFee: toE8s("weekly"),
      monthlyFee: toE8s("monthly"),
      annuallyFee: toE8s("annually"),
      lifeTimeFee: toE8s("lifetime"),
      publicationInformation: [
        Principal.fromText(effectiveReceiver as string),
        canisterId,
      ],
    };

    save.mutate(model, {
      onSuccess: () => toast.show(c.saveSuccess, "success"),
      onError: (e: unknown) => {
        const msg =
          e instanceof Error ? e.message : c.saveError;
        toast.show(msg || c.saveError, "error");
      },
    });
  }

  // Build conversion line strings per interval.
  function conversionLines(interval: SubscriptionTimeInterval): string[] {
    const plan = rates[interval];
    if (!plan) return [];
    return [plan.icpLine, plan.ckBtcLine, plan.usdLine].filter(
      (l): l is string => l !== null,
    );
  }

  return (
    <div className="flex flex-col gap-[calc(24*var(--fpx))]">
      {/* Intro text */}
      <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink" style={{ opacity: 0.8 }}>
        {c.intro}
      </p>

      {/* 4-card grid */}
      <div className="grid grid-cols-2 gap-[calc(16*var(--fpx))] lg:grid-cols-4">
        {PLANS.map(({ interval, label }) => {
          const key = INTERVAL_TO_KEY[interval];
          return (
            <PlanCard
              key={interval}
              label={label}
              state={form[key]}
              onToggle={() => handleToggle(key)}
              onAmountChange={(v) => handleAmountChange(key, v)}
              conversionLines={conversionLines(interval)}
            />
          );
        })}
      </div>

      {/* Payment address sub-section — Figma 1081:7119; shown only when ≥1 plan is enabled */}
      {anyEnabled && (
        <div className="flex flex-col gap-[calc(24*var(--fpx))]">
          {/* Payment address header: heading + section-level help */}
          <div className="flex flex-col gap-[calc(8*var(--fpx))]">
            <p className="text-[length:calc(22*var(--fpx))] leading-[calc(32*var(--fpx))] text-ink-80">
              {c.paymentHeading}
            </p>
            <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-80">
              {c.paymentSectionHelp}
            </p>
          </div>

          {/* Receiving principal field frame — gap 6 per design context */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              htmlFor="subscription-payment-address"
              className="text-label font-bold text-ink"
            >
              {c.paymentFieldLabel}
            </label>
            {/* Persistent grey helper ABOVE the input */}
            <p className="text-label text-ink-80">
              {paymentTrimmed === ""
                ? c.paymentHelperRequired
                : c.paymentHelperDefault}
            </p>
            <input
              id="subscription-payment-address"
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={paymentAddress}
              placeholder={c.paymentPlaceholder}
              onChange={(e) => setPaymentAddress(e.target.value)}
              aria-invalid={paymentTrimmed !== "" && !paymentValid}
              aria-describedby="subscription-payment-address-error"
              className="rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink focus:border-brand-purple focus:outline-none"
            />
            {/* Error info-slot BELOW the input; empty collapses */}
            <p
              id="subscription-payment-address-error"
              className="text-label text-error empty:hidden"
            >
              {paymentTrimmed !== "" && !paymentValid
                ? c.errorPaymentInvalid
                : ""}
            </p>
          </div>

          {/* Split-model help */}
          <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-80">
            {c.paymentSplitHelp}
          </p>
        </div>
      )}

      {/* Save button */}
      <div className="flex">
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          {save.isPending ? c.saving : c.saveLabel}
        </button>
      </div>
    </div>
  );
}

// Public section component — calls useSubscriptionSettings once, gates on
// loading/error, then passes data + save mutation down to the form.
export function SubscriptionSettings({ handle }: { handle: string }) {
  const { canisterId, details, isLoading, isError, save } =
    useSubscriptionSettings(handle);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton variant="text" sx={{ width: "60%", height: 28 }} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={300} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || canisterId == null || details == null) {
    return (
      <CenteredMessage
        heading={
          canisterId == null
            ? "Publication not found"
            : c.loadErrorHeading
        }
        body={
          canisterId == null
            ? "We couldn\u2019t find a publication matching this handle."
            : c.loadErrorBody
        }
      />
    );
  }

  return (
    <SubscriptionSettingsForm
      canisterId={canisterId}
      initialDetails={details}
      save={save}
    />
  );
}
