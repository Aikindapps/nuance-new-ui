import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IllustrationLoadError } from "../../../components/ui/icons/IllustrationLoadError";
import { IllustrationNoMembers } from "../../../components/ui/icons/IllustrationNoMembers";
import { PopularWriters } from "./PopularWriters";
import { PopularPublications } from "./PopularPublications";
import { homeMobileCopy } from "./homeMobileCopy";

// Article-card skeleton for the phone loading state (NIC-420, frame 2316:4011).
// Shape: image block + author row + two title bars. No MUI, no spinner.
function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[416/242] w-full animate-pulse rounded-card bg-ink-border/10" />
      <div className="flex items-center gap-3">
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-ink-border/10" />
        <div className="h-5 w-40 animate-pulse rounded-card bg-ink-border/10" />
      </div>
      <div className="h-6 w-full animate-pulse rounded-card bg-ink-border/10" />
      <div className="h-6 w-2/3 animate-pulse rounded-card bg-ink-border/10" />
    </div>
  );
}

// Author-card skeleton: full-width tall card matching AuthorBlock height on phone.
function AuthorCardSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-card bg-ink-border/10" />
  );
}

// Publication-card skeleton: full-width card matching PublicationBlock height on phone.
function PublicationCardSkeleton() {
  return (
    <div className="h-[180px] w-full animate-pulse rounded-card bg-ink-border/10" />
  );
}

// Shelf skeleton: heading bar + N item skeletons.
function ShelfSkeleton({ count, renderItem }: { count: number; renderItem: () => ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-7 w-48 animate-pulse rounded-card bg-ink-border/10" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderItem()}</div>
      ))}
    </div>
  );
}

// HomeFeedMobileSkeleton -- phone-only loading state (NIC-420, frame 2316:4011).
// 4 article-card skeletons; when withShelves: 3 author-card skeletons + 2
// publication-card skeletons below heading bars. Grey bg-ink-border/10, animate-pulse.
export function HomeFeedMobileSkeleton({ withShelves = true }: { withShelves?: boolean }) {
  return (
    <div aria-live="polite" aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">{homeMobileCopy.loadingSrLabel}</span>
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
      {withShelves && (
        <div className="mt-4 flex flex-col gap-12">
          <ShelfSkeleton count={3} renderItem={() => <AuthorCardSkeleton />} />
          <ShelfSkeleton count={2} renderItem={() => <PublicationCardSkeleton />} />
        </div>
      )}
    </div>
  );
}

// HomeFeedMobileError -- phone-only error state (NIC-420, frame 2317:8127).
// Centred column: illustration + title + body + retry button.
export function HomeFeedMobileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-5 py-16 text-center"
    >
      <IllustrationLoadError className="h-[87px] w-[109px] text-ink-60" />
      <p className="text-lg font-bold text-ink">{homeMobileCopy.errorTitle}</p>
      <p className="text-body text-ink-60">{homeMobileCopy.errorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[8px] bg-brand-gradient-button px-6 py-3 text-[18px] font-medium leading-[28px] text-white shadow-[var(--shadow-purple-glow-medium)]"
      >
        {homeMobileCopy.tryAgain}
      </button>
    </div>
  );
}

// HomeFollowingMobileEmpty -- phone-only empty-following state (NIC-420, frame 2319:3003).
// Centred callout + Popular writers + Popular publications shelves.
export function HomeFollowingMobileEmpty() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <IllustrationNoMembers className="h-[140px] w-[175px] text-ink-60" />
        <p className="text-lg font-bold text-ink">{homeMobileCopy.followingEmptyTitle}</p>
        <p className="text-body text-ink-60">{homeMobileCopy.followingEmptyBody}</p>
        <Link
          to="/explore/writers"
          className="rounded-[8px] bg-brand-gradient-button px-6 py-3 text-[18px] font-medium leading-[28px] text-white shadow-[var(--shadow-purple-glow-medium)]"
        >
          {homeMobileCopy.discoverWriters}
        </Link>
      </div>
      <div className="mt-12">
        <PopularWriters />
      </div>
      <div className="mt-12">
        <PopularPublications />
      </div>
    </div>
  );
}

// Query shape expected by HomeFeedMobileStateSwap.
type FeedQuery = {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};

// HomeFeedMobileStateSwap -- wraps a feed so that phones see the mobile states
// (skeleton / error) while desktops see the existing ArticleFeed states unchanged.
// children is the ArticleFeed (or other feed). Uses a real <div> wrapper so the
// diff transport never sees a JSX fragment.
export function HomeFeedMobileStateSwap({
  query,
  withShelves = true,
  children,
}: {
  query: FeedQuery;
  withShelves?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {query.isLoading && (
        <div className="md:hidden">
          <HomeFeedMobileSkeleton withShelves={withShelves} />
        </div>
      )}
      {query.isError && !query.isLoading && (
        <div className="md:hidden">
          <HomeFeedMobileError onRetry={() => { void query.refetch(); }} />
        </div>
      )}
      <div className={query.isLoading || query.isError ? "hidden md:block" : undefined}>
        {children}
      </div>
    </div>
  );
}
