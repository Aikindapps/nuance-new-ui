import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { manageArticlesCopy } from "../../../constants/copy";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { useManageArticles, type ManageArticleRow } from "../hooks/useManageArticles";
import { PublishToggle } from "./PublishToggle";

// ─── Stats icon (disabled; NIC-57 will expand) ───────────────────────────────

function StatsButton() {
  return (
    <button
      type="button"
      disabled
      aria-label={manageArticlesCopy.statsComingSoonAriaLabel}
      title={manageArticlesCopy.statsComingSoonAriaLabel}
      className="flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded text-ink-60 opacity-40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="9" width="4" height="8" rx="1" fill="currentColor" />
        <rect x="7" y="5" width="4" height="12" rx="1" fill="currentColor" />
        <rect x="13" y="1" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
}

// ─── Table header row (desktop lg+) ──────────────────────────────────────────

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-ink-border/10 text-left text-xs font-medium uppercase tracking-wide text-ink-60">
        <th scope="col" className="w-16 py-3 pr-4">
          {manageArticlesCopy.colLive}
        </th>
        <th scope="col" className="py-3 pr-4">
          {manageArticlesCopy.colTitle}
        </th>
        <th scope="col" className="w-36 py-3 pr-4">
          {manageArticlesCopy.colAuthor}
        </th>
        <th scope="col" className="w-32 py-3 pr-4">
          {manageArticlesCopy.colCategory}
        </th>
        <th scope="col" className="w-24 py-3 pr-4">
          {manageArticlesCopy.colPublished}
        </th>
        <th scope="col" className="w-24 py-3 pr-4">
          {manageArticlesCopy.colModified}
        </th>
        <th scope="col" className="w-12 py-3">
          <span className="sr-only">{manageArticlesCopy.colStats}</span>
        </th>
      </tr>
    </thead>
  );
}

// ─── Desktop table row (lg+) ─────────────────────────────────────────────────

function TableRow({ handle, row }: { handle: string; row: ManageArticleRow }) {
  const url = buildArticleUrl({
    handle: row.article.routeHandle,
    postId: row.postId,
    bucketCanisterId: row.bucketCanisterId,
    title: row.article.title,
  });

  return (
    <tr className="border-b border-ink-border/10 align-middle">
      <td className="py-3 pr-4">
        <PublishToggle handle={handle} row={row} />
      </td>
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
          {row.article.author.handle}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="block truncate text-sm text-ink-80">
          {row.category || manageArticlesCopy.emptyCell}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-sm text-ink-60">{row.published || manageArticlesCopy.emptyCell}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-sm text-ink-60">{row.modified || manageArticlesCopy.emptyCell}</span>
      </td>
      <td className="py-3">
        <StatsButton />
      </td>
    </tr>
  );
}

// ─── Mobile stacked card (<lg) ────────────────────────────────────────────────

