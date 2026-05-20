import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { PostBucketType__1 } from "../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../candid/User/User";

// The article body + its author/publication User records.
//
// Two-stage fetch: PostBucket.getPost for the body, then User.getUsersByHandles
// to hydrate the author (and the publication, when the post belongs to one).
// Views/claps/tags are NOT here — they live on PostKeyProperties in PostCore;
// see usePostMeta. Keeping them in a separate query lets the article body
// paint even while/if the meta call is slow or fails.
//
// Premium / members-only posts: PostBucket.getPost returns the record with
// `content` blanked to "". The hook passes that through unchanged — the
// consumer detects `(isPremium || isMembersOnly) && content === ""` and shows
// a locked state. The paywall purchase flow (Page 3.4) is out of scope.

export type ArticleData = {
  post: PostBucketType__1;
  // The human author. For a publication post this is the writer
  // (creatorHandle); for a normal post it equals the post handle.
  author: UserListItem | null;
  // The publication, when the post belongs to one; null otherwise.
  publication: UserListItem | null;
  // How many writers/publications the author follows — `followersArray` on
  // the User record is the forward "following" list (project lesson
  // 2026-05-12). Not on UserListItem, so it needs the full User record.
  // null when the author's profile could not be resolved.
  authorFollowingCount: number | null;
};

// A query that resolves to null means "no such article" (the canister
// returned an `err` — not found, or an unauthorized draft). A rejected query
// means a genuine network/replica failure. Consumers distinguish the two:
// `data === null` → not-found UI; `isError` → error UI.
export function useArticle(bucketCanisterId: string, postId: string) {
  const { getPost, getUsersByHandles, getUserByPrincipalId } = useActors();

  return useQuery<ArticleData | null>({
    queryKey: ["article", bucketCanisterId, postId],
    // Don't fire with empty args — the route component renders a not-found
    // state for malformed URLs but the hook calls run before that render.
    // PR #7 review M1.
    enabled: postId !== "" && bucketCanisterId !== "",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await getPost(bucketCanisterId, postId);
      // `err` here can only be not-found or unauthorized-draft — a transport
      // failure rejects before a Result is produced. Same reasoning as
      // useMyProfile (PR #6 review m1): treat every `err` as not-found.
      if ("err" in result) return null;
      const post = result.ok;

      const isPub = post.isPublication;
      const authorHandle =
        isPub && post.creatorHandle ? post.creatorHandle : post.handle;
      const pubHandle = isPub ? post.handle : null;

      // User.getUsersByHandles matches via a lowercase reverse index — pass
      // lowercased handles (project lesson 2026-04-22).
      const handles = new Set<string>();
      if (authorHandle) handles.add(authorHandle.toLowerCase());
      if (pubHandle) handles.add(pubHandle.toLowerCase());

      // Author/publication records and the author's full profile (for the
      // following count) are independent reads — fetch them in parallel.
      const [users, authorProfile] = await Promise.all([
        handles.size > 0
          ? getUsersByHandles(Array.from(handles)).catch((e) => {
              console.warn("[useArticle] author hydration failed:", e);
              return [] as UserListItem[];
            })
          : Promise.resolve([] as UserListItem[]),
        post.creatorPrincipal
          ? getUserByPrincipalId(post.creatorPrincipal).catch(() => null)
          : Promise.resolve(null),
      ]);
      const userMap = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

      const authorFollowingCount =
        authorProfile && "ok" in authorProfile
          ? authorProfile.ok.followersArray.length
          : null;

      return {
        post,
        author: authorHandle
          ? (userMap.get(authorHandle.toLowerCase()) ?? null)
          : null,
        publication: pubHandle
          ? (userMap.get(pubHandle.toLowerCase()) ?? null)
          : null,
        authorFollowingCount,
      };
    },
  });
}
