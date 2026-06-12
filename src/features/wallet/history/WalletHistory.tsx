import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { historyCopy } from "../../../constants/copy";
import { IconChevronRight } from "../../../components/ui/icons/IconChevronRight";
import { useWalletHistory, type HistoryRow } from "./useWalletHistory";

const PAGE_SIZE = 7; // rows per page (Figma 1:46484 shows 7 + pager)

// "30 sep 11:55" — day, lowercase month abbreviation, 24h time (Figma).
function formatRowDate(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const month = d.toLocaleString("en", { month: "short" }).toLowerCase();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${month} ${hh}:${mm}`;
}

// Pager slots: 1 … around-current … last, with "…" placeholders (Figma shows
// chevrons + up to 5 number slots).
function pageSlots(current: number, total: number): Array<number | "…"> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "…", total];
  if (current >= total - 2) return [1, "…", total - 2, total - 1, total];
  return [1, "…", current, "…", total];
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
  return <span className="truncate text-body text-ink">{target.label}</span>;
}

// Wallet history table (Figma 1:46484): 4 columns — Amount (medium weight) /
// Date / For-from article / Description — with a numbered pager. Data comes
// from useWalletHistory's 7-source aggregation; pagination is client-side over
// the merged, sorted rows.
export function WalletHistory() {
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

  const colAmount = "w-[calc(120*var(--fpx))] shrink-0";
  const colDate = "w-[calc(94*var(--fpx))] shrink-0";
  const colTarget = "w-[calc(288*var(--fpx))] shrink-0 min-w-0";

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className="flex flex-col gap-[calc(8*var(--fpx))] text-ink-80">
        <h2 className="text-lg font-bold text-ink-80">{c.heading}</h2>
        <p className="text-label leading-[var(--text-label--line-height)]">
          {c.body}
        </p>
      </div>

      {/* Figma has no mobile wallet variant — the 4-column table keeps its
          desktop column widths and scrolls horizontally under ~640px (the
          project's horizontal-rail mobile pattern). */}
      <div className="scrollbar-hide flex flex-col gap-[calc(24*var(--fpx))] overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Header row */}
          <div className="flex gap-[calc(40*var(--fpx))] border-b border-ink-border-5 pb-2 text-body text-ink-60">
            <span className={colAmount}>{c.colAmount}</span>
            <span className={colDate}>{c.colDate}</span>
            <span className={colTarget}>{c.colTarget}</span>
            <span className="min-w-0 flex-1">{c.colDescription}</span>
          </div>

          {history.isError ? (
            <p className="pt-4 text-body text-ink-60">{c.loadError}</p>
          ) : history.isPending ? (
            <p className="pt-4 text-body text-ink-60">{c.loading}</p>
          ) : rows.length === 0 ? (
            <p className="pt-4 text-body text-ink-60">{c.empty}</p>
          ) : (
            pageRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-[calc(40*var(--fpx))] border-b border-ink-border-5 pb-2 pt-[calc(18*var(--fpx))]"
              >
                <span className={`${colAmount} text-body font-medium text-ink`}>
                  {row.sign} {row.amount} {row.token}
                </span>
                <span className={`${colDate} text-body text-ink`}>
                  {formatRowDate(row.timestampMs)}
                </span>
                <span className={`${colTarget} flex`}>
                  <TargetCell target={row.target} />
                </span>
                <span className="min-w-0 flex-1 truncate text-body text-ink">
                  {row.description}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {!history.isPending && !history.isError && rows.length > 0 && (
        <>
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label={c.pagePrev}
                disabled={clampedPage === 1}
                onClick={() => setPage(clampedPage - 1)}
                className="flex size-8 items-center justify-center rounded text-brand-purple transition-colors hover:bg-brand-purple-5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronRight className="size-5 rotate-180" />
              </button>
              {pageSlots(clampedPage, totalPages).map((slot, i) =>
                slot === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-body font-medium text-brand-purple">
                    …
                  </span>
                ) : (
                  <button
                    key={slot}
                    type="button"
                    aria-current={slot === clampedPage ? "page" : undefined}
                    onClick={() => setPage(slot)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-body font-medium text-brand-purple transition-colors ${
                      slot === clampedPage
                        ? "bg-brand-purple-10"
                        : "hover:bg-brand-purple-5"
                    }`}
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
                className="flex size-8 items-center justify-center rounded text-brand-purple transition-colors hover:bg-brand-purple-5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronRight className="size-5" />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
