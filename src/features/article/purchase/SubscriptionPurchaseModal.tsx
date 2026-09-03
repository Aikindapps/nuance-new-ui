import { useState } from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { Popup } from "../../../components/ui/Popup";
import { IconPartySuccess } from "../../../components/ui/icons/IconPartySuccess";
import { subscriptionPurchaseCopy } from "../../../constants/copy";
import { primaryButtonSx, secondaryButtonSx } from "../../../components/ui/modalButtons";
import { useSubscriptionPurchase } from "./useSubscriptionPurchase";
import { useSubscriptionRates } from "./useSubscriptionRates";
import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";
import type { WriterSubscriptionDetails } from "../../../candid/Subscription/Subscription";

export const SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID =
  "subscription-purchase-modal-title";

// ── Shared helpers (mirrors NftPurchaseModal) ──────────────────────────────

function Spinner() {
  return (
    <div className="relative mx-auto my-6 size-16">
      <svg
        className="absolute inset-0 size-16"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="rgba(55,58,73,0.10)"
          strokeWidth="6"
        />
      </svg>
      <svg
        className="absolute inset-0 size-16 animate-spin"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="#5405D4"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="182"
          strokeDashoffset="145"
        />
      </svg>
    </div>
  );
}

type SummaryCardProps = { rows: [string, string][]; className?: string };

function SummaryCard({ rows, className }: SummaryCardProps) {
  return (
    <div
      className={`flex flex-col rounded-card bg-[rgba(55,58,73,0.05)] ${className ?? ""}`}
    >
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-body text-ink">{label}</span>
          <span className="text-body text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FooterRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">{children}</div>
  );
}

// ── Plan display helpers ───────────────────────────────────────────────────

const INTERVAL_LABELS: Record<SubscriptionTimeInterval, string> = {
  [SubscriptionTimeInterval.Weekly]: subscriptionPurchaseCopy.intervalWeek,
  [SubscriptionTimeInterval.Monthly]: subscriptionPurchaseCopy.intervalMonth,
  [SubscriptionTimeInterval.Annually]: subscriptionPurchaseCopy.intervalYear,
  [SubscriptionTimeInterval.LifeTime]: subscriptionPurchaseCopy.intervalLifetime,
};

// All intervals in display order (mirrors the Figma plan card sequence).
const ORDERED_INTERVALS = [
  SubscriptionTimeInterval.Weekly,
  SubscriptionTimeInterval.Monthly,
  SubscriptionTimeInterval.Annually,
  SubscriptionTimeInterval.LifeTime,
] as const;

