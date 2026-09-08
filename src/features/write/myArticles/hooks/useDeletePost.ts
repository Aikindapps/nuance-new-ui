import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import type { MyArticle } from "./useMyArticles";

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
    onSuccess: (_data, { postId }) => {
      // Optimistically remove the deleted post from every cached My-Articles
      // list (All / Published / Drafts) instead of immediately refetching.
      // An immediate invalidateQueries refetch races PostCore's per-user index,
      // which can still return the just-deleted post due to read-after-write lag
      // between the bucket canister and the index. The next natural refetch
      // (on remount, staleTime=0) reconciles with the backend once the index
      // has caught up.
      qc.setQueriesData<MyArticle[]>(
        { queryKey: ["my-articles"] },
        (old) => (old ? old.filter((a) => a.id !== postId) : old),
      );
    },
  });
}
