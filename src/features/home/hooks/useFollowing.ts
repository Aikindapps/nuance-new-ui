import { useInfiniteQuery } from "@tanstack/react-query";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { useMyProfile } from "./useMyProfile";
import { useMyTags } from "./useMyTags";
import { hydrateArticles } from "../lib/hydrateArticles";
import { FEATURED_PAGE_SIZE, INFINITE_PAGE_SIZE } from "./useArticles";

// useFollowing — merged feed of articles from people you follow + articles
// tagged with topics you follow. Sorted by publish date desc, deduped by
// postId.
//
// Sources:
//   - PostCore.getPostsByFollowers(handles, from, to)
//     handles = useMyProfile().followersArray. The User canister's buildUser
//     converts the internally-stored principal IDs to handles before
//     returning the record, so this field IS handles (verified against
//     src/User/main.mo buildHandlesFromPrincipalIdsArray).
//   - PostCore.getMyFollowingTagsPostKeyProperties(from, to)
//     uses msg.caller (authed agent required, supplied by Phase 4
//     ActorsContext).
//
// Empty state (driven from FollowingTab): when both sources are EXPECTED to
// be empty — followersArray.length === 0 AND getMyTags().length === 0 — the
// tab renders the locked empty-state copy instead of fetching.
//
// Pagination (decision #28): the two sources have independent index spaces,
// so a shared cursor cannot page their union without skipping or duplicating
// articles. Instead the FULL keyProps list is fetched from each source once
// (capped — see FEED_DEPTH_PER_SOURCE), merged + deduped + sorted ONCE into a
// single global list, and that list is then paginated CLIENT-SIDE. The merged
// list rides along in the React Query pageParam so later pages slice it
// without re-fetching. Hydration (the expensive bucket + user calls) stays
// lazy — one count-sized slice per page.

// Per-source fetch depth. The merged feed is therefore up to 2× this deep
// (minus dedupe overlap). Bounds the keyProps response well under ICP's
// ~2MB query-response limit; deep enough that scroll-exhaustion is a
// non-issue for nearly all users. Decision #28.
const FEED_DEPTH_PER_SOURCE = 120;

type ArticlesPage = {
  articles: import("../types").Article[];
  // Count of merged keyProps consumed by THIS page (drives the empty/error
  // distinction in hydrateArticles' caller and pagination end-detection).
  keyPropsLength: number;
  // The full sorted+deduped keyProps list, carried forward so pages > 0 can
  // slice it without re-fetching. Identical object across every page.
  merged: PostKeyProperties[];
  // Offset into `merged` where the NEXT page begins. >= merged.length means
  // the feed is exhausted.
  nextOffset: number;
};

// pageParam shape. Page 0 has no merged list yet (merged: null) — its queryFn
// fetches + builds it. Pages > 0 carry the list built by page 0.
type PageParam = { offset: number; merged: PostKeyProperties[] | null };

const INITIAL_PAGE_PARAM: PageParam = { offset: 0, merged: null };

// Fetch the full keyProps list from both sources, merge → dedupe → sort.
// Called once (page 0); the result is reused for every subsequent page.
async function fetchMergedKeyProps(
  actors: ActorsValue,
  handles: string[],
  hasTags: boolean,
): Promise<PostKeyProperties[]> {
  // PostCore looks up via lowercaseHandleReverseHashMap — must lowercase
  // (project lesson 2026-04-22, same gotcha as User.getUsersByHandles).
  const lowered = handles.map((h) => h.toLowerCase());

  const [byWritersResp, byTagsResp] = await Promise.all([
    handles.length > 0
      ? actors.getPostsByFollowers(lowered, 0, FEED_DEPTH_PER_SOURCE)
      : Promise.resolve({ totalCount: "0", posts: [] }),
    hasTags
      ? actors.getMyFollowingTagsPostKeyProperties(0, FEED_DEPTH_PER_SOURCE)
      : Promise.resolve({ totalCount: "0", posts: [] }),
  ]);

  // Merge, dedupe by postId (globally — a post can be both by a followed
  // writer and tagged with a followed topic), sort by publishedDate desc
  // (ms-since-epoch as text — parseInt; project lesson 2026-04-22 confirms
  // ms not ns).
  const seen = new Set<string>();
  const merged: PostKeyProperties[] = [];
  for (const kp of [...byWritersResp.posts, ...byTagsResp.posts]) {
    if (!seen.has(kp.postId)) {
      seen.add(kp.postId);
      merged.push(kp);
    }
  }
  merged.sort((a, b) => {
    const aMs = Number.parseInt(a.publishedDate, 10) || 0;
    const bMs = Number.parseInt(b.publishedDate, 10) || 0;
    return bMs - aMs;
  });
  return merged;
}

async function fetchFollowingPage(
  actors: ActorsValue,
  handles: string[],
  hasTags: boolean,
  pageParam: PageParam,
): Promise<ArticlesPage> {
  // Page 0 builds the merged list; later pages reuse the one passed forward.
  const merged =
    pageParam.merged ?? (await fetchMergedKeyProps(actors, handles, hasTags));

  const count =
    pageParam.offset === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
  const slice = merged.slice(pageParam.offset, pageParam.offset + count);
  const articles = slice.length > 0 ? await hydrateArticles(actors, slice) : [];

  return {
    articles,
    keyPropsLength: slice.length,
    merged,
    nextOffset: pageParam.offset + count,
  };
}

export function useFollowing() {
  const actors = useActors();
  const profile = useMyProfile();
  const tags = useMyTags();

  const followHandles = profile.data?.followersArray ?? [];
  const followedTags = tags.data ?? [];
  const hasFollows = followHandles.length > 0;
  const hasTags = followedTags.length > 0;
  const profileHandle = profile.data?.handle ?? null;

  return useInfiniteQuery({
    queryKey: [
      "following",
      profileHandle,
      followHandles.length,
      followedTags.length,
    ],
    // Don't fire if BOTH sources would be empty — FollowingTab renders the
    // empty-state copy in that case, no network needed.
    enabled: profile.isSuccess && tags.isSuccess && (hasFollows || hasTags),
    initialPageParam: INITIAL_PAGE_PARAM,
    queryFn: ({ pageParam }) =>
      fetchFollowingPage(actors, followHandles, hasTags, pageParam),
    // The merged list is global and fixed once page 0 builds it — pagination
    // is a pure client-side slice. Stop when the next slice would start at or
    // past the end of the merged list.
    getNextPageParam: (lastPage): PageParam | undefined => {
      if (lastPage.nextOffset >= lastPage.merged.length) return undefined;
      return { offset: lastPage.nextOffset, merged: lastPage.merged };
    },
    staleTime: 1000 * 60 * 2,
  });
}
