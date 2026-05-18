import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../lib/hydrateArticles";

type Variant = "popular" | "new";

const FEATURED_PAGE_SIZE = 8;
const INFINITE_PAGE_SIZE = 6;

type ArticlesPage = {
  articles: import("../types").Article[];
  // Raw PostCore keyProps count for this page — drives pagination math
  // independent of how many keyProps survive bucket/user hydration.
  keyPropsLength: number;
};

async function fetchArticles(
  actors: ActorsValue,
  variant: Variant,
  skip: number,
  count: number,
): Promise<ArticlesPage> {
  // PostCore's getPopular*/getLatestPosts take (indexFrom, indexTo) — a range,
  // NOT (skip, count). Convert at the boundary.
  // "Popular" uses the 7-day window (getPopularThisWeek) rather than all-time
  // (getPopular), so the front page surfaces fresher content. Formula is the
  // same on every variant: popularity = (claps + applauds + 1) × (views + 1).
  const indexFrom = skip;
  const indexTo = skip + count;
  const { posts: keyProps } =
    variant === "popular"
      ? await actors.getPopularThisWeek(indexFrom, indexTo)
      : await actors.getLatestPosts(indexFrom, indexTo);

  if (keyProps.length === 0) return { articles: [], keyPropsLength: 0 };

  const articles = await hydrateArticles(actors, keyProps);
  return { articles, keyPropsLength: keyProps.length };
}

export function useArticles(variant: Variant) {
  const actors = useActors();
  return useInfiniteQuery({
    queryKey: ["articles", variant],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const count = pageParam === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      return fetchArticles(actors, variant, pageParam as number, count);
    },
    // Pagination math runs on raw keyProps counts (the actual indexFrom/indexTo
    // PostCore uses), not on filtered Article counts — otherwise dropped posts
    // cause pageParam to drift and re-fetch already-shown posts.
    getNextPageParam: (lastPage, allPages) => {
      const expectedCount =
        allPages.length === 1 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      if (lastPage.keyPropsLength < expectedCount) return undefined;
      return allPages.reduce((sum, p) => sum + p.keyPropsLength, 0);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE };
