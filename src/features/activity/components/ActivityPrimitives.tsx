import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { secondaryButtonSx } from "../../../components/ui/modalButtons";
import type { UserListItem } from "../../../candid/User/User";
import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";

// NIC-359 / NIC-372 -- shared Activity hub primitives.
//
// The four Activity sections (Following / Followers / Subscribers /
// Subscriptions) share one visual language: a loading skeleton, an
// error+retry block, an empty block, a "Show more" pager, a user row and a
// row divider. These live here so every section (and future siblings
// NIC-353 / NIC-354) render an identical shell. §8.3 canonical `1734:4704`.

// Canonical Activity row divider — #373A49 @10%.
export function ActivityRowDivider() {
  return <div className="h-px w-full bg-[#373A49]/10" />;
}

// Loading skeleton — a list of rows, each with an avatar, two text lines and
// a right-side button pill (rows carry a right-hand action, e.g. the
// Followers "Follow back" button, so the skeleton reserves its space).
export function ActivityLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          {i > 0 && <ActivityRowDivider />}
          <div className="flex items-center gap-[calc(16*var(--fpx))] py-[calc(16*var(--fpx))]">
            <Skeleton
              variant="circular"
              sx={{
                width: "calc(48 * var(--fpx))",
                height: "calc(48 * var(--fpx))",
                flexShrink: 0,
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[calc(6*var(--fpx))]">
              <Skeleton
                variant="rounded"
                sx={{ height: "calc(18 * var(--fpx))", width: "40%", borderRadius: "4px" }}
              />
              <Skeleton
                variant="rounded"
                sx={{ height: "calc(16 * var(--fpx))", width: "28%", borderRadius: "4px" }}
              />
            </div>
            <Skeleton
              variant="rounded"
              sx={{
                width: "calc(120 * var(--fpx))",
                height: "calc(44 * var(--fpx))",
                borderRadius: "var(--radius-card)",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state + Retry. Vertical padding is 48 top / 16 bottom per the §8.3
// frame (not symmetric).
export function ActivityError({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="pt-[calc(48*var(--fpx))] pb-[calc(16*var(--fpx))] text-center"
    >
      <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
        {title}
      </p>
      <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">{body}</p>
      <div className="mt-4">
        <Button variant="outlined" sx={secondaryButtonSx} onClick={onRetry}>
          {retryLabel}
        </Button>
      </div>
    </div>
  );
}

// Empty state. Optionally renders a CTA link below the body when both
// ctaLabel and ctaHref are supplied (e.g. Following's "Discover writers"
// Explore link); omit both for a plain empty block (e.g. Followers).
export function ActivityEmpty({
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="py-16 text-center">
      <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
        {heading}
      </p>
      <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">{body}</p>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="mt-4 inline-block text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

// "Show more" pager button.
export function ShowMoreButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="mt-4 flex justify-center">
      <Button variant="outlined" sx={secondaryButtonSx} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

// A single user row: avatar + name + optional sub-line + optional right slot.
// `isPublication` switches the row to publication treatment: a card-shaped
// avatar and a `/publication/<handle>` profile link (writers keep the round
// avatar and `/<handle>` link). Optional + defaulted, so read-only callers
// (Followers) that omit it are unchanged.
export function ActivityUserRow({
  user,
  subLine,
  right,
  isPublication = false,
}: {
  user: UserListItem;
  subLine?: string;
  right?: ReactNode;
  isPublication?: boolean;
}) {
  const name = user.displayName || user.handle;
  const profilePath = isPublication
    ? `/publication/${user.handle.toLowerCase()}`
    : `/${user.handle.toLowerCase()}`;

  return (
    <div className="flex items-center gap-[calc(16*var(--fpx))] py-[calc(16*var(--fpx))]">
      <Link to={profilePath} className="shrink-0" tabIndex={-1}>
        <Avatar
          src={user.avatar}
          label={name}
          sizeClass="size-[calc(48*var(--fpx))]"
          textClass="text-[length:calc(20*var(--fpx))]"
          rounded={isPublication ? "card" : "full"}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-[calc(3*var(--fpx))]">
        <Link
          to={profilePath}
          className="truncate text-[length:calc(18*var(--fpx))] font-semibold leading-[calc(22/18)] text-ink hover:underline"
        >
          {name}
        </Link>
        {subLine && (
          <span className="truncate text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink-60">
            {subLine}
          </span>
        )}
      </div>

      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SS8.3 / NIC-353 Subscribers + Subscriptions primitives
// ---------------------------------------------------------------------------

// Human-readable cadence labels for each SubscriptionTimeInterval variant.
// Module-private -- callers receive the formatted string via SubscriptionMeta.
const CADENCE_LABEL: Record<SubscriptionTimeInterval, string> = {
  [SubscriptionTimeInterval.Weekly]: "Weekly",
  [SubscriptionTimeInterval.Monthly]: "Monthly",
  [SubscriptionTimeInterval.Annually]: "Annually",
  [SubscriptionTimeInterval.LifeTime]: "Lifetime",
};

// Format a millisecond timestamp as "Mon YYYY" (e.g. "Mar 2025").
// Returns null when ms is falsy or the Date is invalid.
function fmtMonthYear(ms: number | undefined): string | null {
  if (!ms || ms <= 0) return null;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

// SS8.3 cadence chip: responsive fill + radius per frames.
// mobile = purple 5% fill + radius 12; desktop = purple 10% fill + fully rounded.
export function CadenceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-[calc(12*var(--fpx))] lg:rounded-full bg-brand-purple-5 lg:bg-brand-purple-10 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-label text-brand-purple">
      {label}
    </span>
  );
}

// Right-aligned meta column shown on each subscription row.
// Stacks: CadenceChip (from interval) above an optional "since / renews" line.
// Lifetime subscriptions never show a renews date.
// Accepts sinceMs/renewsMs as raw ms timestamps; prefix strings override the
// leading word (e.g. sincePrefix="since", renewsPrefix="renews").
export function SubscriptionMeta({
  interval,
  sinceMs,
  renewsMs,
  sincePrefix,
  renewsPrefix,
}: {
  interval: SubscriptionTimeInterval;
  sinceMs?: number;
  renewsMs?: number;
  sincePrefix?: string;
  renewsPrefix?: string;
}) {
  const chipLabel = CADENCE_LABEL[interval];
  const isLifetime = interval === SubscriptionTimeInterval.LifeTime;

  // "since Mon YYYY" -- uses short month+year format.
  const sincePart =
    sincePrefix && sinceMs ? fmtMonthYear(sinceMs) : null;
  const sinceText = sincePart ? `${sincePrefix} ${sincePart}` : null;

  // "renews Mon YYYY" -- uses short month+year. Suppressed for Lifetime.
  const renewsPart =
    !isLifetime && renewsPrefix && renewsMs
      ? fmtMonthYear(renewsMs)
      : null;
  const renewsText = renewsPart ? `${renewsPrefix} ${renewsPart}` : null;

  // For Lifetime with no sinceText, show "no renewal" line per design.
  const noRenewalText = isLifetime && !sinceText ? "no renewal" : null;

  // Compose the secondary line: join the two parts with " \u00b7 " if both
  // exist; otherwise use whichever is present.
  let metaLine: string | null = null;
  if (sinceText && renewsText) {
    metaLine = `${sinceText} \u00b7 ${renewsText}`;
  } else if (sinceText) {
    metaLine = sinceText;
  } else if (renewsText) {
    metaLine = renewsText;
  } else if (noRenewalText) {
    metaLine = noRenewalText;
  } else if (isLifetime) {
    metaLine = "no renewal";
  }

  return (
    <div className="flex flex-col items-end gap-[calc(6*var(--fpx))] text-right">
      <CadenceChip label={chipLabel} />
      {metaLine && (
        <span className="text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink-60">
          {metaLine}
        </span>
      )}
    </div>
  );
}

// Tinted note band leading the list (and empty state) to communicate the
// read-only boundary (wallet management arriving with monetization).
// Leads the content so mb- spacing separates it from the list below.
// mobile = purple 5% fill, 100% ink text;
// desktop = grey 5% fill + 1px grey-10% border + 60% ink text.
export function ActivityNoteBand({ text }: { text: string }) {
  return (
    <div className="mb-[calc(24*var(--fpx))] rounded-card px-[calc(16*var(--fpx))] py-[calc(12*var(--fpx))] bg-brand-purple-5 lg:bg-ink-border-5 lg:border lg:border-ink-border-10 text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink lg:text-ink-60">
      {text}
    </div>
  );
}
