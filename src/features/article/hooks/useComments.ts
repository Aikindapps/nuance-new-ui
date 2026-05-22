import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type {
  Comment,
  CommentsReturnType,
} from "../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../candid/User/User";

// Comments thread for an article (PR #8 Phase 4a, decision #34).
//
// Two-stage fetch:
// 1. PostBucket.getPostComments → returns full thread (server-assembled
//    `replies` recursion + totalNumberOfComments).
// 2. User.getUsersByPrincipals for every commenter + every reply creator —
//    BY PRINCIPAL, because PostBucket returns `comment.handle` and
//    `comment.avatar` blanked. Only `creator` (principal text) is reliable
//    on the Comment record (verified against mainnet canister 2026-05-21).
//
// Returns `userMap` keyed by principal text for downstream CommentBlock
// rendering. A failed hydration call doesn't fail the whole query —
// comments still render with whatever User records came back; missing
// commenters fall back to "(unknown user)".

export type CommentsData = CommentsReturnType & {
  userMap: Map<string, UserListItem>;
};

function collectCreators(comments: ReadonlyArray<Comment>): string[] {
  const out: string[] = [];
  for (const c of comments) {
    if (c.creator) out.push(c.creator);
    if (c.replies.length > 0) out.push(...collectCreators(c.replies));
  }
  return out;
}

export function useComments(bucketCanisterId: string, postId: string) {
  const { getPostComments, getUsersByPrincipals } = useActors();

  return useQuery<CommentsData>({
    queryKey: ["comments", bucketCanisterId, postId],
    enabled: postId !== "" && bucketCanisterId !== "",
    staleTime: 60 * 1000, // fresh-ish — comments mutate more often than the
    // article body (which sits at 5 min). Refetched on every successful
    // saveComment / upvote / removeVote so the staleTime is only a guard.
    queryFn: async () => {
      const result = await getPostComments(bucketCanisterId, postId);
      if (result.__kind__ === "err") throw new Error(result.err);

      const principals = Array.from(
        new Set(collectCreators(result.ok.comments)),
      );

      const users = principals.length
        ? await getUsersByPrincipals(principals).catch((e) => {
            console.warn("[useComments] user hydration failed:", e);
            return [] as UserListItem[];
          })
        : ([] as UserListItem[]);

      const userMap = new Map(users.map((u) => [u.principal, u]));

      return {
        comments: result.ok.comments,
        totalNumberOfComments: result.ok.totalNumberOfComments,
        userMap,
      };
    },
  });
}
