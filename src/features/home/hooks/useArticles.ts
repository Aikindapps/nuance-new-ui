import { useInfiniteQuery } from "@tanstack/react-query";
import { getPostBucketActor, getPostCoreActor, getUserActor } from "../../../lib/actors";
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

async function fetchArticles(
  variant: Variant,
  skip: number,
  count: number,
): Promise<Article[]> {
  // PostCore's getPopular*/getLatestPosts take (indexFrom, indexTo) — a range,
  // NOT (skip, count). Convert at the boundary.
  // "Popular" uses the 7-day window (getPopularThisWeek) rather than all-time
  // (getPopular), so the front page surfaces fresher content. Formula is the
  // same on every variant: popularity = (claps + applauds + 1) × (views + 1).
  const indexFrom = skip;
  const indexTo = skip + count;
  const postCore = getPostCoreActor();
  const { posts: keyProps } =
    variant === "popular"
      ? await postCore.getPopularThisWeek(indexFrom, indexTo)
      : await postCore.getLatestPosts(indexFrom, indexTo);

  if (keyProps.length === 0) return [];

  const byBucket = new Map<string, string[]>();
  for (const kp of keyProps) {
    const list = byBucket.get(kp.bucketCanisterId) ?? [];
    list.push(kp.postId);
    byBucket.set(kp.bucketCanisterId, list);
  }

  const bucketResults = await Promise.all(
    Array.from(byBucket.entries()).map(([bucketId, ids]) =>
      getPostBucketActor(bucketId).getPostsByPostIds(ids, false),
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

  const userList =
    handles.size > 0
      ? await getUserActor().getUsersByHandles(Array.from(handles))
      : [];
  const userMap = new Map(userList.map((u) => [u.handle.toLowerCase(), u]));

  return keyProps
    .map((kp): Article | null => {
      const post = postMap.get(kp.postId);
      if (!post) return null;

      const isPub = post.isPublication;
      const authorHandle =
        isPub && post.creatorHandle ? post.creatorHandle : post.handle;
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
}

export function useArticles(variant: Variant) {
  return useInfiniteQuery({
    queryKey: ["articles", variant],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const count = pageParam === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      return fetchArticles(variant, pageParam as number, count);
    },
    getNextPageParam: (lastPage, allPages) => {
      const expectedCount =
        allPages.length === 1 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      if (lastPage.length < expectedCount) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE };
