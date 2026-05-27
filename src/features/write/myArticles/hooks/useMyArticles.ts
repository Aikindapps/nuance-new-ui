import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";
import { hydrateArticles } from "../../../home/lib/hydrateArticles";
import type { Article } from "../../../home/types";

export type MyArticleFilter = "all" | "published" | "drafts";
export type MyArticle = Article & { isDraft: boolean };

// Fetches the authed caller's posts for a My-Articles tab and hydrates them
// into renderable cards. includeDraft=true so draft bodies hydrate. isDraft is
// zipped back from the key properties (not on the Article shape).
export function useMyArticles(filter: MyArticleFilter) {
  const actors = useActors();
  const { isAuthenticated, principal } = useAuth();
  return useQuery<MyArticle[]>({
    queryKey: ["my-articles", filter, principal?.toText() ?? "anon"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const get =
        filter === "drafts"
          ? actors.getMyDraftPosts
          : filter === "published"
            ? actors.getMyPublishedPosts
            : actors.getMyAllPosts;
      const keyProps = await get(0, 50);
      if (keyProps.length === 0) return [];
      const draftById = new Map(keyProps.map((k) => [k.postId, k.isDraft]));
      const articles = await hydrateArticles(actors, keyProps, true);
      return articles.map((a) => ({
        ...a,
        isDraft: draftById.get(a.id) ?? false,
      }));
    },
  });
}
