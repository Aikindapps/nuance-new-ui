import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { CommentsData } from "./useComments";
import { updateCommentInTree } from "./likeCommentTree";

// Mutation: clear the caller's vote on a comment, in either direction.
//
// `removeCommentVote` on the canister filters the caller's principal out of
// BOTH `upVotes` and `downVotes` (PostBucket.main.mo:3018-3041). The
// optimistic update mirrors that symmetry: filter from both arrays.
// Replaces the PR #8 like-only `useUnlikeComment` which only touched upVotes
// — fine when there was no Dislike UI, no longer accurate now (review m5).

type Vars = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
};

type Ctx = {
  previous: CommentsData | undefined;
};

export function useUnvoteComment() {
  const { removeCommentVote } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ bucketCanisterId, commentId }) => {
      const result = await removeCommentVote(bucketCanisterId, commentId);
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
            upVotes: c.upVotes.filter((p) => p !== principalText),
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
