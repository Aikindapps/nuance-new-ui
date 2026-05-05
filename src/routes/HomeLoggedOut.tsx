import Skeleton from "@mui/material/Skeleton";
import { Hero } from "../features/home/sections/Hero";
import { TabBar } from "../features/home/sections/TabBar";
import { ArticleGrid } from "../features/home/sections/ArticleGrid";
import { CtaBanner } from "../features/home/sections/CtaBanner";
import { PopularWriters } from "../features/home/sections/PopularWriters";
import { PopularPublications } from "../features/home/sections/PopularPublications";
import { useArticles } from "../features/home/hooks/useArticles";
import { useInView } from "../lib/useInView";
import { homeMetadata, homeStatus } from "../constants/copy";

type Variant = "popular" | "new";

export function HomeLoggedOut({ variant }: { variant: Variant }) {
  const meta = homeMetadata[variant];
  const query = useArticles(variant);
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const sentinelRef = useInView(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  });

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="website" />

      <main className="min-h-screen">
        <h1 className="sr-only">{meta.h1}</h1>
        <Hero />

        <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12 lg:px-14 lg:py-16">
          <TabBar />

          <div className="mt-10 md:mt-12">
            {isLoading && <LoadingSkeleton />}
            {isError && <ErrorState message={String(error)} />}
            {data && data.pages[0]?.articles.length === 0 && <EmptyState />}
            {data && data.pages[0] && data.pages[0].articles.length > 0 && (
              <>
                <FeaturedSection articles={data.pages[0].articles} />
                <div className="mt-12 md:mt-14 lg:mt-16">
                  <CtaBanner />
                </div>
                <div className="mt-12 md:mt-14 lg:mt-16">
                  <PopularWriters />
                </div>
                <div className="mt-12 md:mt-14 lg:mt-16">
                  <PopularPublications />
                </div>
                <div className="mt-12 flex flex-col gap-12 md:mt-14 md:gap-14 lg:mt-16 lg:gap-16">
                  {data.pages.slice(1).map((page, i) => (
                    <ArticleGrid
                      key={`page-${i + 1}`}
                      articles={page.articles}
                      layout="grid"
                      ariaLabel={`More articles, page ${i + 2}`}
                    />
                  ))}
                </div>

                {hasNextPage && (
                  <div
                    ref={sentinelRef}
                    className="mt-12 flex items-center justify-center py-10 text-body text-ink-60"
                    aria-live="polite"
                  >
                    {isFetchingNextPage
                      ? homeStatus.loadingMore
                      : homeStatus.scrollForMore}
                  </div>
                )}
                {!hasNextPage && data.pages.length > 1 && (
                  <p className="mt-12 py-10 text-center text-body text-ink-60">
                    {homeStatus.allCaughtUp}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function FeaturedSection({ articles }: { articles: import("../features/home/types").Article[] }) {
  const heroArticles = articles.slice(0, 2);
  const firstRow = articles.slice(2, 5);
  const secondRow = articles.slice(5, 8);

  return (
    <div className="flex flex-col gap-12 md:gap-14 lg:gap-16">
      {heroArticles.length > 0 && (
        <ArticleGrid
          articles={heroArticles}
          layout="hero"
          ariaLabel="Featured articles"
        />
      )}
      {firstRow.length > 0 && (
        <ArticleGrid
          articles={firstRow}
          layout="grid"
          ariaLabel="More featured articles"
        />
      )}
      {secondRow.length > 0 && (
        <ArticleGrid
          articles={secondRow}
          layout="grid"
          ariaLabel="More featured articles, continued"
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12 md:gap-14 lg:gap-16" aria-live="polite" aria-busy="true">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-10 lg:gap-14">
        {[0, 1].map((i) => (
          <SkeletonCard key={`hero-${i}`} large />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={`r1-${i}`} />
        ))}
      </div>
      <span className="sr-only">{homeStatus.loadingSrLabel}</span>
    </div>
  );
}

function SkeletonCard({ large = false }: { large?: boolean }) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <Skeleton
        variant="rectangular"
        sx={{
          width: "100%",
          aspectRatio: large ? "628 / 400" : "416 / 242",
          borderRadius: "var(--radius-card)",
        }}
      />
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" sx={{ height: 16, width: "67%" }} />
        <Skeleton variant="text" sx={{ height: 24, width: "100%" }} />
        <Skeleton variant="text" sx={{ height: 24, width: "83%" }} />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-ink-60/30 bg-ink-60/5 p-6 text-ink-80"
    >
      <p className="font-bold text-ink">{homeStatus.errorTitle}</p>
      <p className="mt-2 text-body">{homeStatus.errorBody}</p>
      {import.meta.env.DEV && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-ink-60">
          {message}
        </pre>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-ink-60/30 bg-ink-60/5 p-6 text-ink-80">
      <p className="font-bold text-ink">{homeStatus.emptyTitle}</p>
      <p className="mt-2 text-body">{homeStatus.emptyBody}</p>
    </div>
  );
}
