import { useState } from "react";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import { IconComment } from "../../../components/ui/icons/IconComment";
import { IconViews } from "../../../components/ui/icons/IconViews";
import { IconShare } from "../../../components/ui/icons/IconShare";
import { formatCount } from "../../../lib/formatCount";
import { useAuth } from "../../../contexts/useAuth";
import { useModal } from "../../../services/modal";
import {
  LoginModal,
  LOGIN_MODAL_TITLE_ID,
} from "../../../components/LoginModal/LoginModal";
import { TipModal, TIP_MODAL_TITLE_ID } from "../../wallet/tip/TipModal";

// Floating article action bar — Figma 1:5382 (desktop) + 1:5455 (mobile).
// Fixed to the viewport bottom-centre so it stays in reach while reading.
//
// Applause + Comment remain inert shells — those wire later in PR #8
// (Phases 3-7). Share copies the article URL to the clipboard (no popover,
// no OS share sheet) and cycles through idle → copied/failed → idle states.
//
// Desktop (Figma 1:5382): Applause + Comment + Views + Share.
// The third slot would be Bookmark in Figma but Nuance has no bookmark
// feature, so it shows the view count instead (Mr Nick, 2026-05-19): a
// passive stat, not a button.
//
// Mobile (Figma 1:5455): Applause + Comment + Share — icon-only,
// drops the view count.

type CopyState = "idle" | "copied" | "failed";

export function ActionBar({
  claps,
  views,
  commentCount,
  postId,
  bucketCanisterId,
}: {
  claps: number;
  views: number;
  commentCount: number;
  postId: string;
  bucketCanisterId: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const { isAuthenticated } = useAuth();
  const modal = useModal();

  // Applause = tip (§4.2). Logged-out opens LoginModal (matches the comment/
  // vote affordances); logged-in opens the multi-token TipModal.
  const onApplaud = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    modal.open(
      <TipModal
        postId={postId}
        bucketCanisterId={bucketCanisterId}
        onClose={modal.close}
      />,
      { ariaLabelledBy: TIP_MODAL_TITLE_ID },
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      // Clipboard unavailable (insecure context / permission denied) —
      // surface as inline button state so the click isn't a black hole.
      // PR #7 review m4.
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <>
      {/* Desktop bar — text + icon */}
      <DesktopBar
        claps={claps}
        views={views}
        commentCount={commentCount}
        copyState={copyState}
        copyLink={copyLink}
        onApplaud={onApplaud}
      />
      {/* Mobile bar — icon-only, drops Views slot */}
      <MobileBar
        copyState={copyState}
        copyLink={copyLink}
        onApplaud={onApplaud}
      />
    </>
  );
}

function copyLabel(state: CopyState): string {
  if (state === "copied") return "Copied!";
  if (state === "failed") return "Copy failed";
  return "Share";
}

function copyAriaLabel(state: CopyState): string {
  if (state === "copied") return "Link copied";
  if (state === "failed") return "Copy failed";
  return "Copy article link";
}

function DesktopBar({
  claps,
  views,
  commentCount,
  copyState,
  copyLink,
  onApplaud,
}: {
  claps: number;
  views: number;
  commentCount: number;
  copyState: CopyState;
  copyLink: () => void;
  onApplaud: () => void;
}) {
  const item =
    "flex h-12 items-center gap-2 rounded-card pl-5 pr-6 text-body font-medium text-white";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 lg:block">
      <div className="bg-brand-gradient-button flex items-center gap-4 rounded-[calc(24*var(--fpx))] p-4 shadow-[0px_3px_5px_rgba(84,5,212,0.4)]">
        {/* Applause — opens the tip modal (§4.2) / LoginModal when logged out */}
        <button
          type="button"
          onClick={onApplaud}
          className="flex h-12 items-center gap-2 rounded-card bg-white pl-4 pr-5 text-body font-medium text-brand-purple transition-opacity hover:opacity-90"
        >
          <IconClaps className="size-6" />
          Applause ({claps})
        </button>

        {/* Comment — anchors to the comments section. The smooth scroll
            comes from CSS (gated on prefers-reduced-motion); scroll-mt on
            #comments leaves clearance under the fixed Header at the top of
            the viewport. (This ActionBar is fixed-bottom, so it needs no
            scroll offset of its own.) Composer mounts inline there. */}
        <a
          href="#comments"
          className={`${item} transition-colors hover:bg-white-10`}
        >
          <IconComment className="size-6" />
          {commentCount > 0 ? `Comment (${commentCount})` : "Comment"}
        </a>

        {/* Views — passive stat (no bookmark feature on Nuance) */}
        <div className={item}>
          <IconViews className="size-6" />
          {formatCount(String(views))} views
        </div>

        {/* Share — copies the article URL to the clipboard */}
        <button
          type="button"
          onClick={copyLink}
          className={`${item} transition-colors hover:bg-white-10`}
        >
          <IconShare className="size-6" />
          {copyLabel(copyState)}
        </button>
      </div>
    </div>
  );
}

function MobileBar({
  copyState,
  copyLink,
  onApplaud,
}: {
  copyState: CopyState;
  copyLink: () => void;
  onApplaud: () => void;
}) {
  const iconButton =
    "flex size-12 items-center justify-center rounded-card text-white transition-colors hover:bg-white-10";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
      <div className="bg-brand-gradient-button flex items-center gap-2 rounded-[calc(16*var(--fpx))] p-2 shadow-[0px_3px_5px_rgba(84,5,212,0.4)]">
        {/* Applause — opens the tip modal (§4.2) / LoginModal when logged out */}
        <button
          type="button"
          aria-label="Applause"
          onClick={onApplaud}
          className="flex size-12 items-center justify-center rounded-card bg-white text-brand-purple"
        >
          <IconClaps className="size-6" />
        </button>

        {/* Comment — anchors to the comments section. */}
        <a
          href="#comments"
          aria-label="Jump to comments"
          className={iconButton}
        >
          <IconComment className="size-6" />
        </a>

        {/* Share — copies the article URL to the clipboard */}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copyAriaLabel(copyState)}
          className={iconButton}
        >
          <IconShare className="size-6" />
        </button>
      </div>
    </div>
  );
}
