import { useQuery } from "@tanstack/react-query";
import { getPostBucketActor, getPostCoreActor, getUserActor } from "../../../lib/actors";
import type { UserListItem } from "../../../candid/User/User";
import type { PostKeyProperties__1 } from "../../../candid/PostCore/PostCore";

type PopularDiscovery = {
  writers: UserListItem[];
  publications: UserListItem[];
  topics: string[];
};

// Sample widely across both popular and latest to find enough distinct
// writers + publications + topics. Mainnet has concentrated activity: a few
// authors produce most popular posts, so a narrow popular-only sample yields
// 1-2 unique handles. Combining sorts gives much better variety.
const SAMPLE_POPULAR = 80;
const SAMPLE_LATEST = 80;
const TOP_WRITERS = 5;
const TOP_PUBLICATIONS = 2;
const TOP_TOPICS = 20;

async function fetchPopularDiscovery(): Promise<PopularDiscovery> {
  // Sample from the 7-day popular window to match the Popular tab's canister
  // call (useArticles uses getPopularThisWeek). Keeps writers / publications /
  // topics rails thematically consistent with the articles grid.
  const postCore = getPostCoreActor();
  const [popular, latest] = await Promise.all([
    postCore.getPopularThisWeek(0, SAMPLE_POPULAR).then((r) => r.posts).catch(() => []),
    postCore.getLatestPosts(0, SAMPLE_LATEST).then((r) => r.posts).catch(() => []),
  ]);

  // Popular first so its authors/publications sort to the top
  const allKeys: PostKeyProperties__1[] = [...popular, ...latest];
  if (allKeys.length === 0) return { writers: [], publications: [], topics: [] };

  // Group by bucket for batched full-post fetch
  const byBucket = new Map<string, Set<string>>();
  for (const kp of allKeys) {
    const set = byBucket.get(kp.bucketCanisterId) ?? new Set<string>();
    set.add(kp.postId);
    byBucket.set(kp.bucketCanisterId, set);
  }

  const bucketResults = await Promise.all(
    Array.from(byBucket.entries()).map(([id, ids]) =>
      getPostBucketActor(id)
        .getPostsByPostIds(Array.from(ids), false)
        .catch(() => []),
    ),
  );
  const postMap = new Map(bucketResults.flat().map((p) => [p.postId, p]));

  // Walk allKeys in order (popular first) to build author + pub lists
  const authorOrder: string[] = [];
  const authorSeen = new Set<string>();
  const pubOrder: string[] = [];
  const pubSeen = new Set<string>();

  for (const kp of allKeys) {
    const p = postMap.get(kp.postId);
    if (!p) continue;
    const authorHandle =
      p.isPublication && p.creatorHandle ? p.creatorHandle : p.handle;
    if (authorHandle && !authorSeen.has(authorHandle)) {
      authorSeen.add(authorHandle);
      authorOrder.push(authorHandle);
    }
    if (p.isPublication && p.handle && !pubSeen.has(p.handle)) {
      pubSeen.add(p.handle);
      pubOrder.push(p.handle);
    }
  }

  const topWriters = authorOrder.slice(0, TOP_WRITERS);
  const topPubs = pubOrder.slice(0, TOP_PUBLICATIONS);

  // Aggregate tag frequencies across the popular+latest keyProps (tags live
  // on PostKeyProperties from PostCore, not on PostBucket's bucket type).
  // Dedupe case-insensitively but preserve the first-seen display form.
  const tagCounts = new Map<string, number>();
  const tagDisplay = new Map<string, string>();
  for (const kp of allKeys) {
    for (const t of kp.tags) {
      const raw = t.tagName.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
      if (!tagDisplay.has(key)) tagDisplay.set(key, raw);
    }
  }
  const topics = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TOPICS)
    .map(([key]) => tagDisplay.get(key)!);

  // User.getUsersByHandles looks up via a lowercase reverse index — pass
  // lowercased handles or the canister silently returns nothing.
  const allHandles = Array.from(
    new Set([...topWriters, ...topPubs].map((h) => h.toLowerCase())),
  );
  const users =
    allHandles.length > 0
      ? await getUserActor()
          .getUsersByHandles(allHandles)
          .catch(() => [] as UserListItem[])
      : [];
  const byHandle = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

  return {
    writers: topWriters
      .map((h) => byHandle.get(h.toLowerCase()))
      .filter((u): u is UserListItem => u != null),
    publications: topPubs
      .map((h) => byHandle.get(h.toLowerCase()))
      .filter((u): u is UserListItem => u != null),
    topics,
  };
}

export function usePopularDiscovery() {
  return useQuery({
    queryKey: ["popular-discovery"],
    queryFn: fetchPopularDiscovery,
    staleTime: 1000 * 60 * 5,
  });
}
