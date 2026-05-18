import Skeleton from "@mui/material/Skeleton";
import { ArticleFeed } from "./ArticleFeed";
import { useFollowing } from "../hooks/useFollowing";
import { useMyProfile } from "../hooks/useMyProfile";
import { useMyTags } from "../hooks/useMyTags";
import { homeLoggedInCopy, homeStatus } from "../../../constants/copy";

// Phase 5 — Following tab content. First authed-canister consumer.
//
// Sources merged: writers/publications you follow + topics you follow.
// useFollowing returns a single chronological feed across both sources.
// Pre-feed gating (profile + tags loaded; at least one source non-empty)
// happens here; the actual feed render is delegated to ArticleFeed which
// is shared with NewTab.

export function FollowingTab() {
  const profile = useMyProfile();
  const tags = useMyTags();
  const query = useFollowing();

  // Wait for profile + tags to settle before deciding which state to render —
  // useFollowing is disabled until both succeed.
  if (profile.isLoading || tags.isLoading) return <GatingSkeleton />;
  if (profile.isError) return <GatingError message={String(profile.error)} />;
  if (tags.isError) return <GatingError message={String(tags.error)} />;

  const followers = profile.data?.followersArray ?? [];
  const tagList = tags.data ?? [];
  if (followers.length === 0 && tagList.length === 0) {
    return <GatingEmpty message={homeLoggedInCopy.followingEmpty} />;
  }

  return (
    <ArticleFeed
      query={query}
      emptyMessage={homeLoggedInCopy.followingEmpty}
      feedLabel="Articles from people and topics you follow"
    />
  );
}

// Pre-feed states. Mirror the ArticleFeed visuals so the transition between
// "waiting for profile" and "rendering feed" doesn't reflow weirdly.

function GatingSkeleton() {
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

function GatingError({ message }: { message: string }) {
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

function GatingEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center md:p-16">
      <p className="mx-auto max-w-2xl text-body text-ink-80 md:text-lg">
        {message}
      </p>
    </div>
  );
}
