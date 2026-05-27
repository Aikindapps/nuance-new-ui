import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";

// Deletes a post (PostBucket.delete_) and refreshes the My-Articles lists.
// Authors can't delete premium posts — the canister returns an err, surfaced
// to the caller to toast.
export function useDeletePost() {
  const { deletePost } = useActors();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bucketCanisterId,
      postId,
    }: {
      bucketCanisterId: string;
      postId: string;
    }) => {
      const res = await deletePost(bucketCanisterId, postId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-articles"] });
    },
  });
}
