import { useState } from "react";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import { IconComment } from "../../../components/ui/icons/IconComment";
import { IconViews } from "../../../components/ui/icons/IconViews";
import { IconLink } from "../../../components/ui/icons/IconLink";
import { IconShare } from "../../../components/ui/icons/IconShare";
import { formatCount } from "../../../lib/formatCount";

// Floating article action bar — Figma 1:5382 (desktop) + 1:5455 (mobile).
// Fixed to the viewport bottom-centre so it stays in reach while reading.
//
// PR #7 ships it as a visual shell (decision #31): Applause, Comment, Share
// are inert — those interactions belong to the Page 4 "Article Enrichment"
// PR. Only Copy link is wired (needs no canister). The comment count is
// omitted for the same reason comments are deferred.
//
// Desktop (Figma 1:5382): Applause + Comment + Views + Copy link — text +
// icon. The third slot would be Bookmark in Figma but Nuance has no bookmark
// feature, so it shows the view count instead (Mr Nick, 2026-05-19): a
// passive stat, not a button.
//
// Mobile (Figma 1:5455): Applause + Comment + Link + Share — icon-only,
// drops the view count. Native share-arrow per Figma's NUR / Icon / Share.

type CopyState = "idle" | "copied" | "failed";

// `aria-disabled` + `title` on inert shells so AT users hear them as not-yet
// active and sighted users get a hover tooltip — clicking does nothing, but
// the button's state is now honestly communicated. PR #7 review M6.
const INERT_ARIA = {
  "aria-disabled": true as const,
  title: "Coming soon",
};

export function ActionBar({ claps, views }: { claps: number; views: number }) {
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
        copyState={copyState}
        copyLink={copyLink}
      />
      {/* Mobile bar — icon-only, drops Views slot */}
      <MobileBar copyState={copyState} copyLink={copyLink} />
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
  copyState,
  copyLink,
}: {
  claps: number;
  views: number;
  copyState: CopyState;
  copyLink: () => void;
}) {
  const item =
    "flex h-12 items-center gap-2 rounded-card pl-5 pr-6 text-body font-medium text-white";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 lg:block">
      <div className="bg-brand-gradient-button flex items-center gap-4 rounded-[calc(24*var(--fpx))] p-4 shadow-[0px_3px_5px_rgba(84,5,212,0.4)]">
        {/* Applause — inert shell (wired in Page 4) */}
        <button
          type="button"
          {...INERT_ARIA}
          className="flex h-12 items-center gap-2 rounded-card bg-white pl-4 pr-5 text-body font-medium text-brand-purple"
        >
          <IconClaps className="size-6" />
          Applause ({claps})
        </button>

        {/* Comment — inert shell; count omitted (comments deferred to Page 4) */}
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
  copyState,
  copyLink,
}: {
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

        {/* Share — inert shell (Page 4 wires native share sheet) */}
        <button
          type="button"
          aria-label="Share"
          {...INERT_ARIA}
          className={iconButton}
        >
          <IconShare className="size-6" />
        </button>
      </div>
    </div>
  );
}
