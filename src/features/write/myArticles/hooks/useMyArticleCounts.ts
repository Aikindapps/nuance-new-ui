import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";
import type { MyArticleFilter } from "./useMyArticles";

// Counts for the My-Articles tab bar (All / Published / Drafts). Each count is
// the number of posts returned by that tab's own backend endpoint, so every
// count matches exactly what its tab lists — no derivation, no misclassifying
// legacy states. Key properties only (no hydration); fired once and cached.
// PAGE_SIZE mirrors useMyArticles' list fetch so the count agrees with the list.
export type MyArticleCounts = Record<MyArticleFilter, number>;

const PAGE_SIZE = 50;

export function useMyArticleCounts() {
  const actors = useActors();
  const { isAuthenticated, principal } = useAuth();
  return useQuery<MyArticleCounts>({
    queryKey: ["my-article-counts", principal?.toText() ?? "anon"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const [all, published, drafts] = await Promise.all([
        actors.getMyAllPosts(0, PAGE_SIZE),
        actors.getMyPublishedPosts(0, PAGE_SIZE),
        actors.getMyDraftPosts(0, PAGE_SIZE),
      ]);
      return {
        all: all.length,
        published: published.length,
        drafts: drafts.length,
      };
    },
  });
}
