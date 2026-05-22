import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { CommentsData } from "./useComments";
import { updateCommentInTree } from "./likeCommentTree";

// Mutation: downvote (dislike) a comment.
//
// Mirror of useLikeComment — the canister's `downvoteComment` adds the
// caller to `downVotes` and removes them from `upVotes` in one call
// (PostBucket.main.mo:2986-3015). Same per-caller mutual exclusion.
//
// Cache contract follows useLikeComment exactly with the arrays swapped:
// optimistic add to downVotes (idempotent) + filter caller from upVotes.

type Vars = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
};

type Ctx = {
  previous: CommentsData | undefined;
};

export function useDownvoteComment() {
  const { downvoteComment } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ bucketCanisterId, commentId }) => {
      const result = await downvoteComment(bucketCanisterId, commentId);
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
            downVotes: c.downVotes.includes(principalText)
              ? c.downVotes
              : [...c.downVotes, principalText],
            upVotes: c.upVotes.filter((p) => p !== principalText),
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
