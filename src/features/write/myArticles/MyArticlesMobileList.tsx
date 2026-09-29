// MyArticlesMobileList -- 393px mobile column for /my-articles.
// Figma frames: 2294:3003 (populated), 2295:9673 (empty), 2296:9692 (loading),
// 2297:9708 (error), 2299:9770 (action sheet), 2300:9806 (delete confirm).
//
// Renders inside AccountShell (mobile chrome already provided) so this is
// CONTENT only: heading + count, "New article" CTA, filter controls, card
// stack, and the three data states (loading skeleton / error / empty).

import { useState, useCallback, useEffect, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import { myArticlesCopy } from "../../../constants/copy";
import { myArticlesMobileCopy } from "./myArticlesMobileCopy";
import { IllustrationLoadError } from "../../../components/ui/icons/IllustrationLoadError";
import { MyArticleMobileCard } from "./MyArticleMobileCard";
import { MyArticlesActionSheet } from "./MyArticlesActionSheet";
import { KeysAndSalesSheet } from "./KeysAndSalesSheet";
import {
  SHEET_CANCEL_CLASS,
  SHEET_HANDLE_CLASS,
  SHEET_PANEL_CLASS,
  SHEET_ROW_CLASS,
} from "./myArticlesSheetStyles";
import { useModal } from "../../../services/modal";
import { buildArticleUrl } from "../../../lib/articleUrl";
import type { MyArticle, MyArticleFilter } from "./hooks/useMyArticles";
import type { MyArticleCounts } from "./hooks/useMyArticleCounts";

const mc = myArticlesMobileCopy;
const c = myArticlesCopy;

const FILTER_OPTIONS: { value: MyArticleFilter; label: string }[] = [
  { value: "all", label: mc.filterAll },
  { value: "published", label: mc.filterPublished },
  { value: "drafts", label: mc.filterDrafts },
  // NIC-573 (D-134): appended last, shown even when its count is 0.
  { value: "submitted", label: mc.filterSubmitted },
];

type CountsData = MyArticleCounts | undefined;

type Props = {
  filter: MyArticleFilter;
  onFilterChange: (f: MyArticleFilter) => void;
  countsData: CountsData;
  articles: MyArticle[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRefetch: () => void;
  onDelete: (article: MyArticle) => void;
  onUnpublish: (article: MyArticle) => void;
  deletingId: string | null;
  unpublishingId: string | null;
};

export function MyArticlesMobileList({
  filter,
  onFilterChange,
  countsData,
  articles,
  isPending,
  isError,
  onRefetch,
  onDelete,
  onUnpublish,
  deletingId,
  unpublishingId,
}: Props) {
  // Action sheet state -- which article the kebab was tapped on.
  const [sheetArticle, setSheetArticle] = useState<MyArticle | null>(null);
  // Filter picker sheet state.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const navigate = useNavigate();
  const modal = useModal();
  const keysAndSalesTitleId = useId();

  const closeSheet = useCallback(() => setSheetArticle(null), []);

  // Close filter sheet on Escape -- mirrors the action sheet Escape pattern.
  useEffect(() => {
    if (!filterSheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterSheetOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filterSheetOpen]);

  const totalCount = countsData ? countsData[filter] : null;

  // Opens the read-only Keys & sales panel (NIC-467) through the modal
  // service -- see KeysAndSalesSheet.tsx for why this sheet uses that
  // mechanic rather than the inline scrim+FocusTrap one this file's other
  // two sheets use.
  const openKeysAndSales = useCallback(
    (article: MyArticle) => {
      modal.open(
        <KeysAndSalesSheet
          titleId={keysAndSalesTitleId}
          postId={article.id}
          onDone={() => modal.close()}
        />,
        { ariaLabelledBy: keysAndSalesTitleId, dismissable: true },
      );
    },
    [modal, keysAndSalesTitleId],
  );

  // Derive empty-state message keyed by current filter.
  // The all-tab empty state uses c.empty.all below.
  const emptyMessage = filter === "all" ? null : c.empty[filter];

  return (
    <div className="px-4 pb-24 pt-4">
      {/* Page heading */}
      <h1 className="text-[22px] font-normal leading-[32px] text-ink-80">
        {c.heading}
      </h1>
      {/* Article count or loading skeleton */}
      {isPending ? (
        <div
          aria-hidden
          className="mt-1 h-4 w-20 animate-pulse rounded-[8px] bg-ink-border/10"
        />
      ) : (
        <p className="mt-1 text-[16px] leading-[24px] text-ink-60">
          {totalCount !== null
            ? mc.articlesCount(totalCount)
            : articles !== undefined
              ? mc.articlesCount(articles.length)
              : null}
        </p>
      )}
      {/* New article primary CTA */}
      <Link
        to="/write"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-gradient-button py-3 text-[18px] font-medium leading-[28px] text-white shadow-[var(--shadow-purple-glow-medium)]"
      >
        <PlusIcon />
        {c.newArticle}
      </Link>
      {/* Filter status + Sort secondary buttons */}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-[8px] border border-brand-purple bg-white py-3 text-[18px] font-medium leading-[28px] text-brand-purple"
        >
          <FilterIcon />
          {mc.filterStatusLabel}
        </button>
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 rounded-[8px] border border-brand-purple bg-white px-6 py-3 text-[18px] font-medium leading-[28px] text-brand-purple opacity-40"
          aria-label={mc.sortLabel}
        >
          <SortIcon />
          {mc.sortLabel}
        </button>
      </div>
      {/* Divider */}
      <div className="mt-4 h-px bg-ink-border/10" />
      {/* ---- Data states ---- */}
      {/* Loading skeleton -- 5 rows (Figma 2296:9692) */}
      {isPending && (
        <div aria-busy="true" className="mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}
      {/* Error state (Figma 2297:9708) */}
      {isError && !isPending && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <IllustrationLoadError className="h-[87px] w-[109px] text-ink-60" />
          <p className="text-[18px] font-bold leading-[28px] text-ink">
            {mc.errorTitle}
          </p>
          <p className="text-[16px] leading-[24px] text-ink-60">
            {mc.errorBody}
          </p>
          <button
            type="button"
            onClick={onRefetch}
            className="rounded-[8px] bg-brand-gradient-button px-6 py-3 text-[18px] font-medium leading-[28px] text-white shadow-[var(--shadow-purple-glow-medium)]"
          >
            {mc.tryAgain}
          </button>
        </div>
      )}
      {/* Empty state (Figma 2295:9673) */}
      {!isPending && !isError && articles !== undefined && articles.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          {emptyMessage ? (
            <p className="text-[16px] leading-[24px] text-ink-60">
              {emptyMessage}
            </p>
          ) : (
            <p className="text-[16px] leading-[24px] text-ink-60">
              {c.empty.all}
            </p>
          )}
          <Link
            to="/write"
            className="flex items-center gap-2 rounded-[8px] bg-brand-gradient-button px-6 py-3 text-[18px] font-medium leading-[28px] text-white shadow-[var(--shadow-purple-glow-medium)]"
          >
            <PlusIcon />
            {mc.writeFirst}
          </Link>
        </div>
      )}
      {/* Populated list */}
      {!isPending && !isError && articles !== undefined && articles.length > 0 && (
        <div className="mt-2">
          {articles.map((article) => (
            <MyArticleMobileCard
              key={article.id}
              article={article}
              deleting={deletingId === article.id}
              unpublishing={unpublishingId === article.id}
              onKebabClick={() => setSheetArticle(article)}
            />
          ))}
        </div>
      )}
      {/* Row action bottom sheet (Figma 2299:9770) */}
      <MyArticlesActionSheet
        article={sheetArticle}
        onClose={closeSheet}
        onView={() => {
          if (!sheetArticle) return;
          const to = buildArticleUrl({
            handle: sheetArticle.routeHandle,
            postId: sheetArticle.id,
            bucketCanisterId: sheetArticle.bucketCanisterId,
            title: sheetArticle.title,
          });
          navigate(to);
        }}
        onDelete={() => {
          if (sheetArticle) onDelete(sheetArticle);
        }}
        onUnpublish={() => {
          if (sheetArticle) onUnpublish(sheetArticle);
        }}
        onViewKeysSold={() => {
          if (sheetArticle) openKeysAndSales(sheetArticle);
        }}
      />
      {/* Filter picker sheet -- scrim-click and Escape both dismiss */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-ink/40"
            aria-hidden
            onClick={() => setFilterSheetOpen(false)}
          />
          {/* FocusTrap keeps keyboard focus inside the sheet while open. */}
          <FocusTrap open>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={mc.closeFilterAriaLabel}
              className={SHEET_PANEL_CLASS}
            >
              <div className={SHEET_HANDLE_CLASS} />
              <p className="mb-[calc(16*var(--fpx))] px-[calc(24*var(--fpx))] text-label font-bold text-ink">
                {mc.filterSheetTitle}
              </p>
              {/* Each row is a 64 box that includes its own 1px top divider;
                  the first row's divider is the header divider and there is
                  no divider under the last row (NIC-575, Figma 2862:3278). */}
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(opt.value);
                    setFilterSheetOpen(false);
                  }}
                  className={`${SHEET_ROW_CLASS} justify-between ${
                    filter === opt.value ? "text-brand-purple" : "text-ink"
                  }`}
                >
                  {opt.label}
                  {filter === opt.value && <CheckIcon />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className={SHEET_CANCEL_CLASS}
              >
                {mc.cancelLabel}
              </button>
            </div>
          </FocusTrap>
        </div>
      )}
    </div>
  );
}

// Skeleton row -- mirrors the "Row skeleton" frame in Figma 2296:9692.
function SkeletonRow() {
  return (
    <div className="flex flex-col py-3">
      <div className="flex gap-3">
        {/* Thumbnail placeholder */}
        <div
          aria-hidden
          className="h-[54px] w-[72px] shrink-0 animate-pulse rounded-[8px] bg-ink-border/10"
        />
        <div className="flex flex-1 flex-col justify-center gap-2">
          {/* Title bars */}
          <div
            aria-hidden
            className="h-3 w-[200px] max-w-full animate-pulse rounded-[8px] bg-ink-border/10"
          />
          <div
            aria-hidden
            className="h-3 w-[130px] animate-pulse rounded-[8px] bg-ink-border/5"
          />
          {/* Meta bar */}
          <div
            aria-hidden
            className="h-3 w-[150px] animate-pulse rounded-[8px] bg-ink-border/5"
          />
        </div>
      </div>
      {/* Status row skeleton -- status pill chip + kebab only (2296:9692) */}
      <div className="mt-2 flex items-center gap-2">
        <div
          aria-hidden
          className="h-5 w-10 animate-pulse rounded-[8px] bg-ink-border/10"
        />
        <span className="flex-1" />
        <div
          aria-hidden
          className="h-7 w-7 animate-pulse rounded-[8px] bg-ink-border/5"
        />
      </div>
      <div className="mt-3 h-px bg-ink-border/10" />
    </div>
  );
}

// Inline icon SVGs -- Plus, Filter, Sort, Check.
function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
      <path
        d="M1 1h20M5 10h12M9 19h4"
        stroke="#5405D4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
      <path
        d="M1 1h18M1 9h12M1 17h6"
        stroke="#5405D4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 24 design px (NIC-575); same checkmark path, scaled from its 20 viewBox.
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="h-[calc(24*var(--fpx))] w-[calc(24*var(--fpx))] shrink-0"
    >
      <path
        d="M4 10l5 5 7-8"
        stroke="#5405D4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
