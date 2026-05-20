import { useEffect, useRef, useState } from "react";
import { FloatingButton } from "../../../components/ui/FloatingButton";
import { IconChevronRight } from "../../../components/ui/icons/IconChevronRight";
import { RelatedArticleItem } from "./RelatedArticleItem";
import type { Article } from "../../home/types";

// Related-articles foldout — Figma 3.3 (1:5623 / 1:6090 / 1:6255).
//
// A right-edge reading companion. Collapsed: a "Related" tab peeks from the
// edge at vertical-centre. Open: a floating light-purple panel (rounded,
// inset from the edges) slides in with the related-article list.
//
// Two controls on the open panel:
//  - Close — a chevron button on the panel's left edge, at vertical-centre,
//    so opening and closing happen from roughly the same height.
//  - Scroll — a down-chevron at the bottom that scrolls the list to more
//    articles; shown only while there is more list below.
//
// The article set is the same recommended feed the "Recommended other reads"
// rail uses (decision #29 — no recommendation API; popularity is the honest
// signal). `IconChevronRight` is reused at 0° (close), 90° (scroll down) and
// 180° (open).

export function RelatedArticlesFoldout({
  articles,
}: {
  articles: Article[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Whether the list has more content below the fold — drives the scroll
  // chevron's visibility. Re-measured when the panel opens.
  const refreshScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  };
  useEffect(() => {
    if (open) refreshScroll();
  }, [open]);

  if (!articles || articles.length === 0) return null;

  const scrollDown = () =>
    listRef.current?.scrollBy({ top: 320, behavior: "smooth" });

  // Foldout is a desktop reading-companion pattern (mobile Figma omits it,
  // and at <1024px the inline "Recommended other reads" rail covers the same
  // need). Hidden entirely below the desktop breakpoint.
  return (
    <div className="hidden lg:contents">
      {/* Collapsed — right-edge tab at vertical-centre */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show related articles"
          className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-l-[calc(16*var(--fpx))] bg-white px-2 py-5 text-brand-purple shadow-[var(--shadow-purple-glow)] transition-shadow hover:shadow-[var(--shadow-purple-glow-hover)]"
        >
          <IconChevronRight className="h-4 w-auto rotate-180" />
          <span className="text-body font-medium [writing-mode:vertical-rl]">
            Related
          </span>
        </button>
      )}

      {/* Expanded — floating light-purple panel. `inert` when closed so
          descendant links don't sit in the keyboard tab order while the
          panel is translated off-screen (PR #7 review m2). */}
      <aside
        aria-label="Related articles"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-4 bottom-4 top-[calc(112*var(--fpx))] z-30 w-[calc(340*var(--fpx))] max-w-[calc(100vw-2rem)] transition-transform duration-300 md:top-[calc(128*var(--fpx))] lg:top-[calc(168*var(--fpx))] ${
          open
            ? "translate-x-0"
            : "pointer-events-none translate-x-[calc(100%+1.5rem)]"
        }`}
      >
        <div className="h-full overflow-hidden rounded-[calc(16*var(--fpx))] bg-brand-purple-5 shadow-[var(--shadow-purple-glow-hover)]">
          <div
            ref={listRef}
            onScroll={refreshScroll}
            className="h-full overflow-y-auto p-6"
          >
            <h2 className="text-lg font-medium text-ink">Related articles</h2>
            <div className="mt-6 flex flex-col gap-6 pb-28">
              {articles.map((article) => (
                <RelatedArticleItem key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>

        {/* Close — left edge, vertical-centre (mirrors the open tab) */}
        <FloatingButton
          onClick={() => setOpen(false)}
          ariaLabel="Hide related articles"
          className="absolute -left-5 top-1/2 -translate-y-1/2"
        >
          <IconChevronRight className="h-6 w-auto" />
        </FloatingButton>

        {/* Scroll to more — bottom-centre, only while more list remains */}
        {canScrollDown && (
          <FloatingButton
            onClick={scrollDown}
            ariaLabel="Scroll to more related articles"
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <IconChevronRight className="h-6 w-auto rotate-90" />
          </FloatingButton>
        )}
      </aside>
    </div>
  );
}
