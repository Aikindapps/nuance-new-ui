import { useState } from "react";
import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { performanceCopy } from "../../../constants/copy";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { useManageArticles, type ManageArticleRow } from "../hooks/useManageArticles";
import { usePublicationPostCounts, type PublicationPostCounts } from "../hooks/usePublicationPostCounts";

// ─── KPI Tiles ────────────────────────────────────────────────────────────────

function KpiTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-ink-border/10 bg-surface p-6 flex flex-col gap-2">
      <span className="text-[length:calc(36*var(--fpx))] font-normal text-ink leading-tight">
        {value.toLocaleString()}
      </span>
      <span className="text-sm text-ink-60">{label}</span>
    </div>
  );
}

function KpiTileSkeleton() {
  return (
    <div className="rounded-card border border-ink-border/10 bg-surface p-6 flex flex-col gap-2">
      <Skeleton variant="rectangular" sx={{ width: 90, height: 28, borderRadius: 6 }} />
      <Skeleton variant="rectangular" sx={{ width: 110, height: 16, borderRadius: 6 }} />
    </div>
  );
}

function KpiRowReal({ counts }: { counts: PublicationPostCounts }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiTile label={performanceCopy.kpiTotalViews} value={counts.totalViews} />
      <KpiTile label={performanceCopy.kpiTotalClaps} value={counts.totalClaps} />
      <KpiTile label={performanceCopy.kpiUniqueReaders} value={counts.uniqueReaders} />
      <KpiTile label={performanceCopy.kpiPublished} value={counts.published} />
    </div>
  );
}

function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <KpiTileSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Table header (desktop lg+) ───────────────────────────────────────────────

function TableHead({
  sortKey,
  onSort,
}: {
  sortKey: "views" | "claps";
  onSort: (k: "views" | "claps") => void;
}) {
  return (
    <thead>
      <tr className="border-b border-ink-border/10 text-left text-xs font-medium uppercase tracking-wide text-ink-60">
        <th scope="col" className="py-3 pr-4">
          {performanceCopy.colTitle}
        </th>
        <th scope="col" className="w-36 py-3 pr-4">
          {performanceCopy.colCategory}
        </th>
        <th scope="col" className="w-28 py-3 pr-4">
          {performanceCopy.colPublished}
        </th>
        <th
          scope="col"
          className="w-24 py-3 pr-4"
          aria-sort={sortKey === "views" ? "descending" : "none"}
        >
          <button
            type="button"
            onClick={() => onSort("views")}
            className={
              sortKey === "views"
                ? "inline-flex items-center gap-1 font-bold text-brand-purple"
                : "inline-flex items-center gap-1 text-ink-60 hover:text-ink"
            }
          >
            {performanceCopy.colViews}
            {sortKey === "views" && (
              <span aria-hidden="true">▾</span>
            )}
          </button>
        </th>
        <th
          scope="col"
          className="w-24 py-3"
          aria-sort={sortKey === "claps" ? "descending" : "none"}
        >
          <button
            type="button"
            onClick={() => onSort("claps")}
            className={
              sortKey === "claps"
                ? "inline-flex items-center gap-1 font-bold text-brand-purple"
                : "inline-flex items-center gap-1 text-ink-60 hover:text-ink"
            }
          >
            {performanceCopy.colClaps}
            {sortKey === "claps" && (
              <span aria-hidden="true">▾</span>
            )}
          </button>
        </th>
      </tr>
    </thead>
  );
}

// ─── Desktop table row (lg+) ─────────────────────────────────────────────────

function TableRow({ row }: { row: ManageArticleRow }) {
  const url = buildArticleUrl({
    handle: row.article.routeHandle,
    postId: row.postId,
    bucketCanisterId: row.bucketCanisterId,
    title: row.article.title,
  });

  return (
    <tr className="border-b border-ink-border/10 align-middle">
      <td className="py-3 pr-4">
        <Link
          to={url}
          className="line-clamp-2 font-medium text-ink hover:underline"
        >
          {row.article.title}
        </Link>
      </td>
      <td className="py-3 pr-4">
        <span className="block truncate text-sm text-ink-80">
          {row.category || performanceCopy.emptyCell}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-sm text-ink-80">
          {row.published || performanceCopy.emptyCell}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-ink">{row.views.toLocaleString()}</span>
      </td>
      <td className="py-3">
        <span className="text-ink">{row.claps.toLocaleString()}</span>
      </td>
    </tr>
  );
}

// ─── Mobile stacked card (<lg) ────────────────────────────────────────────────

