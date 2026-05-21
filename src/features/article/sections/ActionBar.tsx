import { useState } from "react";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import { IconComment } from "../../../components/ui/icons/IconComment";
import { IconViews } from "../../../components/ui/icons/IconViews";
import { IconLink } from "../../../components/ui/icons/IconLink";
import { ShareButton } from "../../../components/ui/ShareButton/ShareButton";
import { formatCount } from "../../../lib/formatCount";

// Floating article action bar — Figma 1:5382 (desktop) + 1:5455 (mobile),
// share interactions per 4.4 `1:18426` (PR #8 Phase 2).
// Fixed to the viewport bottom-centre so it stays in reach while reading.
//
// Applause + Comment remain inert shells — those wire later in PR #8
// (Phases 3-7). Share is wired: ShareButton opens a popover with the
// four Figma social channels (Google/LinkedIn/Reddit/Facebook), and on
// mobile tries `navigator.share` first before falling back. Copy link
// stays a separate button in the bar per the Figma split.
//
// Desktop (Figma 1:5382): Applause + Comment + Views + Share + Copy link.
// The third slot would be Bookmark in Figma but Nuance has no bookmark
// feature, so it shows the view count instead (Mr Nick, 2026-05-19): a
// passive stat, not a button.
//
// Mobile (Figma 1:5455): Applause + Comment + Link + Share — icon-only,
// drops the view count.

type CopyState = "idle" | "copied" | "failed";

// `aria-disabled` + `title` on inert shells so AT users hear them as not-yet
// active and sighted users get a hover tooltip — clicking does nothing, but
// the button's state is now honestly communicated. PR #7 review M6.
const INERT_ARIA = {
  "aria-disabled": true as const,
  title: "Coming soon",
};

export function ActionBar({
  claps,
  views,
  title,
}: {
  claps: number;
  views: number;
  title: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

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
        title={title}
        copyState={copyState}
        copyLink={copyLink}
      />
      {/* Mobile bar — icon-only, drops Views slot */}
      <MobileBar title={title} copyState={copyState} copyLink={copyLink} />
    </>
  );
}

function copyLabel(state: CopyState): string {
  if (state === "copied") return "Copied!";
  if (state === "failed") return "Copy failed";
  return "Copy link";
}

function copyAriaLabel(state: CopyState): string {
  if (state === "copied") return "Link copied";
  if (state === "failed") return "Copy failed";
  return "Copy link";
}

function DesktopBar({
  claps,
  views,
  title,
  copyState,
  copyLink,
}: {
  claps: number;
  views: number;
  title: string;
  copyState: CopyState;
  copyLink: () => void;
}) {
  const item =
    "flex h-12 items-center gap-2 rounded-card pl-5 pr-6 text-body font-medium text-white";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 lg:block">
      <div className="bg-brand-gradient-button flex items-center gap-4 rounded-[calc(24*var(--fpx))] p-4 shadow-[0px_3px_5px_rgba(84,5,212,0.4)]">
        {/* Applause — inert shell (wired in a later PR #8 phase) */}
        <button
          type="button"
          {...INERT_ARIA}
          className="flex h-12 items-center gap-2 rounded-card bg-white pl-4 pr-5 text-body font-medium text-brand-purple"
        >
          <IconClaps className="size-6" />
          Applause ({claps})
        </button>

        {/* Comment — inert shell; count wires in Phase 4b */}
        <button
          type="button"
          {...INERT_ARIA}
          className={`${item} transition-colors hover:bg-white-10`}
        >
          <IconComment className="size-6" />
          Comment
        </button>

        {/* Views — passive stat (no bookmark feature on Nuance) */}
        <div className={item}>
          <IconViews className="size-6" />
          {formatCount(String(views))} views
        </div>

        {/* Share — opens 4-channel social popover above the bar */}
        <ShareButton variant="desktop" title={title} />

        {/* Copy link — wired (no canister needed) */}
        <button
          type="button"
          onClick={copyLink}
          className={`${item} transition-colors hover:bg-white-10`}
        >
          <IconLink className="size-6" />
          {copyLabel(copyState)}
        </button>
      </div>
    </div>
  );
}

function MobileBar({
  title,
  copyState,
  copyLink,
}: {
  title: string;
  copyState: CopyState;
  copyLink: () => void;
}) {
  const iconButton =
    "flex size-12 items-center justify-center rounded-card text-white transition-colors hover:bg-white-10";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
      <div className="bg-brand-gradient-button flex items-center gap-2 rounded-[calc(16*var(--fpx))] p-2 shadow-[0px_3px_5px_rgba(84,5,212,0.4)]">
        {/* Applause — inert shell */}
        <button
          type="button"
          aria-label="Applause"
          {...INERT_ARIA}
          className="flex size-12 items-center justify-center rounded-card bg-white text-brand-purple"
        >
          <IconClaps className="size-6" />
        </button>

        {/* Comment — inert shell */}
        <button
          type="button"
          aria-label="Comment"
          {...INERT_ARIA}
          className={iconButton}
        >
          <IconComment className="size-6" />
        </button>

        {/* Copy link — wired */}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copyAriaLabel(copyState)}
          className={iconButton}
        >
          <IconLink className="size-6" />
        </button>

        {/* Share — native share sheet on mobile when available, else popover */}
        <ShareButton variant="mobile" title={title} />
      </div>
    </div>
  );
}
