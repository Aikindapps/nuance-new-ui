import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "../../home/hooks/useArticles";

// NIC-41 Search Phase 1: client-side pagination over a hard-capped id list.
//
// searchPost(q) returns the FULL id list with no server paging. We cap at 60
// ids and paginate client-side, mirroring the useAuthorPosts pattern:
// fetch ids on page 0, carry the full list forward in pageParam.
//
// Page shape mirrors useArticles / ArticleFeed:
//   { articles: Article[], keyPropsLength: number }

const SEARCH_CAP = 60;

type ArticlesPage = {
  articles: import("../../home/types").Article[];
  keyPropsLength: number;
  allIds: string[];
  nextOffset: number;
};

type PageParam = { offset: number; allIds: string[] | null };

const INITIAL_PAGE_PARAM: PageParam = { offset: 0, allIds: null };

async function fetchSearchPage(
  actors: ActorsValue,
  q: string,
  pageParam: PageParam,
): Promise<ArticlesPage> {
  // Page 0 fetches the full id list and caps it; later pages reuse it.
  const allIds: string[] =
    pageParam.allIds !== null
      ? pageParam.allIds
      : (await actors.searchPost(q)).slice(0, SEARCH_CAP);

  const count =
    pageParam.offset === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
  const slice = allIds.slice(pageParam.offset, pageParam.offset + count);

  if (slice.length === 0) {
    return { articles: [], keyPropsLength: 0, allIds, nextOffset: pageParam.offset + count };
  }

  const keyProps = await actors.getPostKeyPropertiesByIds(slice);
  const articles = keyProps.length > 0 ? await hydrateArticles(actors, keyProps) : [];

  return {
    articles,
    keyPropsLength: slice.length,
    allIds,
    nextOffset: pageParam.offset + count,
  };
}

export function useSearchPosts(q: string) {
  const actors = useActors();

  return useInfiniteQuery({
    queryKey: ["search-posts", q],
    enabled: q.trim() !== "",
    initialPageParam: INITIAL_PAGE_PARAM,
    queryFn: ({ pageParam }) =>
      fetchSearchPage(actors, q, pageParam),
    getNextPageParam: (lastPage): PageParam | undefined => {
      if (lastPage.nextOffset >= lastPage.allIds.length) return undefined;
      return { offset: lastPage.nextOffset, allIds: lastPage.allIds };
    },
    staleTime: 2 * 60 * 1000,
  });
}
