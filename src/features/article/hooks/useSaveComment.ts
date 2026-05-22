import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type {
  CommentsReturnType,
  SaveCommentModel,
} from "../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../candid/User/User";
import type { CommentsData } from "./useComments";

// Mutation: post a comment or reply.
//
// Cache contract (decision #34 — invalidate-only, NOT optimistic):
// Comment posting is server-confirmed because the canister assigns the
// `commentId`. An optimistic insert would either race with the server's
// id assignment, or fabricate a fake id that mismatches when the
// authoritative response arrives. Instead we let the canister be the
// source of truth and update the cache from its return value
// (`saveComment` returns the full updated `CommentsReturnType` — no
// separate refetch needed).
//
// New commenter handles need User-record hydration so avatars/displayNames
// render — but we don't have those records inside the mutation. We do two
// things: setQueryData with the new comments + the OLD userMap (keeps the
// list rendering at handle-fallback for new commenters) AND invalidate so
// useComments re-runs its full two-stage hydration in the background.
// First repaint is instant; missing avatars resolve a tick later.

export type SaveCommentArgs = {
  bucketCanisterId: string;
  postId: string;
  content: string;
  replyToCommentId?: string;
  commentId?: string; // edit mode — not used by PR #8 UI; the wrapper supports it
};

export function useSaveComment() {
  const { saveComment } = useActors();
  const queryClient = useQueryClient();

  return useMutation<CommentsReturnType, Error, SaveCommentArgs>({
    mutationFn: async ({
      bucketCanisterId,
      postId,
      content,
      replyToCommentId,
      commentId,
    }) => {
      const model: SaveCommentModel = {
        content,
        postId,
        commentId,
        replyToCommentId,
      };
      const result = await saveComment(bucketCanisterId, model);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (updatedThread, { bucketCanisterId, postId }) => {
      const key = ["comments", bucketCanisterId, postId];
      // Push the server-truth thread into the cache so the list updates
      // instantly. Carry the previous userMap forward — handles without
      // a User record render at fallback until the invalidate-refetch
      // completes the hydration.
      const previous = queryClient.getQueryData<CommentsData>(key);
      queryClient.setQueryData<CommentsData>(key, {
        ...updatedThread,
        userMap: previous?.userMap ?? new Map<string, UserListItem>(),
      });
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
