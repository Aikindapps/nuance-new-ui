import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";
import type { ActorsValue } from "../../../contexts/useActors";
import type { Article } from "../types";

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

// Shared post → Article transformation. Used by both useArticles (popular/new
// feeds) and useFollowing (authed personalized feed). Same pipeline:
// keyProps → group by bucket → batch-fetch posts → lowercase handles →
// batch-fetch users → assemble.
//
// Throws when keyProps were returned but every post failed to hydrate so
// React Query enters its retry/error state rather than rendering an empty
// feed. Returns [] when keyProps itself was empty (legitimate end-of-feed).
export async function hydrateArticles(
  actors: Pick<ActorsValue, "getPostsByPostIds" | "getUsersByHandles">,
  keyProps: PostKeyProperties[],
  // My Articles needs draft bodies; the public feeds pass false (default).
  includeDraft = false,
): Promise<Article[]> {
  if (keyProps.length === 0) return [];

  const byBucket = new Map<string, string[]>();
  for (const kp of keyProps) {
    const list = byBucket.get(kp.bucketCanisterId) ?? [];
    list.push(kp.postId);
    byBucket.set(kp.bucketCanisterId, list);
  }

  // Per-bucket catch: a single failing bucket drops its posts but leaves the
  // rest of the page intact. Top-level PostCore failures stay uncaught so
  // React Query handles the truly-broken case.
  const bucketResults = await Promise.all(
    Array.from(byBucket.entries()).map(([bucketId, ids]) =>
      actors.getPostsByPostIds(bucketId, ids, includeDraft).catch((e) => {
        console.warn(`[hydrateArticles] bucket ${bucketId} failed:`, e);
        return [];
      }),
    ),
  );
  const postMap = new Map(bucketResults.flat().map((p) => [p.postId, p]));

  // User.getUsersByHandles looks up via a lowercase reverse index — pass
  // lowercased handles or the canister silently returns nothing (project
  // lesson 2026-04-22).
  const handles = new Set<string>();
  for (const p of postMap.values()) {
    if (p.handle) handles.add(p.handle.toLowerCase());
    if (p.isPublication && p.creatorHandle) handles.add(p.creatorHandle.toLowerCase());
  }

  const userList =
    handles.size > 0
      ? await actors.getUsersByHandles(Array.from(handles)).catch((e) => {
          console.warn("[hydrateArticles] user hydration failed:", e);
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
      if (!authorHandle) return null;

      const pubHandle = isPub ? post.handle : null;
      const author = userMap.get(authorHandle.toLowerCase());
      const pub = pubHandle ? userMap.get(pubHandle.toLowerCase()) : null;

      return {
        id: post.postId,
        bucketCanisterId: post.bucketCanisterId,
        // Vendor buildPostUrl keys the first URL segment off the post's own
        // `handle` (publication handle for pub posts), lowercased.
        routeHandle: (post.handle || authorHandle).toLowerCase(),
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
  if (articles.length === 0) {
    throw new Error("All posts failed to hydrate from buckets");
  }

  return articles;
}
