import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import type { Article } from "../../home/types";

// "Recommended other reads" rail — Figma 1:5373.
//
// Nuance has no canister-side recommendation API, and decision #29 rules out
// throwaway client-side recommendation heuristics. So this rail surfaces
// popular-this-week — the same real popularity signal the home page uses,
// not a faked personalization. The current article is filtered out.
const RECOMMENDED_LIMIT = 12;

export function useRecommendedArticles(postId: string) {
  const actors = useActors();

  return useQuery<Article[]>({
    queryKey: ["recommended-articles", postId],
    enabled: postId !== "",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { posts } = await actors.getPopularThisWeek(0, RECOMMENDED_LIMIT);
      const keyProps = posts.filter((p) => p.postId !== postId);
      if (keyProps.length === 0) return [];
      return hydrateArticles(actors, keyProps);
    },
  });
}