function MobileCard({ handle, row }: { handle: string; row: ManageArticleRow }) {
  const url = buildArticleUrl({
    handle: row.article.routeHandle,
    postId: row.postId,
    bucketCanisterId: row.bucketCanisterId,
    title: row.article.title,
  });

  const metaParts = [
    row.category,
    row.published,
    row.modified,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-ink-border/10 bg-white p-4">
      {/* Live toggle / NFT badge */}
      <div className="flex items-center gap-3">
        <PublishToggle handle={handle} row={row} />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-60">
          {manageArticlesCopy.colLive}
        </span>
      </div>

      {/* Thumbnail */}
      {row.article.imageSrc && (
        <div className="h-[58px] w-[83px] shrink-0 overflow-hidden rounded-card bg-ink-border/10">
          <img
            src={row.article.imageSrc}
            alt={row.article.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Title (2-line clamp) */}
      <Link
        to={url}
        className="line-clamp-2 font-medium text-ink hover:underline"
      >
        {row.article.title}
      </Link>

      {/* Author (ellipsis) */}
      <p className="truncate text-sm text-ink-80">{row.article.author.handle}</p>

      {/* Meta line: Category – Published – Modified */}
      {metaParts.length > 0 && (
        <p className="truncate text-xs text-ink-60">
          {metaParts.join(" – ")}
        </p>
      )}

      {/* Stats (disabled) */}
      <div>
        <StatsButton />
      </div>
    </div>
  );
}

// ─── Skeleton states ──────────────────────────────────────────────────────────

function TableRowSkeleton() {
  return (
    <tr className="border-b border-ink-border/10">
      {[80, 240, 120, 100, 80, 80, 40].map((w, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton variant="text" sx={{ width: w, height: 20 }} />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-ink-border/10 bg-white p-4">
      <Skeleton variant="rectangular" sx={{ width: 44, height: 24, borderRadius: 12 }} />
      <Skeleton variant="rectangular" sx={{ width: 83, height: 58, borderRadius: 8 }} />
      <Skeleton variant="text" sx={{ height: 20, width: "80%" }} />
      <Skeleton variant="text" sx={{ height: 16, width: "50%" }} />
      <Skeleton variant="text" sx={{ height: 14, width: "70%" }} />
    </div>
  );
}

// ─── Header (title + action buttons) ─────────────────────────────────────────

function ListHeader({ handle }: { handle: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* "+ New article" — navigates to the write form pre-seeded with this publication */}
      <Link
        to={`/write?publication=${encodeURIComponent(handle)}`}
        className="inline-flex h-10 items-center justify-center rounded-card border border-brand-purple px-4 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        {manageArticlesCopy.newArticle}
      </Link>

      {/* "Filter status" — disabled placeholder */}
      <button
        type="button"
        disabled
        className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-card border border-ink-border/20 px-4 text-sm font-medium text-ink-80 opacity-40"
      >
        {manageArticlesCopy.filterStatus}
      </button>

      {/* "Sort" — disabled placeholder */}
      <button
        type="button"
        disabled
        className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-card border border-ink-border/20 px-4 text-sm font-medium text-ink-80 opacity-40"
      >
        {manageArticlesCopy.sort}
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ handle }: { handle: string }) {
  return (
    <div className="rounded-card border border-ink-border/10 bg-ink-border/5 p-12 text-center">
      <p className="text-title-sm font-bold text-ink">
        {manageArticlesCopy.emptyHeading}
      </p>
      <p className="mt-2 text-sm text-ink-80">{manageArticlesCopy.emptyBody}</p>
      <Link
        to={`/write?publication=${encodeURIComponent(handle)}`}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-card border border-brand-purple px-4 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        {manageArticlesCopy.newArticle}
      </Link>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-ink-border/10 bg-ink-border/5 p-6"
    >
      <p className="font-bold text-ink">{manageArticlesCopy.listErrorHeading}</p>
      <p className="mt-2 text-sm text-ink-80">{manageArticlesCopy.listErrorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-4 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
      >
        {manageArticlesCopy.retryLabel}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { handle: string };

export function ManageArticlesList({ handle }: Props) {
  const {
    rows,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useManageArticles(handle);

  const SKELETON_COUNT = 5;

  return (
    <div className="flex flex-col gap-6">
      {/* Header action buttons */}
      <ListHeader handle={handle} />

      {/* Loading — skeleton rows */}
      {isLoading && (
        <>
          {/* Desktop skeleton table */}
          <div className="hidden lg:block" aria-busy="true" aria-live="polite">
            <span className="sr-only">{manageArticlesCopy.loadingArticles}</span>
            <table className="w-full table-auto border-collapse">
              <TableHead />
              <tbody>
                {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile skeleton cards */}
          <div
            className="flex flex-col gap-4 lg:hidden"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">{manageArticlesCopy.loadingArticles}</span>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <ErrorState onRetry={() => void refetch()} />
      )}

      {/* Empty state */}
      {!isLoading && !isError && rows.length === 0 && <EmptyState handle={handle} />}

      {/* Populated — desktop table */}
      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div className="hidden lg:block">
            <table className="w-full table-auto border-collapse">
              <TableHead />
              <tbody>
                {rows.map((row) => (
                  <TableRow key={row.postId} handle={handle} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="flex flex-col gap-4 lg:hidden">
            {rows.map((row) => (
              <MobileCard key={row.postId} handle={handle} row={row} />
            ))}
          </div>
        </>
      )}

      {/* Pagination — "Load more" */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingNextPage ? manageArticlesCopy.loadingMore : manageArticlesCopy.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
