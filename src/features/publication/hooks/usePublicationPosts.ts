import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "../../home/hooks/useArticles";

// Range-paginated publication feed (NIC-42, fixed NIC-89).
//
// getPostsByFollowers([handle], from, to) is the reader-facing published-posts
// source — it is public and works for any caller including anonymous.
// Returns { totalCount: string; posts: PostKeyProperties[] }; we destructure
// .posts as keyProps. Mirrors the useArticles server-paged approach:
// (indexFrom, indexTo) half-open range.
//
// (Do NOT use getPublicationPosts here — that method is editor-gated on the
// backend and returns [] for all non-editor callers.)
//
// Page shape mirrors useArticles / ArticleFeed:
//   { articles: Article[], keyPropsLength: number }

type ArticlesPage = {
  articles: import("../../home/types").Article[];
  keyPropsLength: number;
};

async function fetchPublicationPage(
  actors: ActorsValue,
  handle: string,
  skip: number,
  count: number,
): Promise<ArticlesPage> {
  const { posts: keyProps } = await actors.getPostsByFollowers([handle], skip, skip + count);
  if (keyProps.length === 0) return { articles: [], keyPropsLength: 0 };
  const articles = await hydrateArticles(actors, keyProps);
  return { articles, keyPropsLength: keyProps.length };
}

export function usePublicationPosts(handle: string) {
  const actors = useActors();

  return useInfiniteQuery({
    queryKey: ["publication-posts", handle],
    enabled: handle !== "",
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const count = pageParam === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      return fetchPublicationPage(actors, handle, pageParam as number, count);
    },
    getNextPageParam: (lastPage, allPages) => {
      const expectedCount =
        allPages.length === 1 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      if (lastPage.keyPropsLength < expectedCount) return undefined;
      return allPages.reduce((sum, p) => sum + p.keyPropsLength, 0);
    },
    staleTime: 2 * 60 * 1000,
  });
}