function MobileCard({ row }: { row: ManageArticleRow }) {
  const url = buildArticleUrl({
    handle: row.article.routeHandle,
    postId: row.postId,
    bucketCanisterId: row.bucketCanisterId,
    title: row.article.title,
  });

  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink-border/10 bg-white p-4">
      <Link
        to={url}
        className="line-clamp-2 font-medium text-ink hover:underline"
      >
        {row.article.title}
      </Link>
      <p className="truncate text-sm text-ink-80">
        {row.category || performanceCopy.emptyCell}
        {row.published ? ` – ${row.published}` : ""}
      </p>
      <div className="flex gap-6 text-sm">
        <span className="text-ink-60">
          {performanceCopy.colViews}:{" "}
          <span className="font-medium text-ink">{row.views.toLocaleString()}</span>
        </span>
        <span className="text-ink-60">
          {performanceCopy.colClaps}:{" "}
          <span className="font-medium text-ink">{row.claps.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton states ──────────────────────────────────────────────────────────

function TableRowSkeleton() {
  return (
    <tr className="border-b border-ink-border/10">
      {[260, 90, 80, 48, 48].map((w, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton variant="rectangular" sx={{ width: w, height: 16, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink-border/10 bg-white p-4">
      <Skeleton variant="text" sx={{ height: 20, width: "80%" }} />
      <Skeleton variant="text" sx={{ height: 16, width: "50%" }} />
      <Skeleton variant="text" sx={{ height: 14, width: "60%" }} />
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-ink-border/10 bg-ink-border/5 p-12 text-center"
    >
      <p className="text-[length:calc(22*var(--fpx))] font-normal text-ink-80">
        {performanceCopy.listErrorHeading}
      </p>
      <p className="mt-3 text-sm text-ink-60">{performanceCopy.listErrorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-card border border-brand-purple px-6 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        {performanceCopy.retryLabel}
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ handle }: { handle: string }) {
  return (
    <div className="rounded-card border border-ink-border/10 bg-ink-border/5 p-12 text-center">
      <p className="text-[length:calc(22*var(--fpx))] font-normal text-ink-80">
        {performanceCopy.emptyHeading}
      </p>
      <p className="mt-3 text-sm text-ink-60">{performanceCopy.emptyBody}</p>
      <Link
        to={`/write?publication=${encodeURIComponent(handle)}`}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-card bg-brand-purple px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {performanceCopy.writeArticleCta}
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { handle: string };

export function PerformanceDashboard({ handle }: Props) {
  const [sortKey, setSortKey] = useState<"views" | "claps">("views");

  const {
    counts,
    isLoading: countsLoading,
    isError: countsError,
    refetch: refetchCounts,
  } = usePublicationPostCounts(handle);

  const {
    rows,
    isLoading: articlesLoading,
    isError: articlesError,
    refetch: refetchArticles,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useManageArticles(handle);

  const isLoading = articlesLoading || countsLoading;
  const isError = articlesError || countsError;

  const SKELETON_COUNT = 6;

  // Error state — replaces tiles+table region
  if (!isLoading && isError) {
    return (
      <div className="flex flex-col gap-6">
        <ErrorState
          onRetry={() => {
            void refetchCounts();
            void refetchArticles();
          }}
        />
      </div>
    );
  }

  // ── LOADING branch ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* KPI skeleton row */}
        <KpiRowSkeleton />

        {/* By-article header skeletons */}
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" sx={{ width: 120, height: 20, borderRadius: 6 }} />
          <Skeleton variant="rectangular" sx={{ width: 110, height: 48, borderRadius: 8 }} />
        </div>

        {/* Table skeleton rows */}
        <div className="hidden lg:block" aria-busy="true" aria-live="polite">
          <span className="sr-only">{performanceCopy.loading}</span>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-ink-border/10">
                {[260, 90, 80, 48, 48].map((_w, i) => (
                  <th key={i} className="py-3 pr-4" />
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="flex flex-col gap-4 lg:hidden"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">{performanceCopy.loading}</span>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── EMPTY branch ───────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState handle={handle} />
      </div>
    );
  }

  // ── POPULATED branch ───────────────────────────────────────────────────────
  const sortedRows = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI stat row */}
      <KpiRowReal counts={counts!} />

      {/* Zero-data helper (C state) */}
      {counts && counts.totalViews === 0 && (
        <p className="text-sm text-ink-60">{performanceCopy.noViewsHelper}</p>
      )}

      {/* By-article card header */}
      <div className="flex items-center justify-between">
        <span className="text-[length:calc(18*var(--fpx))] font-bold text-ink-80">
          {performanceCopy.byArticleHeading}
        </span>
        <button
          type="button"
          onClick={() => setSortKey(sortKey === "views" ? "claps" : "views")}
          className="inline-flex h-12 items-center justify-center rounded-card border border-brand-purple px-6 text-[length:calc(18*var(--fpx))] font-normal text-brand-purple transition-colors hover:bg-brand-purple-5"
        >
          {performanceCopy.sortLabel}: {sortKey === "views" ? performanceCopy.sortViews : performanceCopy.sortClaps}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <table className="w-full table-auto border-collapse">
          <TableHead sortKey={sortKey} onSort={setSortKey} />
          <tbody>
            {sortedRows.map((row) => (
              <TableRow key={row.postId} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-4 lg:hidden">
        {sortedRows.map((row) => (
          <MobileCard key={row.postId} row={row} />
        ))}
      </div>

      {/* Show more (F) */}
      {hasNextPage && (
        <div className="w-full">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full inline-flex h-12 items-center justify-center rounded-card border border-brand-purple px-6 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingNextPage ? performanceCopy.showingMore : performanceCopy.showMore}
          </button>
        </div>
      )}
    </div>
  );
}
