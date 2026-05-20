import { useRef } from "react";
import Skeleton from "@mui/material/Skeleton";
import { ArticleSummary } from "../../../components/ui/ArticleSummary";
import { FloatingButton } from "../../../components/ui/FloatingButton";
import { IconChevronRight } from "../../../components/ui/icons/IconChevronRight";
import type { Article } from "../../home/types";

// Full-bleed article rail — Figma 1:5365 ("More from") / 1:5373
// ("Recommended"). Heading + a horizontally-scrolling row of small
// ArticleSummary cards on a tinted band, with a floating chevron that
// scrolls the row.
//
// Supplementary section: when there are no articles it renders nothing
// rather than an empty band.

type Props = {
  heading: string;
  articles: Article[] | undefined;
  isLoading: boolean;
};

// Card pitch: 296px card + 32px gap.
const SCROLL_STEP = 328 * 2;

export function ArticleRail({ heading, articles, isLoading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isLoading && (!articles || articles.length === 0)) return null;

  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });

  return (
    <section className="bg-ink-border-5 py-12 lg:py-[calc(72*var(--fpx))]">
      <div className="relative mx-auto max-w-[calc(1280*var(--fpx))] px-6 lg:px-0">
        <h2 className="text-lg font-medium text-ink">{heading}</h2>

        <div
          ref={scrollRef}
          className="scrollbar-hide mt-4 flex gap-8 overflow-x-auto"
        >
          {isLoading
            ? [0, 1, 2, 3].map((i) => <RailSkeleton key={i} />)
            : articles!.map((article) => (
                <div key={article.id} className="w-[calc(296*var(--fpx))] shrink-0">
                  <ArticleSummary article={article} variant="small" />
                </div>
              ))}
        </div>

        {!isLoading && articles && articles.length > 4 && (
          <FloatingButton
            onClick={scrollRight}
            ariaLabel={`Scroll ${heading} forward`}
            className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:flex"
          >
            <IconChevronRight className="h-6 w-auto" />
          </FloatingButton>
        )}
      </div>
    </section>
  );
}

function RailSkeleton() {
  return (
    <div className="w-[calc(296*var(--fpx))] shrink-0">
      <Skeleton
        variant="rectangular"
        sx={{ width: "100%", aspectRatio: "416 / 242", borderRadius: "var(--radius-card)" }}
      />
      <Skeleton variant="text" sx={{ height: 16, width: "60%", mt: 2 }} />
      <Skeleton variant="text" sx={{ height: 24, width: "100%", mt: 1 }} />
      <Skeleton variant="text" sx={{ height: 24, width: "80%" }} />
    </div>
  );
}
