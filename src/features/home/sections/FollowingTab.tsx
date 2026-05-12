import Skeleton from "@mui/material/Skeleton";
import { ArticleGrid } from "./ArticleGrid";
import { useFollowing } from "../hooks/useFollowing";
import { useMyProfile } from "../hooks/useMyProfile";
import { useMyTags } from "../hooks/useMyTags";
import { useInView } from "../../../lib/useInView";
import { homeLoggedInCopy, homeStatus } from "../../../constants/copy";

// Phase 5 — Following tab content. First authed-canister consumer.
//
// Sources merged: writers/publications you follow + topics you follow.
// useFollowing returns a single chronological feed across both sources.
//
// State coverage:
//   - Profile or tags loading         → skeleton
//   - 0 writers AND 0 topics followed → locked empty-state copy
//   - Sources exist + feed loading    → skeleton
//   - Sources exist + populated       → 2 hero + 3 + 3 featured grid +
//                                       infinite scroll of 6-per-page rows
//   - Errors at any layer             → ErrorState
//
// Cold-start UX: most authed users on the new frontend land in the
// "0 writers AND 0 topics" branch (per decision #27, local dev principals
// are fresh; in prod, new II accounts are similar). The empty-state copy
// nudges them to discover writers/topics via the other tabs and the
// Topics rail.

export function FollowingTab() {
  const profile = useMyProfile();
  const tags = useMyTags();
  const query = useFollowing();

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

  // Wait for profile + tags to settle before deciding which state to render —
  // useFollowing is disabled until both succeed.
  if (profile.isLoading || tags.isLoading) return <LoadingSkeleton />;
  if (profile.isError) return <ErrorState message={String(profile.error)} />;
  if (tags.isError) return <ErrorState message={String(tags.error)} />;

  const followers = profile.data?.followersArray ?? [];
  const tagList = tags.data ?? [];
  if (followers.length === 0 && tagList.length === 0) {
    return <EmptyState message={homeLoggedInCopy.followingEmpty} />;
  }

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={String(error)} />;

  const firstPage = data?.pages[0];
  if (!firstPage || firstPage.articles.length === 0) {
    return <EmptyState message={homeLoggedInCopy.followingEmpty} />;
  }

  const heroArticles = firstPage.articles.slice(0, 2);
  const firstRow = firstPage.articles.slice(2, 5);
  const secondRow = firstPage.articles.slice(5, 8);

  return (
    <>
      <div className="flex flex-col gap-12 md:gap-14 lg:gap-16">
        {heroArticles.length > 0 && (
          <ArticleGrid
            articles={heroArticles}
            layout="hero"
            ariaLabel="Latest from people you follow"
          />
        )}
        {firstRow.length > 0 && (
          <ArticleGrid
            articles={firstRow}
            layout="grid"
            ariaLabel="More from people you follow"
          />
        )}
        {secondRow.length > 0 && (
          <ArticleGrid
            articles={secondRow}
            layout="grid"
            ariaLabel="More from people you follow, continued"
          />
        )}
      </div>

      <div className="mt-12 flex flex-col gap-12 md:mt-14 md:gap-14 lg:mt-16 lg:gap-16">
        {data.pages.slice(1).map((page, i) => (
          <ArticleGrid
            key={`page-${i + 1}`}
            articles={page.articles}
            layout="grid"
            ariaLabel={`More from people you follow, page ${i + 2}`}
          />
        ))}
      </div>

      {hasNextPage && (
        <div
          ref={sentinelRef}
          className="mt-12 flex items-center justify-center py-10 text-body text-ink-60"
          aria-live="polite"
        >
          {isFetchingNextPage ? homeStatus.loadingMore : homeStatus.scrollForMore}
        </div>
      )}
      {!hasNextPage && data.pages.length > 1 && (
        <p className="mt-12 py-10 text-center text-body text-ink-60">
          {homeStatus.allCaughtUp}
        </p>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-12 md:gap-14 lg:gap-16"
      aria-live="polite"
      aria-busy="true"
    >
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center md:p-16">
      <p className="mx-auto max-w-2xl text-body text-ink-80 md:text-lg">
        {message}
      </p>
    </div>
  );
}
