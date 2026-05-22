import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { CommentsData } from "./useComments";
import { updateCommentInTree } from "./likeCommentTree";

// Mutation: upvote (like) a comment.
//
// Canister behaviour (PostBucket.main.mo:2954-2982): a single upvoteComment
// call atomically (a) adds the caller's principal to `upVotes` and (b)
// removes the caller's principal from `downVotes`. Per-caller mutual
// exclusion — the caller is in at most one of the two arrays at a time,
// but other users' votes coexist.
//
// Cache contract (decision #34, expanded for PR #8 review m5):
// - onMutate snapshots ["comments", bucketId, postId] and optimistically
//   mirrors the canister: add caller to upVotes (idempotent), filter caller
//   out of downVotes. So a click on Like while currently downvoted moves
//   counts by +1 / −1 in one flip.
// - onError rolls back to the snapshot.
// - onSuccess overwrites the cache with the server-truth thread (the
//   canister returns the full updated CommentsReturnType + we carry the
//   previous userMap forward).
// - onSettled invalidates the key so any stale state reconciles. Cheap
//   for the comment-thread sizes PR #8 handles.

type Vars = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
};

type Ctx = {
  previous: CommentsData | undefined;
};

export function useLikeComment() {
  const { upvoteComment } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ bucketCanisterId, commentId }) => {
      const result = await upvoteComment(bucketCanisterId, commentId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async ({ bucketCanisterId, postId, commentId }) => {
      const principalText = principal?.toText();
      const key = ["comments", bucketCanisterId, postId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentsData>(key);
      if (previous && principalText) {
        queryClient.setQueryData<CommentsData>(key, {
          ...previous,
          comments: updateCommentInTree(previous.comments, commentId, (c) => ({
            ...c,
            upVotes: c.upVotes.includes(principalText)
              ? c.upVotes
              : [...c.upVotes, principalText],
            downVotes: c.downVotes.filter((p) => p !== principalText),
          })),
        });
      }
      return { previous };
    },
    onError: (_err, { bucketCanisterId, postId }, ctx) => {
      if (!ctx?.previous) return;
      queryClient.setQueryData(
        ["comments", bucketCanisterId, postId],
        ctx.previous,
      );
    },
    onSettled: (_data, _err, { bucketCanisterId, postId }) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", bucketCanisterId, postId],
      });
    },
  });
}
