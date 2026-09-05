import { useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../../../components/ui/Avatar";
import { usePublicationSubscribers } from "../hooks/usePublicationSubscribers";
import { publicationSubscribersCopy as c } from "../../../constants/copy";
import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";

// NIC-252 §6.9 Publication Subscribers section — read-only, editor-gated.
//
// Wireable-now (backend-truthful) elements are bound: the Reader / Supports
// since / Period / Fee per period columns and the Subscribers + This week
// counters. The earnings AGGREGATES (NUA earned counter, per-row Earned total,
// and the revenue-over-time chart) are deferred to the monetization work
// (NIC-44) and render in the zero/empty treatment — a muted em dash and the
// read-only note — rather than a client-side reconstruction of money.

const PAGE_SIZE = 8;

const PERIOD_LABEL: Record<SubscriptionTimeInterval, string> = {
  [SubscriptionTimeInterval.Weekly]: "Weekly",
  [SubscriptionTimeInterval.Monthly]: "Monthly",
  [SubscriptionTimeInterval.Annually]: "Annually",
  [SubscriptionTimeInterval.LifeTime]: "Lifetime",
};

// Format an e8s fee string → decimal display, or null when the plan is unpriced.
function feeToText(raw: string | undefined): string | null {
  if (!raw) return null;
  return parseFloat((Number(BigInt(raw)) / 1e8).toFixed(4)).toString();
}

// "Since Mon YYYY" from a ms timestamp.
function sinceLabel(startTimeMs: number): string {
  const d = new Date(startTimeMs);
  if (Number.isNaN(d.getTime())) return c.deferred;
  return `${c.sincePrefix} ${d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function Counter({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[calc(4*var(--fpx))]">
      <span className="text-title-md font-bold text-brand-purple">{value}</span>
      <span className="text-label text-ink-80">{label}</span>
    </div>
  );
}

function Counters({
  subscriberCount,
  newThisWeek,
}: {
  subscriberCount: number;
  newThisWeek: number;
}) {
  return (
    <div className="flex flex-row flex-wrap gap-[calc(48*var(--fpx))]">
      <Counter value={String(subscriberCount)} label={c.counterSubscribers} />
      {/* NUA earned — deferred to the monetization work (NIC-44). */}
      <Counter value={c.deferred} label={c.counterEarned} />
      <Counter value={`+${newThisWeek}`} label={c.counterThisWeek} />
    </div>
  );
}

const ROW_GRID =
  "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-[calc(16*var(--fpx))]";

export function PublicationSubscribers({ handle }: { handle: string }) {
  const {
    subscribers,
    feeByInterval,
    subscriberCount,
    newThisWeek,
    isLoading,
    isError,
    refetch,
  } = usePublicationSubscribers(handle);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Loading skeleton.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-[calc(24*var(--fpx))]" aria-busy="true">
        <Skeleton variant="text" sx={{ width: "40%", height: 28 }} />
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </div>
      </div>
    );
  }

  // Error + retry.
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-[calc(16*var(--fpx))] py-[calc(96*var(--fpx))] text-center">
        <h2 className="text-title-sm font-bold text-ink">
          {c.loadErrorHeading}
        </h2>
        <p className="text-body text-ink-80">{c.loadErrorBody}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-[calc(8*var(--fpx))] rounded-card border border-ink-border-10 px-[calc(24*var(--fpx))] py-[calc(10*var(--fpx))] text-body font-medium text-brand-purple hover:border-brand-purple"
        >
          {c.retryLabel}
        </button>
      </div>
    );
  }

  // Empty — zeroed counters, no table.
  if (subscriberCount === 0) {
    return (
      <div className="flex flex-col gap-[calc(32*var(--fpx))]">
        <Counters subscriberCount={0} newThisWeek={0} />
        <p className="text-body text-ink-80">{c.emptyBody}</p>
        <p className="text-label text-ink-60">{c.monetizationNote}</p>
      </div>
    );
  }

  // Populated.
  const shown = subscribers.slice(0, visible);
  const hasMore = subscribers.length > visible;

  return (
    <div className="flex flex-col gap-[calc(32*var(--fpx))]">
      <Counters subscriberCount={subscriberCount} newThisWeek={newThisWeek} />

      <div className="flex flex-col">
        {/* Header row */}
        <div
          className={`${ROW_GRID} border-b border-ink-border-10 py-[calc(12*var(--fpx))] text-label font-bold uppercase text-ink-60`}
        >
          <span>{c.colReader}</span>
          <span>{c.colSince}</span>
          <span>{c.colPeriod}</span>
          <span>{c.colFee}</span>
          <span>{c.colEarned}</span>
        </div>

        {/* Rows — read-only, no row action */}
        {shown.map((s) => {
          const fee = feeToText(feeByInterval[s.subscriptionTimeInterval]);
          return (
            <div
              key={s.readerPrincipalId}
              className={`${ROW_GRID} items-center border-b border-ink-border-10 py-[calc(16*var(--fpx))]`}
            >
              <div className="flex min-w-0 items-center gap-[calc(12*var(--fpx))]">
                <Avatar
                  src={s.avatar}
                  label={s.displayName || s.handle || "?"}
                  sizeClass="h-12 w-12"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body font-bold text-ink">
                    {s.displayName || s.handle || s.readerPrincipalId}
                  </span>
                  {s.handle ? (
                    <span className="truncate text-label text-ink-60">
                      @{s.handle}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="text-body text-ink-80">
                {sinceLabel(s.startTimeMs)}
              </span>
              <span>
                <span className="inline-flex rounded-full bg-brand-purple-10 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-label text-brand-purple">
                  {PERIOD_LABEL[s.subscriptionTimeInterval]}
                </span>
              </span>
              <span className="text-body text-ink-80">
                {fee ? `${fee} ${c.feeUnit}` : c.deferred}
              </span>
              {/* Earned total — deferred to the monetization work (NIC-44). */}
              <span className="text-body text-ink-40">{c.deferred}</span>
            </div>
          );
        })}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-card border border-ink-border-10 px-[calc(24*var(--fpx))] py-[calc(10*var(--fpx))] text-body font-medium text-brand-purple hover:border-brand-purple"
          >
            {c.showMore}
          </button>
        </div>
      ) : null}

      <p className="text-label text-ink-60">{c.monetizationNote}</p>
    </div>
  );
}
