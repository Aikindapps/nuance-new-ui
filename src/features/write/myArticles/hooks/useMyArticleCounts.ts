import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";
import { useMyProfile } from "../../../../lib/useMyProfile";
import type { MyArticleFilter } from "./useMyArticles";

// Counts for the My-Articles tab bar (All / Published / Drafts). Sourced from
// PostCore.getUserPostCounts — the canister's authoritative per-user tally — so
// the numbers are EXACT and never capped.
//
// The previous implementation counted the length of a single paginated page
// from getMyAllPosts / getMyPublishedPosts / getMyDraftPosts (page size 50),
// so the counts silently topped out at 50 (a writer with more than 50 posts in
// a tab saw "50" instead of the real total) and "Published" also over-counted
// scheduled/rejected posts. getUserPostCounts classifies with the same rules
// the tab list endpoints use, so each count matches its tab:
//   all       -> totalPostCount  (every post in the caller's index — what the
//                                 All tab's getMyAllPosts returns)
//   published -> publishedCount   (live, non-draft, non-scheduled, non-rejected)
//   drafts    -> draftCount       (the caller's own drafts; excludes posts
//                                 submitted to a publication for review — the
//                                 same filter getMyDraftPosts applies)
//
// getUserPostCounts is handle-keyed (the same call that powers the publication
// article count), so it reads the authed user's handle from the already-cached
// profile. Counts are gracefully omitted until the profile (hence handle) and
// the tally have loaded.
export type MyArticleCounts = Record<MyArticleFilter, number>;

// Canister returns nat-as-text; coerce defensively.
function toCount(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function useMyArticleCounts() {
  const { getUserPostCounts } = useActors();
  const { isAuthenticated, principal } = useAuth();
  const profile = useMyProfile();
  const handle = profile.data?.handle?.toLowerCase() ?? null;

  return useQuery<MyArticleCounts>({
    queryKey: ["my-article-counts", principal?.toText() ?? "anon"],
    enabled: isAuthenticated && handle !== null,
    queryFn: async () => {
      // Unreachable when disabled (handle is non-null), but keeps the type
      // narrowed without a non-null assertion.
      if (!handle) return { all: 0, published: 0, drafts: 0 };
      const counts = await getUserPostCounts(handle);
      return {
        all: toCount(counts.totalPostCount),
        published: toCount(counts.publishedCount),
        drafts: toCount(counts.draftCount),
      };
    },
  });
}
