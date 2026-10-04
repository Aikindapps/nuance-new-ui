import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
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
import { fmtUsd } from "./cardCheckout";
import type { CardReturn } from "./cardReturn";
import { useIsMobileViewport } from "../../../lib/useIsMobileViewport";
import { SubscribeSheet } from "./SubscribeSheet";
import { Avatar } from "../../../components/ui/Avatar";
import type { UserListItem } from "../../../candid/User/User";

export const SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID =
  "subscription-purchase-modal-title";

// ── Shared helpers (mirrors NftPurchaseModal) ──────────────────────────────

// `margin`: Confirming your payment (frame 3091:3298) has no buttons, so its
// spinner sits 32 below the text and right on the window's bottom padding.
function Spinner({ margin = "my-6" }: { margin?: string }) {
  return (
    <div className={`relative mx-auto ${margin} size-16`}>
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

// "every month" in the card success body (frame 3091:3306).
function cardPeriod(interval: SubscriptionTimeInterval): string {
  switch (interval) {
    case SubscriptionTimeInterval.Weekly:
      return subscriptionPurchaseCopy.card.periodWeek;
    case SubscriptionTimeInterval.Monthly:
      return subscriptionPurchaseCopy.card.periodMonth;
    default:
      return subscriptionPurchaseCopy.card.periodYear;
  }
}

// Card plan sub-line under the USD price (frame 3085:11951).
function billedLine(interval: SubscriptionTimeInterval): string {
  switch (interval) {
    case SubscriptionTimeInterval.Weekly:
      return subscriptionPurchaseCopy.card.billedWeekly;
    case SubscriptionTimeInterval.Monthly:
      return subscriptionPurchaseCopy.card.billedMonthly;
    default:
      return subscriptionPurchaseCopy.card.billedYearly;
  }
}

// "Pay with wallet" / "Pay with card" tab bar (NUR/Tab bar; same type and
// underline as components/ui/Tab, as buttons because they switch in place).
function MethodTabs({
  method,
  onSelect,
  compact = false,
}: {
  method: "wallet" | "card";
  onSelect: (m: "wallet" | "card") => void;
  // Phone sheet: 12 side padding so both tabs fit 345 (frame 3057:6034).
  compact?: boolean;
}) {
  const c = subscriptionPurchaseCopy.card;
  const tabs: { id: "wallet" | "card"; label: string }[] = [
    { id: "wallet", label: c.tabWallet },
    { id: "card", label: c.tabCard },
  ];
  return (
    <div
      role="tablist"
      aria-label={c.tabsAria}
      className="flex border-b border-ink-border/10"
    >
      {tabs.map((t) => {
        const active = method === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t.id)}
            className={[
              "relative flex items-center justify-center " +
                (compact ? "px-3" : "px-[calc(25*var(--fpx))]") +
                " py-3 text-body transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple",
              active
                ? "font-bold text-brand-purple after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-purple"
                : "font-medium text-ink-80 hover:text-ink",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// -- Who you're subscribing to (NIC-633) ---------------------------------------
// The publication's logo or the writer's photo + name under the title, on the
// plan picker only. Desktop (frames 1:6561 / 1:6792 / 3085:11951): avatar 88,
// 20 under the header row (title + close, NIC-644), name 24 to its right, the
// intro 32 below (NIC-640: the row's 8 bottom padding + the intro's own 24). Phone
// (3050:6022): avatar 48, 16 under the title, name 16 to its right, the intro
// 16 below. Name 22/32 medium. No display name -> "@handle"; no photo -> the
// house initial avatar. Publications keep the house rounded-square logo,
// writers the round photo.
function IdentityRow({
  profile,
  handle,
  isPublication,
  phone = false,
}: {
  profile: UserListItem | null;
  handle: string;
  isPublication: boolean;
  phone?: boolean;
}) {
  const name = profile?.displayName || `@${profile?.handle || handle}`;
  return (
    <div className={`flex items-center ${phone ? "mt-4 gap-4" : "mt-5 gap-6 pb-2"}`}>
      <Avatar
        src={profile?.avatar ?? ""}
        label={profile?.displayName || profile?.handle || handle}
        sizeClass={phone ? "size-12" : "size-[calc(88*var(--fpx))]"}
        textClass={
          phone
            ? "text-[length:calc(20*var(--fpx))]"
            : "text-[length:calc(36*var(--fpx))]"
        }
        rounded={isPublication ? "card" : "full"}
      />
      <span className="min-w-0 break-words text-[length:calc(22*var(--fpx))] font-medium leading-8 text-ink">
        {name}
      </span>
    </div>
  );
}

// -- Phone bottom sheet (NIC-626, NIC-629) ------------------------------------
// Below the 1024 seam, EVERY Subscribe (publication or writer, with or
// without card payment) gets the "NUR / Subscribe sheet (phone)" bottom sheet
// (component set 3054:68659) instead of the centred popup. Same purchase
// hook, stages and copy as the popup above; only the layout differs: plans
// are stacked full-width rows (the whole row is the tap target), buttons are
// stacked full width with the primary on top, the spinner is 48. The sheet
// opens straight away with its spinner inside while the plans load. The
// wallet-only picker, the wallet tab and the wallet payment states have no
// phone frame of their own; they follow the same recipe (Dana, NIC-629).

// 48 spinner (frame 3059:6151): the popup's 64 spinner scaled to 48 (ring
// 4.5), 32 below the text (`top` overrides that gap).
function SheetSpinner({ top = "mt-8" }: { top?: string }) {
  return (
    <div className={`relative mx-auto ${top} size-12`}>
      <svg
        className="absolute inset-0 size-12"
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
        className="absolute inset-0 size-12 animate-spin"
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

// One plan row (frame 3057:6034): label + sub-lines on the left, price on the
// right, 16 padding, 16 corners; selected = purple border + purple 5% fill.
// The 1px border is drawn inside the row (an inset ring, like the Figma
// stroke), so the padding stays 16.
function SheetPlanRow({
  label,
  lines,
  price,
  selected,
  onSelect,
}: {
  label: string;
  lines: string[];
  price: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "flex w-full items-center justify-between gap-4 rounded-[calc(16*var(--fpx))] p-4 text-left ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple",
        selected
          ? "bg-[rgba(84,5,212,0.05)] ring-[#5405D4]"
          : "bg-white ring-[rgba(84,5,212,0.40)]",
      ].join(" ")}
    >
      <span className="flex flex-col gap-1">
        <span className="text-body font-medium text-ink">{label}</span>
        {lines.map((l) => (
          <span key={l} className="text-label text-ink-60">
            {l}
          </span>
        ))}
      </span>
      <span className="shrink-0 whitespace-nowrap text-[length:calc(22*var(--fpx))] font-bold leading-8 text-ink">
        {price}
      </span>
    </button>
  );
}

type SubscribePhoneSheetProps = {
  purchase: ReturnType<typeof useSubscriptionPurchase>;
  title: string;
  handle: string;
  variant: typeof subscriptionPurchaseCopy.pub;
  // Avatar + name row, shown under the title on the plan picker (NIC-633).
  identity: ReactNode;
  // You are now subscribed! body after Stripe, same text as the popup (NIC-627).
  cardSuccessBody: string;
  rates: ReturnType<typeof useSubscriptionRates>;
  terms: boolean;
  onTermsChange: (checked: boolean) => void;
  selectedDisplay: string;
  dismissable: boolean;
  onClose: () => void;
  onContinueToPayment: () => void;
  onAddFunds: () => void;
};

function SubscribePhoneSheet({
  purchase,
  title,
  handle,
  variant,
  identity,
  cardSuccessBody,
  rates,
  terms,
  onTermsChange,
  selectedDisplay,
  dismissable,
  onClose,
  onContinueToPayment,
  onAddFunds,
}: SubscribePhoneSheetProps) {
  const c = subscriptionPurchaseCopy;
  const cc = c.card;
  // Tabs only when both methods exist (D-168 / D-172); wallet-only and
  // card-only open straight on their plans.
  const hasCard = purchase.cardPlans.length > 0;
  const showTabs = hasCard && purchase.hasWalletPlans;
  const onCardTab = hasCard && purchase.method === "card";

  const primary = (label: string, onClick: () => void, disabled = false) => (
    <Button
      fullWidth
      variant="contained"
      disabled={disabled}
      onClick={onClick}
      sx={primaryButtonSx}
    >
      {label}
    </Button>
  );
  const secondary = (label: string, onClick: () => void) => (
    <Button fullWidth variant="outlined" onClick={onClick} sx={secondaryButtonSx}>
      {label}
    </Button>
  );
  const inertCancel = (label: string) => (
    <Button
      fullWidth
      variant="outlined"
      disabled
      sx={{ ...secondaryButtonSx, opacity: 0.4 }}
    >
      {label}
    </Button>
  );
  const termsBox = (
    <label className="mt-4 flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={terms}
        onChange={(e) => onTermsChange(e.target.checked)}
        className="size-4 accent-[var(--color-brand-purple)]"
      />
      <span className="text-label text-ink">{c.confirmTerms}</span>
    </label>
  );

  let hero: ReactNode = null;
  let body: ReactNode = null;
  let footer: ReactNode = null;

  if (purchase.stage === "loading") {
    // Plans loading: the sheet is already open, spinner inside, no title
    // (as the desktop window); 24 above and below the spinner.
    body = <SheetSpinner top="mt-1" />;
  } else if (purchase.stage === "noplans") {
    body = <p className="mt-4 text-body text-ink">{variant.noPlansBody}</p>;
    footer = primary(c.noPlansClose, onClose);
  } else if (purchase.stage === "confirm" && purchase.details) {
    const details = purchase.details;
    const tabs = showTabs && (
      <div className="mt-6">
        <MethodTabs
          method={purchase.method}
          onSelect={purchase.setMethod}
          compact
        />
      </div>
    );
    const duration = (
      <p className="mt-6 text-body font-medium text-ink">
        {c.confirmDurationLabel}
      </p>
    );
    if (onCardTab) {
      const tierChosen = purchase.cardPlans.some(
        (t) => t.interval === purchase.cardSelected,
      );
      body = (
        <div className="mt-4 flex flex-col">
          <p className="text-body text-ink">{variant.cardIntro}</p>
          {tabs}
          {duration}
          <div className="mt-3 flex flex-col gap-3">
            {purchase.cardPlans.map((tier) => (
              <SheetPlanRow
                key={tier.interval}
                label={INTERVAL_LABELS[tier.interval]}
                lines={[billedLine(tier.interval)]}
                price={fmtUsd(tier.usdCents)}
                selected={purchase.cardSelected === tier.interval}
                onSelect={() => purchase.selectCard(tier.interval)}
              />
            ))}
          </div>
          <p className="mt-4 text-label text-ink-60">{cc.stripeNote}</p>
          {termsBox}
        </div>
      );
      footer = (
        <>
          {primary(
            cc.continueToPayment,
            onContinueToPayment,
            !tierChosen || !terms,
          )}
          {secondary(c.confirmCancel, onClose)}
        </>
      );
    } else {
      body = (
        <div className="mt-4 flex flex-col">
          <p className="text-body text-ink">{variant.confirmIntro}</p>
          {tabs}
          {duration}
          <div className="mt-3 flex flex-col gap-3">
            {ORDERED_INTERVALS.map((interval) => {
              const raw = details[feeField(interval)];
              if (!raw) return null;
              const planRates = rates[interval];
              const lines = [
                planRates?.icpLine,
                planRates?.ckBtcLine,
                planRates?.usdLine,
              ].filter((l): l is string => Boolean(l));
              return (
                <SheetPlanRow
                  key={interval}
                  label={INTERVAL_LABELS[interval]}
                  lines={lines}
                  price={`${fmtNua(raw)} NUA`}
                  selected={purchase.selected === interval}
                  onSelect={() => purchase.select(interval)}
                />
              );
            })}
          </div>
          {termsBox}
        </div>
      );
      footer = (
        <>
          {primary(
            c.confirmSubscribe,
            () => void purchase.confirm(),
            !purchase.selected || !terms,
          )}
          {secondary(c.confirmCancel, onClose)}
        </>
      );
    }
  } else if (purchase.stage === "processing") {
    body = (
      <div className="mt-4 pb-2">
        <p className="text-body text-ink">
          We&rsquo;re processing your payment of{" "}
          <strong>{selectedDisplay} NUA</strong> from your Nuance wallet. This
          only takes a moment.
        </p>
        <SheetSpinner />
      </div>
    );
    footer = inertCancel(c.processingCancel);
  } else if (purchase.stage === "success") {
    hero = <IconPartySuccess className="size-40" />;
    body = (
      <p className="mt-4 text-body text-ink">
        {variant.successBody
          .replace(/{handle}/g, handle)
          .replace(
            "{period}",
            purchase.selected
              ? periodPhrase(purchase.selected)
              : "the coming month",
          )}
      </p>
    );
    footer = primary(c.successClose, onClose);
  } else if (purchase.stage === "insufficient") {
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
    body = (
      <div className="mt-4 flex flex-col gap-6">
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
                purchase.selected ? INTERVAL_LABELS[purchase.selected] : "",
              ),
              `${costDisplay} NUA`,
            ],
            [c.insufficientRowBalance, `${balDisplay} NUA`],
          ]}
        />
      </div>
    );
    footer = (
      <>
        {primary(c.insufficientAddFunds, onAddFunds)}
        {secondary(c.insufficientCancel, onClose)}
      </>
    );
  } else if (purchase.stage === "error") {
    body = (
      <div className="mt-4 flex flex-col gap-6">
        {purchase.paid ? (
          <p className="text-body text-ink">{c.errorPaidBody}</p>
        ) : (
          <p className="text-body text-ink">
            We couldn&rsquo;t complete your subscription and{" "}
            <strong>no NUA was deducted</strong> from your wallet. Please try
            again.
          </p>
        )}
        {purchase.errorMessage && (
          <p className="text-label text-[#D32F2F]">{purchase.errorMessage}</p>
        )}
      </div>
    );
    // paid=true: terminal, Close only (funds are being returned).
    footer = purchase.paid ? (
      primary(c.errorClose, onClose)
    ) : (
      <>
        {primary(c.errorTryAgain, () => purchase.retry())}
        {secondary(c.errorCancel, onClose)}
      </>
    );
  } else if (purchase.stage === "redirecting") {
    // Taking you to Stripe (frame 3059:6151).
    body = (
      <div className="mt-4 pb-2">
        <p className="text-body text-ink">{cc.redirectingBody}</p>
        <SheetSpinner />
      </div>
    );
    footer = inertCancel(cc.redirectingCancel);
  } else if (purchase.stage === "checkoutError") {
    // Couldn't open checkout (frame 3063:6307).
    body = (
      <p className="mt-4 text-body text-ink">
        {purchase.hasWalletPlans
          ? cc.checkoutErrorBody
          : cc.checkoutErrorBodyNoWallet}
      </p>
    );
    footer = (
      <>
        {primary(cc.tryAgain, onContinueToPayment)}
        {purchase.hasWalletPlans &&
          secondary(cc.payWithWallet, purchase.payWithWallet)}
      </>
    );
  } else if (purchase.stage === "alreadySubscribed") {
    // Already subscribed (frame 3063:6469).
    body = (
      <p className="mt-4 text-body text-ink">
        {variant.cardAlreadyBody.replace("{handle}", handle)}
      </p>
    );
    footer = primary(cc.alreadyClose, onClose);
  } else if (purchase.stage === "cancelled") {
    // Back from Stripe without paying (frame 3059:6354). Card-only drops the
    // wallet clause and Pay with wallet, as the popup does.
    body = (
      <p className="mt-4 text-body text-ink">
        {purchase.hasWalletPlans ? cc.cancelledBody : cc.cancelledBodyNoWallet}
      </p>
    );
    footer = (
      <>
        {primary(cc.tryAgain, purchase.backToCardPicker)}
        {purchase.hasWalletPlans &&
          secondary(cc.payWithWallet, purchase.payWithWallet)}
      </>
    );
  } else if (purchase.stage === "confirming") {
    // Confirming your payment (frame 3063:6629): spinner 32 under the text,
    // no buttons, and the sheet cannot be closed (dismissable is false).
    body = (
      <div className="mt-4">
        <p className="text-body text-ink">{cc.confirmingBody}</p>
        <SheetSpinner />
      </div>
    );
  } else if (purchase.stage === "subscribed") {
    // You are now subscribed! (frame 3063:6950): party above the title.
    hero = <IconPartySuccess className="size-40" />;
    body = <p className="mt-4 text-body text-ink">{cardSuccessBody}</p>;
    footer = primary(c.successClose, onClose);
  } else if (purchase.stage === "paymentReceived") {
    // Payment received (frame 3063:6790): Close only.
    body = (
      <p className="mt-4 text-body text-ink">
        {variant.cardReceivedBody.replace("{handle}", handle)}
      </p>
    );
    footer = primary(cc.receivedClose, onClose);
  }

  return (
    <SubscribeSheet
      titleId={SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID}
      title={title}
      dismissable={dismissable}
      onDismiss={onClose}
      closeAriaLabel={c.closeAria}
      hero={hero}
      footer={footer}
    >
      {purchase.stage === "confirm" && purchase.details && identity}
      {body}
    </SubscribeSheet>
  );
}

// ── Modal props ────────────────────────────────────────────────────────────

type Props = {
  isPublication: boolean;
  handle: string;
  // The publication's (or writer's) User record for the avatar + name row;
  // null when it could not be loaded (falls back to "@handle").
  profile: UserListItem | null;
  writerPrincipalId: string;
  // The reader has just come back from Stripe Checkout (NIC-622).
  cardReturn?: CardReturn | null;
  onClose: () => void;
  onPurchased?: () => void;
};

// ── Main component ─────────────────────────────────────────────────────────

export function SubscriptionPurchaseModal({
  isPublication,
  handle,
  profile,
  writerPrincipalId,
  cardReturn = null,
  onClose,
  onPurchased,
}: Props) {
  const purchase = useSubscriptionPurchase({ writerPrincipalId, cardReturn });
  useEffect(() => { if (purchase.stage === "success" || purchase.stage === "subscribed") onPurchased?.(); }, [purchase.stage, onPurchased]);
  const navigate = useNavigate();
  const [terms, setTerms] = useState(false);
  const isMobile = useIsMobileViewport();

  const c = subscriptionPurchaseCopy;
  const variant = isPublication ? c.pub : c.author;

  const isProcessing =
    purchase.stage === "processing" ||
    purchase.stage === "redirecting" ||
    purchase.stage === "confirming";

  // Non-dismissable while processing (same pattern as NftPurchaseModal),
  // while the checkout session is being created (card), and while a card
  // payment is being confirmed after Stripe.
  const handleClose = isProcessing ? () => undefined : onClose;

  // Card offer (NIC-621; writers NIC-631): an active Stripe account and at
  // least one card price. Tabs only when wallet plans exist too (D-168).
  const hasCard = purchase.cardPlans.length > 0;
  const showTabs = hasCard && purchase.hasWalletPlans;
  const onCardTab = hasCard && purchase.method === "card";
  const cc = c.card;

  // Keep the popup's TOP edge still when switching tabs (card 943 / wallet
  // 972 high in the frames): the dialog centres its content, so shift the
  // popup down by half of its growth since the picker opened.
  // (Written straight to the wrapper's style: a ResizeObserver also catches
  // late growth such as the conversion lines arriving.)
  const popupRef = useRef<HTMLDivElement>(null);
  const pinTop = showTabs && purchase.stage === "confirm";
  useLayoutEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    if (!pinTop) {
      el.style.top = "0px";
      return;
    }
    let baseHeight: number | null = null;
    const apply = () => {
      const h = el.offsetHeight;
      if (baseHeight === null) baseHeight = h;
      el.style.top = `${(h - baseHeight) / 2}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pinTop]);

  // Card: selected tier + Continue to payment. startCardCheckout opens the
  // Stripe tab synchronously, so it is called straight from the click.
  const selectedCardTier = purchase.cardPlans.find(
    (t) => t.interval === purchase.cardSelected,
  );
  const continueToPayment = () => {
    void purchase.startCardCheckout().then((opened) => {
      if (opened) onClose();
    });
  };

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
                  : purchase.stage === "redirecting"
                    ? cc.redirectingTitle
                    : purchase.stage === "checkoutError"
                      ? cc.checkoutErrorTitle
                      : purchase.stage === "alreadySubscribed"
                        ? cc.alreadyTitle
                        : purchase.stage === "cancelled"
                          ? cc.cancelledTitle
                          : purchase.stage === "confirming"
                            ? cc.confirmingTitle
                            : purchase.stage === "subscribed"
                              ? variant.successTitle
                              : purchase.stage === "paymentReceived"
                                ? cc.receivedTitle
                                : "";

  // Back from Stripe (NIC-622): card-only states, shown in the 864 card
  // window even when the plans were never loaded (success return).
  const cardReturnStage =
    purchase.stage === "cancelled" ||
    purchase.stage === "confirming" ||
    purchase.stage === "subscribed" ||
    purchase.stage === "paymentReceived";

  // You are now subscribed! body (frame 3091:3306; writer copy NIC-619).
  const paidPlan = purchase.paidPlan;
  const cardSuccessBody = (
    paidPlan ? variant.cardSuccessBody : variant.cardSuccessBodyNoPlan
  )
    .replace("{name}", profile?.displayName || `@${handle}`)
    .replace(/{handle}/g, handle)
    .replace("{amount}", paidPlan ? fmtUsd(paidPlan.usdCents) : "")
    .replace("{period}", paidPlan ? cardPeriod(paidPlan.interval) : "");

  // Rates for conversion lines on the confirm screen.
  const rates = useSubscriptionRates(
    purchase.stage === "confirm" ? purchase.details : null,
  );

  // NIC-276: when the writer/publication offers only ONE plan tier the single
  // card must be CENTERED rather than sitting in the leftmost grid column.
  // Multi-tier layout is untouched.
  const singlePlan =
    (purchase.details
      ? ORDERED_INTERVALS.filter((i) => purchase.details![feeField(i)]).length
      : 0) === 1;

  const identity = (phone: boolean) => (
    <IdentityRow
      profile={profile}
      handle={handle}
      isPublication={isPublication}
      phone={phone}
    />
  );

  // Phone (NIC-626, NIC-629): every Subscribe uses the bottom sheet, from
  // the first frame (it shows its own spinner while the plans load).
  if (isMobile) {
    return (
      <SubscribePhoneSheet
        purchase={purchase}
        title={title}
        handle={handle}
        variant={variant}
        identity={identity(true)}
        cardSuccessBody={cardSuccessBody}
        rates={rates}
        terms={terms}
        onTermsChange={setTerms}
        selectedDisplay={selectedDisplay}
        dismissable={!isProcessing}
        onClose={onClose}
        onContinueToPayment={continueToPayment}
        onAddFunds={() => {
          onClose();
          navigate("/wallet");
        }}
      />
    );
  }

  const popup = (
    <Popup
      titleId={SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID}
      title={title}
      onClose={handleClose}
      closeAriaLabel={c.closeAria}
      widthClassName={
        hasCard || cardReturnStage ? "w-[calc(864*var(--fpx))]" : undefined
      }
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
            <p className="text-body text-ink">{variant.noPlansBody}</p>
          </div>
          <FooterRow>
            <Button variant="contained" onClick={onClose} sx={primaryButtonSx}>
              {c.noPlansClose}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── CONFIRM (frames 1:6561 / 1:6792) ── */}
      {purchase.stage === "confirm" && purchase.details && identity(false)}

      {purchase.stage === "confirm" && purchase.details && onCardTab && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {/* Intro paragraph (card variant, frames 3085:11951 / 3104:3299) */}
            <p className="text-body text-ink">{variant.cardIntro}</p>

            {showTabs && (
              <MethodTabs method={purchase.method} onSelect={purchase.setMethod} />
            )}

            {/* Duration label */}
            <p className="text-body font-medium text-ink">
              {c.confirmDurationLabel}
            </p>

            {/* Card plan cards — USD, Week / Month / Year only (D-164).
                At most 3 tiers, so the row splits into as many equal columns
                as there are tiers (frame 3085:11951); one tier is centred. */}
            <div
              className={
                purchase.cardPlans.length === 1
                  ? "flex justify-center"
                  : purchase.cardPlans.length === 2
                    ? "grid grid-cols-2 gap-4"
                    : "grid grid-cols-2 gap-4 sm:grid-cols-3"
              }
            >
              {purchase.cardPlans.map((tier) => {
                const isSelected = purchase.cardSelected === tier.interval;
                return (
                  <div
                    key={tier.interval}
                    className={[
                      "flex flex-col gap-4 rounded-2xl p-8 transition-colors",
                      purchase.cardPlans.length === 1 ? "w-1/2 sm:w-1/4" : "",
                      isSelected
                        ? "border border-[#5405D4] bg-[rgba(84,5,212,0.05)]"
                        : "border border-[rgba(84,5,212,0.40)]",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-body font-medium text-ink">
                        {INTERVAL_LABELS[tier.interval]}
                      </span>
                      <span className="text-[22px] font-bold leading-8 text-ink">
                        {fmtUsd(tier.usdCents)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0 whitespace-nowrap text-[16px] leading-6 text-ink opacity-60">
                      <span>{billedLine(tier.interval)}</span>
                    </div>

                    {isSelected ? (
                      <Button
                        variant="outlined"
                        onClick={() => purchase.selectCard(tier.interval)}
                        sx={secondaryButtonSx}
                      >
                        Selected
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => purchase.selectCard(tier.interval)}
                        sx={primaryButtonSx}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stripe hand-off note (card tab only) */}
            <p className="text-body text-ink">{cc.stripeNote}</p>

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
              disabled={!selectedCardTier || !terms}
              onClick={continueToPayment}
              sx={primaryButtonSx}
            >
              {cc.continueToPayment}
            </Button>
          </FooterRow>
        </>
      )}

      {purchase.stage === "confirm" && purchase.details && !onCardTab && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {/* Intro paragraph */}
            <p className="text-body text-ink">{variant.confirmIntro}</p>

            {showTabs && (
              <MethodTabs method={purchase.method} onSelect={purchase.setMethod} />
            )}

            {/* Duration label */}
            <p className="text-body font-medium text-ink">
              {c.confirmDurationLabel}
            </p>

            {/* Plan cards — 4-col grid; single tier is centered (NIC-276) */}
            <div
              className={
                singlePlan
                  ? "flex justify-center"
                  : "grid grid-cols-2 gap-4 sm:grid-cols-4"
              }
            >
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
                      singlePlan ? "w-1/2 sm:w-1/4" : "",
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

      {/* ── TAKING YOU TO STRIPE (frame 3088:12960) ── */}
      {purchase.stage === "redirecting" && (
        <>
          <div className="mt-6 flex flex-col gap-0">
            <p className="text-body text-ink">{cc.redirectingBody}</p>
            <Spinner />
          </div>

          <FooterRow>
            <Button
              variant="outlined"
              disabled
              sx={{ ...secondaryButtonSx, opacity: 0.4 }}
            >
              {cc.redirectingCancel}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── COULDN'T OPEN CHECKOUT (frame 3089:12973) ── */}
      {purchase.stage === "checkoutError" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              {purchase.hasWalletPlans
                ? cc.checkoutErrorBody
                : cc.checkoutErrorBodyNoWallet}
            </p>
          </div>

          <FooterRow>
            {purchase.hasWalletPlans && (
              <Button
                variant="outlined"
                onClick={purchase.payWithWallet}
                sx={secondaryButtonSx}
              >
                {cc.payWithWallet}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={continueToPayment}
              sx={primaryButtonSx}
            >
              {cc.tryAgain}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── ALREADY SUBSCRIBED (frame 3089:12982) ── */}
      {purchase.stage === "alreadySubscribed" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              {variant.cardAlreadyBody.replace("{handle}", handle)}
            </p>
          </div>

          <FooterRow>
            <Button variant="contained" onClick={onClose} sx={primaryButtonSx}>
              {cc.alreadyClose}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── CHECKOUT CANCELLED: NOT CHARGED (frame 3088:12969) ── */}
      {purchase.stage === "cancelled" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              {purchase.hasWalletPlans
                ? cc.cancelledBody
                : cc.cancelledBodyNoWallet}
            </p>
          </div>

          <FooterRow>
            {purchase.hasWalletPlans && (
              <Button
                variant="outlined"
                onClick={purchase.payWithWallet}
                sx={secondaryButtonSx}
              >
                {cc.payWithWallet}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={purchase.backToCardPicker}
              sx={primaryButtonSx}
            >
              {cc.tryAgain}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── CONFIRMING YOUR PAYMENT (frame 3091:3298): no buttons ── */}
      {purchase.stage === "confirming" && (
        <div className="mt-6 flex flex-col gap-0">
          <p className="text-body text-ink">{cc.confirmingBody}</p>
          <Spinner margin="mt-8" />
        </div>
      )}

      {/* ── YOU ARE NOW SUBSCRIBED! (frame 3091:3306) ── */}
      {purchase.stage === "subscribed" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">{cardSuccessBody}</p>
            <div className="flex justify-center">
              <IconPartySuccess className="size-60" />
            </div>
          </div>

          <FooterRow>
            <Button variant="contained" onClick={onClose} sx={primaryButtonSx}>
              {c.successClose}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── PAYMENT RECEIVED (frame 3093:16866): Close only ── */}
      {purchase.stage === "paymentReceived" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              {variant.cardReceivedBody.replace("{handle}", handle)}
            </p>
          </div>

          <FooterRow>
            <Button variant="contained" onClick={onClose} sx={primaryButtonSx}>
              {cc.receivedClose}
            </Button>
          </FooterRow>
        </>
      )}
    </Popup>
  );

  // Wallet-only (no card offer): exactly today's markup.
  if (!showTabs) return popup;

  return (
    <div ref={popupRef} style={{ position: "relative" }}>
      {popup}
    </div>
  );
}