// Map interval → fee field.
function feeField(
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

// Display-format a raw e8s fee string (strips trailing zeros from 4 dp).
function fmtNua(rawE8s: string): string {
  const n = Number(BigInt(rawE8s)) / 1e8;
  return parseFloat(n.toFixed(4)).toString();
}

// Map a selected interval to the period phrase used in the success body.
// Weekly→"the coming week", Monthly→"the coming month", Annually→"the coming year",
// LifeTime→"life" (special-cased: "for life" not "for the coming life").
function periodPhrase(interval: SubscriptionTimeInterval): string {
  switch (interval) {
    case SubscriptionTimeInterval.Weekly:
      return "the coming week";
    case SubscriptionTimeInterval.Monthly:
      return "the coming month";
    case SubscriptionTimeInterval.Annually:
      return "the coming year";
    case SubscriptionTimeInterval.LifeTime:
      return "life";
  }
}

// ── Modal props ────────────────────────────────────────────────────────────

type Props = {
  isPublication: boolean;
  handle: string;
  writerPrincipalId: string;
  onClose: () => void;
};

// ── Main component ─────────────────────────────────────────────────────────

export function SubscriptionPurchaseModal({
  isPublication,
  handle,
  writerPrincipalId,
  onClose,
}: Props) {
  const purchase = useSubscriptionPurchase({ writerPrincipalId });
  const navigate = useNavigate();
  const [terms, setTerms] = useState(false);

  const c = subscriptionPurchaseCopy;
  const variant = isPublication ? c.pub : c.author;

  const isProcessing = purchase.stage === "processing";

  // Non-dismissable while processing (same pattern as NftPurchaseModal).
  const handleClose = isProcessing ? () => undefined : onClose;

  // Formatted amount for the selected plan (used in processing copy).
  const selectedRawFee =
    purchase.selected && purchase.details
      ? purchase.details[feeField(purchase.selected)]
      : undefined;
  const selectedDisplay = selectedRawFee ? fmtNua(selectedRawFee) : "";

  // Title driven by stage. "noplans" → c.noPlansTitle; "confirm" → variant.confirmTitle.
  const title =
    purchase.stage === "loading"
      ? ""
      : purchase.stage === "noplans"
        ? c.noPlansTitle
        : purchase.stage === "confirm"
          ? variant.confirmTitle
          : purchase.stage === "processing"
            ? c.processingTitle
            : purchase.stage === "success"
              ? variant.successTitle
              : purchase.stage === "insufficient"
                ? c.insufficientTitle
                : purchase.stage === "error"
                  ? c.errorTitle
                  : "";

  // Rates for conversion lines on the confirm screen.
  const rates = useSubscriptionRates(
    purchase.stage === "confirm" ? purchase.details : null,
  );

  return (
    <Popup
      titleId={SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID}
      title={title}
      onClose={handleClose}
      closeAriaLabel={c.closeAria}
    >
      {/* ── LOADING ── */}
      {purchase.stage === "loading" && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}

      {/* ── NO PLANS ── */}
      {purchase.stage === "noplans" && (
        <>
          <div className="mt-6">
            <p className="text-body text-ink">{c.noPlansBody}</p>
          </div>
          <FooterRow>
            <Button variant="contained" onClick={onClose} sx={primaryButtonSx}>
              {c.noPlansClose}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── CONFIRM (frames 1:6561 / 1:6792) ── */}
      {purchase.stage === "confirm" && purchase.details && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {/* Intro paragraph */}
            <p className="text-body text-ink">{variant.confirmIntro}</p>

            {/* Duration label */}
            <p className="text-body font-medium text-ink">
              {c.confirmDurationLabel}
            </p>

            {/* Plan cards — 4-col grid; wraps gracefully if fewer plans */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ORDERED_INTERVALS.map((interval) => {
                const raw = purchase.details![feeField(interval)];
                if (!raw) return null;
                const isSelected = purchase.selected === interval;
                const planRates = rates[interval];

                return (
                  <div
                    key={interval}
                    className={[
                      "flex flex-col gap-4 rounded-2xl p-8 transition-colors",
                      isSelected
                        ? "border border-[#5405D4] bg-[rgba(84,5,212,0.05)]"
                        : "border border-[rgba(84,5,212,0.40)]",
                    ].join(" ")}
                  >
                    {/* Plan label + NUA price */}
                    <div className="flex flex-col gap-2">
                      <span className="text-body font-medium text-ink">
                        {INTERVAL_LABELS[interval]}
                      </span>
                      <span className="text-[22px] font-bold leading-8 text-ink">
                        {fmtNua(raw)} NUA
                      </span>
                    </div>

                    {/* Conversion sub-lines (Figma: 400 16/24, #202123 @60%) */}
                    <div className="flex flex-col gap-0 text-[16px] leading-6 text-ink opacity-60">
                      {planRates?.icpLine && <span>{planRates.icpLine}</span>}
                      {planRates?.ckBtcLine && <span>{planRates.ckBtcLine}</span>}
                      {planRates?.usdLine && <span>{planRates.usdLine}</span>}
                    </div>

                    {/* Select / Selected button — INVERTED SEMANTICS per design:
                        SELECTED = outlined ("Selected"), UNSELECTED = filled ("Select") */}
                    {isSelected ? (
                      <Button
                        variant="outlined"
                        onClick={() => purchase.select(interval)}
                        sx={secondaryButtonSx}
                      >
                        Selected
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => purchase.select(interval)}
                        sx={primaryButtonSx}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Terms checkbox */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="size-4 accent-[var(--color-brand-purple)]"
              />
              <span className="text-label text-ink">{c.confirmTerms}</span>
            </label>
          </div>

          <FooterRow>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={secondaryButtonSx}
            >
              {c.confirmCancel}
            </Button>
            <Button
              variant="contained"
              disabled={!purchase.selected || !terms}
              onClick={() => void purchase.confirm()}
              sx={primaryButtonSx}
            >
              {c.confirmSubscribe}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── PROCESSING (frames 1030:11530 / 1030:11584) ── */}
      {purchase.stage === "processing" && (
        <>
          <div className="mt-6 flex flex-col gap-0">
            <p className="text-body text-ink">
              We&rsquo;re processing your payment of{" "}
              <strong>{selectedDisplay} NUA</strong> from your Nuance wallet.
              This only takes a moment.
            </p>
            <Spinner />
          </div>

          <FooterRow>
            <Button
              variant="outlined"
              disabled
              sx={{ ...secondaryButtonSx, opacity: 0.4 }}
            >
              {c.processingCancel}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── SUCCESS (frames 1:6657 / 1:6889) ── */}
      {purchase.stage === "success" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              {variant.successBody
                .replace(/{handle}/g, handle)
                .replace(
                  "{period}",
                  purchase.selected
                    ? periodPhrase(purchase.selected)
                    : "the coming month",
                )}
            </p>
            <div className="flex justify-center">
              <IconPartySuccess className="size-60" />
            </div>
          </div>

          <FooterRow>
            <Button
              variant="contained"
              onClick={onClose}
              sx={primaryButtonSx}
            >
              {c.successClose}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── INSUFFICIENT FUNDS (frames 1030:11539 / 1030:11593) ── */}
      {purchase.stage === "insufficient" && (
        <>
          {(() => {
            const selectedRaw =
              purchase.selected && purchase.details
                ? purchase.details[feeField(purchase.selected)]
                : undefined;
            const costDisplay = selectedRaw ? fmtNua(selectedRaw) : "?";
            const balDisplay = purchase.balance
              ? (Number(purchase.balance) / 1e8).toFixed(4)
              : "0";
            const intervalLabel = purchase.selected
              ? INTERVAL_LABELS[purchase.selected].toLowerCase()
              : "";
            return (
              <>
                <div className="mt-6 flex flex-col gap-6">
                  <p className="text-body text-ink">
                    {c.insufficientBody
                      .replace("{cost}", costDisplay)
                      .replace("{interval}", intervalLabel)
                      .replace("{balance}", balDisplay)
                      .split(/(\*\*.*?\*\*)/)
                      .map((part, i) =>
                        part.startsWith("**") ? (
                          <strong key={i}>{part.slice(2, -2)}</strong>
                        ) : (
                          part
                        ),
                      )}
                  </p>
                  <SummaryCard
                    className="gap-3 p-6"
                    rows={[
                      [
                        c.insufficientRowSubscription.replace(
                          "{interval}",
                          INTERVAL_LABELS[purchase.selected!],
                        ),
                        `${costDisplay} NUA`,
                      ],
                      [c.insufficientRowBalance, `${balDisplay} NUA`],
                    ]}
                  />
                </div>
                <FooterRow>
                  <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={secondaryButtonSx}
                  >
                    {c.insufficientCancel}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      onClose();
                      navigate("/wallet");
                    }}
                    sx={primaryButtonSx}
                  >
                    {c.insufficientAddFunds}
                  </Button>
                </FooterRow>
              </>
            );
          })()}
        </>
      )}

      {/* ── ERROR (frames 1030:11555 / 1030:11609) ── */}
      {/* Two variants:
          paid=false → "no NUA was deducted", Cancel + "Try again".
          paid=true  → "being returned automatically", Close ONLY (safety). */}
      {purchase.stage === "error" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {purchase.paid ? (
              <p className="text-body text-ink">{c.errorPaidBody}</p>
            ) : (
              <p className="text-body text-ink">
                We couldn&rsquo;t complete your subscription and{" "}
                <strong>no NUA was deducted</strong> from your wallet. Please
                try again.
              </p>
            )}
            {purchase.errorMessage && (
              <p className="text-label text-[#D32F2F]">
                {purchase.errorMessage}
              </p>
            )}
          </div>

          <FooterRow>
            {purchase.paid ? (
              // paid=true: terminal state — Close only, no retry.
              <Button
                variant="contained"
                onClick={onClose}
                sx={primaryButtonSx}
              >
                {c.errorClose}
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={secondaryButtonSx}
                >
                  {c.errorCancel}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => purchase.retry()}
                  sx={primaryButtonSx}
                >
                  {c.errorTryAgain}
                </Button>
              </>
            )}
          </FooterRow>
        </>
      )}
    </Popup>
  );
}
