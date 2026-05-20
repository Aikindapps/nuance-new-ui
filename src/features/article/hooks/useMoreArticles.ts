import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import type { Article } from "../../home/types";

// "More from {author}" rail — Figma 1:5365.
//
// PostCore.getMoreArticlesFromUsers returns up to 5 recent published posts
// per handle, already excluding the current postId. Key properties only, so
// bodies hydrate through the shared hydrateArticles pipeline (group by
// bucket → batch-fetch → join authors). Returns [] when the author has no
// other posts — the rail then renders nothing.
export function useMoreArticles(postId: string, authorHandle: string) {
  const actors = useActors();

  return useQuery<Article[]>({
    queryKey: ["more-articles", postId, authorHandle],
    enabled: postId !== "" && authorHandle !== "",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const groups = await actors.getMoreArticlesFromUsers(postId, [
        authorHandle.toLowerCase(),
      ]);
      const keyProps = groups.flat();
      if (keyProps.length === 0) return [];
      return hydrateArticles(actors, keyProps);
    },
  });
}
