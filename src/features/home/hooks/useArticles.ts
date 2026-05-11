import { useInfiniteQuery } from "@tanstack/react-query";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import type { Article } from "../types";

type Variant = "popular" | "new";

const FEATURED_PAGE_SIZE = 8;
const INFINITE_PAGE_SIZE = 6;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
];

// Nuance date fields are stored as milliseconds-since-epoch in Text form.
// NOT nanoseconds — confirmed by the old frontend's `formatDate` helper
// (Number.parseInt → new Date(ms) directly). Returns "" for empty / "0" /
// unparseable values so callers can choose a fallback source.
function formatDate(ms: string): string {
  if (!ms || !ms.trim()) return "";
  const n = Number.parseInt(ms.trim(), 10);
  if (!Number.isFinite(n) || n === 0) return "";
  const date = new Date(n);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Prefer the first-published date; fall back to the created date for legacy
// posts where publishedDate was never set (stored as "0"). Matches the old
// nuance-frontend's `formatDate(publishedDate) || formatDate(created)`.
function formatPublishedDate(publishedDate: string, created: string): string {
  return formatDate(publishedDate) || formatDate(created);
}

type ArticlesPage = {
  articles: Article[];
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
  const { getPopularThisWeek, getLatestPosts, getPostsByPostIds, getUsersByHandles } = actors;
  // PostCore's getPopular*/getLatestPosts take (indexFrom, indexTo) — a range,
  // NOT (skip, count). Convert at the boundary.
  // "Popular" uses the 7-day window (getPopularThisWeek) rather than all-time
  // (getPopular), so the front page surfaces fresher content. Formula is the
  // same on every variant: popularity = (claps + applauds + 1) × (views + 1).
  const indexFrom = skip;
  const indexTo = skip + count;
  const { posts: keyProps } =
    variant === "popular"
      ? await getPopularThisWeek(indexFrom, indexTo)
      : await getLatestPosts(indexFrom, indexTo);

  if (keyProps.length === 0) return { articles: [], keyPropsLength: 0 };

  const byBucket = new Map<string, string[]>();
  for (const kp of keyProps) {
    const list = byBucket.get(kp.bucketCanisterId) ?? [];
    list.push(kp.postId);
    byBucket.set(kp.bucketCanisterId, list);
  }

  // Per-bucket catch: a single failing bucket drops its posts but leaves the
  // rest of the page intact. Top-level PostCore failures above stay uncaught
  // so React Query handles the truly-broken case.
  const bucketResults = await Promise.all(
    Array.from(byBucket.entries()).map(([bucketId, ids]) =>
      getPostsByPostIds(bucketId, ids, false).catch((e) => {
        console.warn(`[useArticles] bucket ${bucketId} failed:`, e);
        return [];
      }),
    ),
  );
  const postMap = new Map(bucketResults.flat().map((p) => [p.postId, p]));

  // User.getUsersByHandles looks up via a lowercase reverse index — pass
  // lowercased handles or the canister silently returns nothing.
  const handles = new Set<string>();
  for (const p of postMap.values()) {
    if (p.handle) handles.add(p.handle.toLowerCase());
    if (p.isPublication && p.creatorHandle) handles.add(p.creatorHandle.toLowerCase());
  }

  // User-hydration failure degrades author/avatar fields but doesn't block the
  // feed (display already falls back to handle / empty avatar).
  const userList =
    handles.size > 0
      ? await getUsersByHandles(Array.from(handles)).catch((e) => {
          console.warn("[useArticles] user hydration failed:", e);
          return [];
        })
      : [];
  const userMap = new Map(userList.map((u) => [u.handle.toLowerCase(), u]));

  const articles = keyProps
    .map((kp): Article | null => {
      const post = postMap.get(kp.postId);
      if (!post) return null;

      const isPub = post.isPublication;
      const authorHandle =
        isPub && post.creatorHandle ? post.creatorHandle : post.handle;
      // Skip posts with no usable handle — would render byline as "@".
      if (!authorHandle) return null;

      const pubHandle = isPub ? post.handle : null;
      const author = userMap.get(authorHandle.toLowerCase());
      const pub = pubHandle ? userMap.get(pubHandle.toLowerCase()) : null;

      return {
        id: post.postId,
        title: post.title || "Untitled",
        excerpt: post.subtitle || "",
        imageSrc: post.headerImage || "",
        imageAlt: post.title || "Article",
        author: {
          handle: `@${authorHandle}`,
          displayName: author?.displayName || authorHandle,
          avatarSrc: author?.avatar || "",
          isVerified: author?.isVerified ?? false,
        },
        publication: pubHandle
          ? { name: pub?.displayName || pubHandle, slug: pubHandle }
          : null,
        publishedOn: formatPublishedDate(post.publishedDate, post.created),
        claps: Number(kp.claps) || 0,
        hasNft: Boolean(post.nftCanisterId),
      };
    })
    .filter((a): a is Article => a !== null);

  // PostCore returned posts but every one failed to hydrate — treat as an
  // error so React Query retries instead of rendering an empty feed.
  if (keyProps.length > 0 && articles.length === 0) {
    throw new Error("All posts failed to hydrate from buckets");
  }

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
