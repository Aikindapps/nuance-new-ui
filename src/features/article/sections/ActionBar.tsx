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

export function ActionBar({ claps, views }: { claps: number; views: number }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / permission denied) — no-op.
    }
  };

  return (
    <>
      {/* Desktop bar — text + icon */}
      <DesktopBar
        claps={claps}
        views={views}
        copied={copied}
        copyLink={copyLink}
      />
      {/* Mobile bar — icon-only, drops Views slot */}
      <MobileBar copied={copied} copyLink={copyLink} />
    </>
  );
}

function DesktopBar({
  claps,
  views,
  copied,
  copyLink,
}: {
  claps: number;
  views: number;
  copied: boolean;
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
          className="flex h-12 items-center gap-2 rounded-card bg-white pl-4 pr-5 text-body font-medium text-brand-purple"
        >
          <IconClaps className="size-6" />
          Applause ({claps})
        </button>

        {/* Comment — inert shell; count omitted (comments deferred to Page 4) */}
        <button
          type="button"
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
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

function MobileBar({
  copied,
  copyLink,
}: {
  copied: boolean;
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
          className="flex size-12 items-center justify-center rounded-card bg-white text-brand-purple"
        >
          <IconClaps className="size-6" />
        </button>

        {/* Comment — inert shell */}
        <button type="button" aria-label="Comment" className={iconButton}>
          <IconComment className="size-6" />
        </button>

        {/* Copy link — wired */}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? "Link copied" : "Copy link"}
          className={iconButton}
        >
          <IconLink className="size-6" />
        </button>

        {/* Share — inert shell (Page 4 wires native share sheet) */}
        <button type="button" aria-label="Share" className={iconButton}>
          <IconShare className="size-6" />
        </button>
      </div>
    </div>
  );
}
