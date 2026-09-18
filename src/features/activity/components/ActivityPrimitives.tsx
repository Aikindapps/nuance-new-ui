import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { secondaryButtonSx } from "../../../components/ui/modalButtons";
import type { UserListItem } from "../../../candid/User/User";

// NIC-359 / NIC-372 — shared Activity hub primitives.
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
