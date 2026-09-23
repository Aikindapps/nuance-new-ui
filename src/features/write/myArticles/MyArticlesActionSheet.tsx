// MyArticlesActionSheet -- bottom-sheet row-action menu (Figma 2299:9770).
// Slides up over a 40% scrim; actions are View article / Delete / Unpublish
// (Delete and Unpublish only for personal posts per NIC-180 scope rules).
// The sheet calls the handlers it receives; delete/unpublish confirmation
// modals are opened by the parent (MyArticlesMobileList).

import { useEffect } from "react";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import { myArticlesCopy } from "../../../constants/copy";
import { myArticlesMobileCopy } from "./myArticlesMobileCopy";
import type { MyArticle } from "./hooks/useMyArticles";

const mc = myArticlesMobileCopy;
const c = myArticlesCopy;

type Props = {
  article: MyArticle | null;
  onClose: () => void;
  onView: () => void;
  onDelete: () => void;
  onUnpublish: () => void;
  onViewKeysSold: () => void;
};

export function MyArticlesActionSheet({
  article,
  onClose,
  onView,
  onUnpublish,
  onDelete,
  onViewKeysSold,
}: Props) {
  const isOpen = article !== null;

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const isPersonal = article.publication === null;
  const isPublished = !article.isDraft;
  // Delete is offered for all personal posts; Unpublish only for published
  // personal posts (matching the desktop MyArticleCard guard logic).
  const canDelete = isPersonal;
  const canUnpublish = isPersonal && isPublished;

  const statusLabel = isPublished ? mc.published : c.draftPill;
  const metaLine = article.publishedOn
    ? statusLabel + " \u00b7 " + article.publishedOn
    : statusLabel;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Scrim -- ~40% as specified */}
      <div
        className="absolute inset-0 bg-ink/40"
        aria-hidden
        onClick={onClose}
      />
      {/* FocusTrap keeps keyboard focus inside the sheet while open. */}
      <FocusTrap open>
        {/* Sheet panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mc.closeSheetAriaLabel}
          className="relative flex flex-col rounded-t-[16px] bg-white px-4 pb-8 pt-3 shadow-[0_-4px_24px_0_rgba(55,58,73,0.12)]"
        >
          {/* Drag handle bar */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-border/20" />
          {/* Article mini-header */}
          <p className="line-clamp-1 text-[16px] font-bold leading-[24px] text-ink">
            {article.title}
          </p>
          <p className="mb-4 mt-0.5 text-[14px] leading-[20px] text-ink-60">
            {metaLine}
          </p>
          <div className="h-px bg-ink-border/10" />
          {/* View keys sold -- FIRST item, minted articles only (Figma
              2299:9770 draws this menu as View keys sold / View article /
              Change category / Delete / Cancel). The shipped menu differs
              from that frame on purpose: "Unpublish" is a working shipped
              feature simply not drawn on this frame (kept as-is, with its
              existing conditional), and "Change category" is NOT built in
              this app (depends on unbuilt publisher bindings) so it is
              intentionally omitted rather than added as a dead item. The
              only change this card makes to this menu is inserting this
              first row for minted articles. */}
          {article.hasNft && (
            <div className="contents">
              <button
                type="button"
                onClick={() => { onViewKeysSold(); onClose(); }}
                className="flex items-center gap-3 py-4 text-[18px] leading-[28px] text-ink"
              >
                <SheetKeyIcon />
                {mc.viewKeysSold}
              </button>
              <div className="h-px bg-ink-border/10" />
            </div>
          )}
          {/* View article */}
          <button
            type="button"
            onClick={() => { onView(); onClose(); }}
            className="flex items-center gap-3 py-4 text-[18px] leading-[28px] text-ink"
          >
            <SheetEyeIcon />
            {mc.viewArticle}
          </button>
          <div className="h-px bg-ink-border/10" />
          {/* Unpublish -- published personal posts only */}
          {canUnpublish && (
            <div className="contents">
              <button
                type="button"
                onClick={() => { onUnpublish(); onClose(); }}
                className="flex items-center gap-3 py-4 text-[18px] leading-[28px] text-ink"
              >
                <SheetUnpublishIcon />
                {c.unpublish}
              </button>
              <div className="h-px bg-ink-border/10" />
            </div>
          )}
          {/* Delete -- personal posts only */}
          {canDelete && (
            <div className="contents">
              <button
                type="button"
                onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-3 py-4 text-[18px] leading-[28px] text-error"
              >
                <SheetTrashIcon />
                {c.delete}
              </button>
              <div className="h-px bg-ink-border/10" />
            </div>
          )}
          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-[8px] border border-brand-purple py-3 text-center text-[18px] font-medium leading-[28px] text-brand-purple"
          >
            {mc.cancelLabel}
          </button>
        </div>
      </FocusTrap>
    </div>
  );
}

// Inline SVG icons for the action rows to avoid adding icon files.
// Eye icon matching "NUR / Icon / Eye, views" proportions.
function SheetEyeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.5C6.4 4.5 2.5 8.8 1.1 11.6a.9.9 0 0 0 0 .8C2.5 15.2 6.4 19.5 12 19.5s9.5-4.3 10.9-7.1a.9.9 0 0 0 0-.8C21.5 8.8 17.6 4.5 12 4.5Zm0 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
        fill="#202123"
      />
      <circle cx="12" cy="12" r="1.9" fill="#202123" />
    </svg>
  );
}

// Key icon for "View keys sold" (Figma 2299:9770 row icon).
function SheetKeyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="15"
        r="4"
        stroke="#202123"
        strokeWidth="1.8"
      />
      <path
        d="M11 12 18.5 4.5M18.5 4.5 21 7M18.5 4.5 16 7"
        stroke="#202123"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Unpublish icon (arrow-down-into-tray / move-to-drafts visual).
function SheetUnpublishIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0-4-4m4 4 4-4"
        stroke="#202123"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="#202123"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Trash / delete icon in error red.
function SheetTrashIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="#c62828"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="#c62828"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
