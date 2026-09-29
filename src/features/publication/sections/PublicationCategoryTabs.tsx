import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Tab } from "../../../components/ui/Tab";
import { publicationCopy } from "../../../constants/copy";
import { categoryPath, type CategoryTab } from "../lib/categories";

// NIC-537 -- the publication page's category tab bar: All, then the
// publication's categories in the order the editor saved them (canonical
// 1:52461; All-only 897:6327; desktop strip 897:6331; phone strip 897:6361).
//
// One row that never wraps. When the tabs are wider than the column the
// row scrolls sideways and a right-edge fade shows while there is more to
// the right (any width, unlike the home strip's phone-only fade). The
// active tab is scrolled into view when it would start off-screen.
//
// The hairline sits on an inner row inside the scroll box (min-w-full so
// it always runs the full column width), so each active tab's underline
// overlays it instead of being clipped by the scroll box.

export function PublicationCategoryTabs({
  handle,
  tabs,
  activeSlug,
}: {
  handle: string;
  tabs: readonly CategoryTab[];
  // The active category's slug; null = All.
  activeSlug: string | null;
}) {
  const scrollRef = useRef<HTMLElement>(null);
  const [moreToTheRight, setMoreToTheRight] = useState(false);

  // Track overflow: fade on while the row can still scroll right.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setMoreToTheRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [tabs]);

  // Bring the active tab into view (centred) when it isn't fully visible,
  // e.g. an old shared link to the last category on a phone. Only the
  // strip scrolls; the page never moves.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const box = el.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (tab.left >= box.left && tab.right <= box.right) return;
    const tabStart = tab.left - box.left + el.scrollLeft;
    el.scrollLeft = tabStart - (el.clientWidth - tab.width) / 2;
  }, [activeSlug, tabs]);

  return (
    <div className="relative">
      <nav
        ref={scrollRef}
        aria-label={publicationCopy.categoriesNavLabel}
        className="scrollbar-hide overflow-x-auto overflow-y-hidden"
      >
        <div className="flex w-max min-w-full border-b border-ink-border/20">
          <Tab
            to={`/publication/${handle}`}
            end
            className="shrink-0 whitespace-nowrap"
          >
            {publicationCopy.allTab}
          </Tab>
          {tabs.map((t) => (
            <Tab
              key={t.slug}
              to={categoryPath(handle, t.slug)}
              end
              className="shrink-0 whitespace-nowrap"
            >
              {t.label}
            </Tab>
          ))}
        </div>
      </nav>
      {moreToTheRight && (
        <div
          aria-hidden
          // F-fade node (897:6331 / 897:6361): 56x52, the full tab-bar
          // height -- it runs over the hairline, not stopping short of it.
          className="pointer-events-none absolute inset-y-0 right-0 w-[calc(56*var(--fpx))]"
          style={{
            backgroundImage:
              "linear-gradient(to left, var(--color-surface), transparent)",
          }}
        />
      )}
    </div>
  );
}
