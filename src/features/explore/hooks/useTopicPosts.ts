import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "../../home/hooks/useArticles";

// NIC-43 Topic feed: client-side pagination over a hard-capped id list
// returned by searchByTag(tag). Mirror of useSearchPosts but calls
// actors.searchByTag instead of searchPost. Tag is passed verbatim —
// searchByTag is a case-sensitive exact-match lookup on the backend.

const SEARCH_CAP = 60;

type ArticlesPage = {
  articles: import("../../home/types").Article[];
  keyPropsLength: number;
  allIds: string[];
  nextOffset: number;
  totalCount: number;
};

type PageParam = { offset: number; allIds: string[] | null; totalCount: number };

const INITIAL_PAGE_PARAM: PageParam = { offset: 0, allIds: null, totalCount: 0 };

async function fetchTopicPage(
  actors: ActorsValue,
  tag: string,
  pageParam: PageParam,
): Promise<ArticlesPage> {
  // Page 0 fetches the full id list; later pages reuse it.
  let allIds: string[];
  let totalCount: number;
  if (pageParam.allIds !== null) {
    allIds = pageParam.allIds;
    totalCount = pageParam.totalCount;
  } else {
    const full = await actors.searchByTag(tag);
    totalCount = full.length;
    allIds = full.slice(0, SEARCH_CAP);
  }

  const count =
    pageParam.offset === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
  const slice = allIds.slice(pageParam.offset, pageParam.offset + count);

  if (slice.length === 0) {
    return {
      articles: [],
      keyPropsLength: 0,
      allIds,
      nextOffset: pageParam.offset + count,
      totalCount,
    };
  }

  const keyProps = await actors.getPostKeyPropertiesByIds(slice);
  const articles = keyProps.length > 0 ? await hydrateArticles(actors, keyProps) : [];

  return {
    articles,
    keyPropsLength: slice.length,
    allIds,
    nextOffset: pageParam.offset + count,
    totalCount,
  };
}

export function useTopicPosts(tag: string) {
  const actors = useActors();

  return useInfiniteQuery({
    queryKey: ["topic-posts", tag],
    enabled: tag.trim() !== "",
    initialPageParam: INITIAL_PAGE_PARAM,
    queryFn: ({ pageParam }) => fetchTopicPage(actors, tag, pageParam),
    getNextPageParam: (lastPage): PageParam | undefined => {
      if (lastPage.nextOffset >= lastPage.allIds.length) return undefined;
      return {
        offset: lastPage.nextOffset,
        allIds: lastPage.allIds,
        totalCount: lastPage.totalCount,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
