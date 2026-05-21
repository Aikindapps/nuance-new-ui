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
// 2. User.getUsersByHandles for every commenter + every reply handle —
//    lowercased per project lesson 2026-04-22 (the User canister's
//    reverse index keys on lowercase).
//
// Returns `userMap` keyed by lowercase handle for downstream CommentBlock
// rendering. A failed hydration call doesn't fail the whole query —
// comments still render with whatever User records came back; missing
// commenters fall back to handle-only display.

export type CommentsData = CommentsReturnType & {
  userMap: Map<string, UserListItem>;
};

function collectHandles(comments: ReadonlyArray<Comment>): string[] {
  const out: string[] = [];
  for (const c of comments) {
    if (c.handle) out.push(c.handle);
    if (c.replies.length > 0) out.push(...collectHandles(c.replies));
  }
  return out;
}

export function useComments(bucketCanisterId: string, postId: string) {
  const { getPostComments, getUsersByHandles } = useActors();

  return useQuery<CommentsData>({
    queryKey: ["comments", bucketCanisterId, postId],
    enabled: postId !== "" && bucketCanisterId !== "",
    staleTime: 60 * 1000, // fresh-ish — comments mutate more often than the
    // article body (which sits at 5 min). Refetched on every successful
    // saveComment / upvote / removeVote so the staleTime is only a guard.
    queryFn: async () => {
      const result = await getPostComments(bucketCanisterId, postId);
      if ("err" in result) throw new Error(result.err);

      const handles = Array.from(
        new Set(collectHandles(result.ok.comments).map((h) => h.toLowerCase())),
      );

      const users = handles.length
        ? await getUsersByHandles(handles).catch((e) => {
            console.warn("[useComments] user hydration failed:", e);
            return [] as UserListItem[];
          })
        : ([] as UserListItem[]);

      const userMap = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

      return {
        comments: result.ok.comments,
        totalNumberOfComments: result.ok.totalNumberOfComments,
        userMap,
      };
    },
  });
}
