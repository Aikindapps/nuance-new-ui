import { useState } from "react";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import { IconComment } from "../../../components/ui/icons/IconComment";
import { IconViews } from "../../../components/ui/icons/IconViews";
import { IconLink } from "../../../components/ui/icons/IconLink";
import { formatCount } from "../../../lib/formatCount";

// Floating article action bar — Figma 1:5382. Fixed to the viewport
// bottom-centre so it stays in reach while reading.
//
// PR #7 ships it as a visual shell (decision #31): Applause and Comment are
// inert — those interactions belong to the Page 4 "Article Enrichment" PR.
// Only "Copy link" is wired (it needs no canister). The comment count is
// omitted for the same reason comments are deferred.
//
// The Figma's third slot is a Bookmark — but Nuance has no bookmark feature,
// so it shows the view count instead (Mr Nick, 2026-05-19): a passive stat,
// not a button.
//
// Mobile gets a dedicated treatment in Phase 9 — Figma has a separate
// "floating buttons" mobile frame (1:5455).

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

  const item = "flex h-12 items-center gap-2 rounded-card pl-5 pr-6 text-body font-medium text-white";

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
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
