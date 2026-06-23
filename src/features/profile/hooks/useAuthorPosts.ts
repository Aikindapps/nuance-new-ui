import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "../../home/hooks/useArticles";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";

// Paginated authored-article feed for the writer profile page (NIC-42).
//
// getUserPosts(handle) returns ALL PostKeyProperties for that writer — no
// server-side range argument. Client-paginates newest-first using the same
// two-stage shape as useFollowing: fetch the full list on page 0, carry it
// forward in the pageParam, slice per page.
//
// Page shape mirrors useArticles / ArticleFeed exactly:
//   { articles: Article[], keyPropsLength: number }

type ArticlesPage = {
  articles: import("../../home/types").Article[];
  keyPropsLength: number;
  // Full sorted list, carried forward across pages.
  allKeyProps: PostKeyProperties[];
  nextOffset: number;
};

type PageParam = { offset: number; allKeyProps: PostKeyProperties[] | null };

const INITIAL_PAGE_PARAM: PageParam = { offset: 0, allKeyProps: null };

async function fetchAuthorPostsPage(
  actors: ActorsValue,
  handle: string,
  pageParam: PageParam,
): Promise<ArticlesPage> {
  // Page 0 fetches the full list; later pages reuse it.
  const allKeyProps: PostKeyProperties[] =
    pageParam.allKeyProps !== null
      ? pageParam.allKeyProps
      : await actors.getUserPosts(handle).then((kps) =>
          // Sort newest-first (ms-since-epoch as text — project lesson 2026-04-22).
          [...kps].sort((a, b) => {
            const aMs = Number.parseInt(a.publishedDate, 10) || 0;
            const bMs = Number.parseInt(b.publishedDate, 10) || 0;
            return bMs - aMs;
          }),
        );

  const count =
    pageParam.offset === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
  const slice = allKeyProps.slice(pageParam.offset, pageParam.offset + count);

  const articles =
    slice.length > 0 ? await hydrateArticles(actors, slice) : [];

  return {
    articles,
    keyPropsLength: slice.length,
    allKeyProps,
    nextOffset: pageParam.offset + count,
  };
}

export function useAuthorPosts(handle: string) {
  const actors = useActors();

  return useInfiniteQuery({
    queryKey: ["author-posts", handle],
    enabled: handle !== "",
    initialPageParam: INITIAL_PAGE_PARAM,
    queryFn: ({ pageParam }) =>
      fetchAuthorPostsPage(actors, handle, pageParam),
    getNextPageParam: (lastPage): PageParam | undefined => {
      if (lastPage.nextOffset >= lastPage.allKeyProps.length) return undefined;
      return { offset: lastPage.nextOffset, allKeyProps: lastPage.allKeyProps };
    },
    staleTime: 2 * 60 * 1000,
  });
}
