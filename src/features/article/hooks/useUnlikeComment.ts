import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { CommentsData } from "./useComments";
import { updateCommentInTree } from "./likeCommentTree";

// Mutation: unlike (remove vote) a comment.
//
// Mirror of useLikeComment — same cache contract, inverse optimistic
// update (filters the caller's principal text out of the comment's
// `upVotes`). The canister method `removeCommentVote` clears any
// up-or-down vote the caller has on this comment; Figma shows like-only
// UI so in practice this always undoes a like.

type Vars = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
};

type Ctx = {
  previous: CommentsData | undefined;
};

export function useUnlikeComment() {
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
