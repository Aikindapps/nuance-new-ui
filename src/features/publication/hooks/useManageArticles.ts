import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { hydrateArticles } from "../../home/lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "../../home/hooks/useArticles";
import type { Article } from "../../home/types";

// Date formatter mirroring hydrateArticles.ts formatDate (ms-since-epoch Text).
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
];

function formatDate(ms: string): string {
  if (!ms || !ms.trim()) return "";
  const n = Number.parseInt(ms.trim(), 10);
  if (!Number.isFinite(n) || n === 0) return "";
  const date = new Date(n);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Row model — one per article in the manage list.
export type ManageArticleRow = {
  article: Article;           // hydrated (title/author/imageSrc/routeHandle/hasNft/bucketCanisterId)
  isDraft: boolean;           // kp.isDraft — Live toggle ON = published = isDraft:false
  category: string;           // kp.category (display-only)
  published: string;          // formatted from kp.publishedDate (fallback: kp.created)
  modified: string;           // formatted from kp.modified
  bucketCanisterId: string;   // kp.bucketCanisterId (for toggle mutation)
  postId: string;             // kp.postId
};

export type ManageArticlePage = {
  rows: ManageArticleRow[];
  keyPropsLength: number;
};

// Query key factory — exported so the toggle mutation can reference the same key.
export const manageArticlesKey = (handle: string) => ["manage-articles", handle];

async function fetchManageArticlesPage(
  actors: ActorsValue,
  handle: string,
  skip: number,
  count: number,
): Promise<ManageArticlePage> {
  const keyProps = await actors.getPublicationPosts(skip, skip + count, handle);
  if (keyProps.length === 0) return { rows: [], keyPropsLength: 0 };

  // hydrateArticles groups by bucket, batch-fetches bodies + user profiles.
  // It throws when ALL posts fail to hydrate (lets React Query retry).
  const articles = await hydrateArticles(actors, keyProps);
  const articleMap = new Map<string, Article>(articles.map((a) => [a.id, a]));

  // ZIP: only include keyProps whose article hydrated successfully.
  const rows: ManageArticleRow[] = [];
  for (const kp of keyProps) {
    const article = articleMap.get(kp.postId);
    if (!article) continue;
    rows.push({
      article,
      isDraft: kp.isDraft,
      category: kp.category,
      published: formatDate(kp.publishedDate) || formatDate(kp.created),
      modified: formatDate(kp.modified),
      bucketCanisterId: kp.bucketCanisterId,
      postId: kp.postId,
    });
  }

  return { rows, keyPropsLength: keyProps.length };
}

// Infinite-scroll hook for the Manage Articles 6.1 screen.
// Mirrors usePublicationPosts: same page-size constants, same getNextPageParam
// math (raw keyPropsLength, not filtered row count, to avoid pageParam drift).
export function useManageArticles(handle: string) {
  const actors = useActors();

  const query = useInfiniteQuery({
    queryKey: manageArticlesKey(handle),
    enabled: handle !== "",
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const count = pageParam === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      return fetchManageArticlesPage(actors, handle, pageParam as number, count);
    },
    getNextPageParam: (lastPage, allPages) => {
      const expectedCount =
        allPages.length === 1 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      if (lastPage.keyPropsLength < expectedCount) return undefined;
      return allPages.reduce((sum, p) => sum + p.keyPropsLength, 0);
    },
    staleTime: 2 * 60 * 1000,
  });

  return {
    rows: query.data?.pages.flatMap((p) => p.rows) ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
