import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { historyCopy } from "../../../constants/copy";
import { walletMobileCopy } from "./walletMobileCopy";
import {
  IconChevronRight,
} from "../../../components/ui/icons/IconChevronRight";
import {
  useWalletHistory,
  type HistoryRow,
} from "../history/useWalletHistory";

const PAGE_SIZE = 7;
const SKELETON_ROWS = 4;
const GAP = "\u2026";

function formatRowDate(ms: number): string {
  if (!ms) return "-";
  const d = new Date(ms);
  const month = d
    .toLocaleString("en", { month: "short" })
    .toLowerCase();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${month} ${hh}:${mm}`;
}

function pageSlots(
  current: number,
  total: number,
): Array<number | typeof GAP> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) return [1, 2, 3, GAP, total];
  if (current >= total - 2) {
    return [1, GAP, total - 2, total - 1, total];
  }
  return [1, GAP, current, GAP, total];
}

const CARD_CLASS = [
  "flex flex-col gap-2 border-b border-ink-border-5",
  "pb-4 pt-4",
].join(" ");

const SKELETON_BAR =
  "animate-pulse rounded-[8px] bg-ink-border/10";

const PAGER_BTN_CLASS = [
  "flex size-8 items-center justify-center rounded",
  "text-brand-purple transition-colors",
  "hover:bg-brand-purple-5 disabled:cursor-not-allowed",
  "disabled:opacity-40",
].join(" ");

const RETRY_BTN_CLASS = [
  "rounded-card border border-brand-purple bg-white",
  "px-6 py-2.5 text-body font-medium text-brand-purple",
].join(" ");

const AMOUNT_CLASS =
  "shrink-0 whitespace-nowrap text-body font-medium text-ink";

const TITLE_CLASS =
  "min-w-0 truncate text-body font-medium text-ink";

const GAP_SPAN_CLASS =
  "px-1 text-body font-medium text-brand-purple";

const NUMBER_BTN_BASE = [
  "flex h-8 min-w-8 items-center justify-center rounded",
  "px-2 text-body font-medium text-brand-purple",
  "transition-colors",
].join(" ");

function numberBtnClass(active: boolean): string {
  const state = active
    ? "bg-brand-purple-10"
    : "hover:bg-brand-purple-5";
  return `${NUMBER_BTN_BASE} ${state}`;
}

function TargetCell({ target }: { target: HistoryRow["target"] }) {
  if (target.url) {
    return (
      <Link
        to={target.url}
        className="truncate text-body text-brand-purple underline"
      >
        {target.label}
      </Link>
    );
  }
  return (
    <span className="truncate text-body text-ink">
      {target.label}
    </span>
  );
}

// Phone wallet history (Figma 2419:4829): the desktop 4-column table
// does not fit 361px, so each HistoryRow renders as a stacked card
// carrying all four values. Pagination stays client-side, PAGE_SIZE 7.
export function WalletHistoryMobile() {
  const history = useWalletHistory();
  const [page, setPage] = useState(1);
  const c = historyCopy;

  const rows = useMemo(() => history.data ?? [], [history.data]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE,
  );

  const headingWrapClass =
    "flex flex-col gap-[calc(8*var(--fpx))] text-ink-80";
  const bodyClass =
    "text-label leading-[var(--text-label--line-height)]";

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className={headingWrapClass}>
        <h2 className="text-lg font-bold text-ink-80">{c.heading}</h2>
        <p className={bodyClass}>{c.body}</p>
      </div>

      {history.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <div key={i} aria-hidden className={CARD_CLASS}>
              <span className={`h-4 w-2/3 ${SKELETON_BAR}`} />
              <div className="flex items-center justify-between">
                <span className={`h-3 w-1/3 ${SKELETON_BAR}`} />
                <span className={`h-4 w-1/5 ${SKELETON_BAR}`} />
              </div>
            </div>
          ))}
        </div>
      ) : history.isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body text-ink-60">{c.loadError}</p>
          <button
            type="button"
            onClick={() => history.refetch()}
            className={RETRY_BTN_CLASS}
          >
            {walletMobileCopy.retryLabel}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col gap-1 py-2 text-center">
          <p className="text-lg font-bold text-ink">
            {walletMobileCopy.historyEmpty}
          </p>
          <p className="text-body text-ink-60">
            {walletMobileCopy.historyEmptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {pageRows.map((row) => (
            <div key={row.id} className={CARD_CLASS}>
              <div
                className="flex items-center justify-between gap-4"
              >
                <span className={TITLE_CLASS}>
                  <TargetCell target={row.target} />
                </span>
                <span className={AMOUNT_CLASS}>
                  {row.sign} {row.amount} {row.token}
                </span>
              </div>
              <div
                className="flex items-center justify-between gap-4"
              >
                <span className="text-body text-ink-60">
                  {formatRowDate(row.timestampMs)}
                </span>
                <span className="truncate text-body text-ink-60">
                  {row.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!history.isPending &&
        !history.isError &&
        rows.length > 0 &&
        totalPages > 1 && (
          <nav
            aria-label={c.pagerAria}
            className="flex items-center justify-center gap-2"
          >
            <button
              type="button"
              aria-label={c.pagePrev}
              disabled={clampedPage === 1}
              onClick={() => setPage(clampedPage - 1)}
              className={PAGER_BTN_CLASS}
            >
              <IconChevronRight className="size-5 rotate-180" />
            </button>
            {pageSlots(clampedPage, totalPages).map((slot, i) =>
              slot === GAP ? (
                <span
                  key={`gap-${i}`}
                  className={GAP_SPAN_CLASS}
                >
                  {GAP}
                </span>
              ) : (
                <button
                  key={slot}
                  type="button"
                  aria-current={
                    slot === clampedPage ? "page" : undefined
                  }
                  onClick={() => setPage(slot)}
                  className={numberBtnClass(slot === clampedPage)}
                >
                  {slot}
                </button>
              ),
            )}
            <button
              type="button"
              aria-label={c.pageNext}
              disabled={clampedPage === totalPages}
              onClick={() => setPage(clampedPage + 1)}
              className={PAGER_BTN_CLASS}
            >
              <IconChevronRight className="size-5" />
            </button>
          </nav>
        )}
    </section>
  );
}
