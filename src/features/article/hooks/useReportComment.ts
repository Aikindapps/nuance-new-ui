import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { CommentsData } from "./useComments";
import { updateCommentInTree } from "./likeCommentTree";

// Mutation: report a comment for moderation review.
//
// `reportComment` on PostBucket returns `Result_2 = { ok: text } | { err: text }`
// — `ok` is a confirmation string, `err` happens (e.g.) when the same caller
// has already reported the same comment. The canister sets `comment.isCensored`
// for already-flagged content; the optimistic update mirrors that so the UI
// can short-circuit a second click.
//
// No cross-removal, no array reshape — just a flag flip. We do optimistic
// censor + rollback on error, then invalidate the thread on settle so any
// thread-wide state (e.g. moderator-driven content hide) reconciles with
// the canister.

type Vars = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
};

type Ctx = {
  previous: CommentsData | undefined;
};

export function useReportComment() {
  const { reportComment } = useActors();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ bucketCanisterId, commentId }) => {
      const result = await reportComment(bucketCanisterId, commentId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async ({ bucketCanisterId, postId, commentId }) => {
      const key = ["comments", bucketCanisterId, postId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommentsData>(key);
      if (previous) {
        queryClient.setQueryData<CommentsData>(key, {
          ...previous,
          comments: updateCommentInTree(previous.comments, commentId, (c) => ({
            ...c,
            isCensored: true,
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
