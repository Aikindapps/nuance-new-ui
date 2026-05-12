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
// Sources (called in parallel per page):
//   - PostCore.getPostsByFollowers(handles, from, to)
//     handles = useMyProfile().followersArray (the User canister stores the
//     list of principals the user follows under followersArray — misleading
//     name; the Motoko code adds the followed author's principal to the
//     caller's followersArray).
//   - PostCore.getMyFollowingTagsPostKeyProperties(from, to)
//     uses msg.caller (authed agent required, supplied by Phase 4
//     ActorsContext).
//
// Empty state (driven from FollowingTab): when both sources are EXPECTED to
// be empty — followersArray.length === 0 AND getMyTags().length === 0 — the
// tab renders the locked empty-state copy instead of fetching.
//
// Pagination: each page calls both sources with the SAME (indexFrom,
// indexTo) range. Merge → dedupe → sort gives variable per-page article
// counts; pagination math uses the merged keyProps length so subsequent
// pages step from the previous tip. Approximate (the two sources don't
// share a global index) but functional — fine for a feed.

type ArticlesPage = {
  articles: import("../types").Article[];
  keyPropsLength: number;
};

async function fetchFollowing(
  actors: ActorsValue,
  handles: string[],
  hasTags: boolean,
  skip: number,
  count: number,
): Promise<ArticlesPage> {
  const indexFrom = skip;
  const indexTo = skip + count;
  // PostCore looks up via lowercaseHandleReverseHashMap — must lowercase
  // (project lesson 2026-04-22, same gotcha as User.getUsersByHandles).
  const lowered = handles.map((h) => h.toLowerCase());

  const [byWritersResp, byTagsResp] = await Promise.all([
    handles.length > 0
      ? actors.getPostsByFollowers(lowered, indexFrom, indexTo)
      : Promise.resolve({ totalCount: "0", posts: [] }),
    hasTags
      ? actors.getMyFollowingTagsPostKeyProperties(indexFrom, indexTo)
      : Promise.resolve({ totalCount: "0", posts: [] }),
  ]);

  // Merge, dedupe by postId, sort by publishedDate desc (ms-since-epoch as
  // text — parseInt; project lesson 2026-04-22 confirms ms not ns).
  const seen = new Set<string>();
  const merged: PostKeyProperties[] = [];
  for (const kp of byWritersResp.posts) {
    if (!seen.has(kp.postId)) {
      seen.add(kp.postId);
      merged.push(kp);
    }
  }
  for (const kp of byTagsResp.posts) {
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

  if (merged.length === 0) return { articles: [], keyPropsLength: 0 };

  const articles = await hydrateArticles(actors, merged);
  return { articles, keyPropsLength: merged.length };
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
    enabled:
      profile.isSuccess && tags.isSuccess && (hasFollows || hasTags),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const count = pageParam === 0 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      return fetchFollowing(
        actors,
        followHandles,
        hasTags,
        pageParam as number,
        count,
      );
    },
    // Subsequent pages step from the merged length of all prior pages.
    // The two sources are paginated with the SAME (from, to) range so
    // their underlying indices stay aligned with the union page.
    getNextPageParam: (lastPage, allPages) => {
      const expectedCount =
        allPages.length === 1 ? FEATURED_PAGE_SIZE : INFINITE_PAGE_SIZE;
      // Both sources returned fewer than expected → reached the end of both.
      if (lastPage.keyPropsLength < expectedCount) return undefined;
      return allPages.reduce((sum, p) => sum + p.keyPropsLength, 0);
    },
    staleTime: 1000 * 60 * 2,
  });
}
