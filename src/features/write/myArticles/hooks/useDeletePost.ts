import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import type { MyArticle } from "./useMyArticles";
import type { MyArticleCounts } from "./useMyArticleCounts";

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
      let wasDraft: boolean | undefined;
      qc.setQueriesData<MyArticle[]>({ queryKey: ["my-articles"] }, (old) => {
        if (!old) return old;
        const found = old.find((a) => a.id === postId);
        if (found) wasDraft = found.isDraft;
        return old.filter((a) => a.id !== postId);
      });
      // Mirror the optimistic list update on the tab counts so the All /
      // Published / Drafts numbers drop immediately (same read-after-write
      // reasoning — decrement rather than refetch).
      qc.setQueriesData<MyArticleCounts>(
        { queryKey: ["my-article-counts"] },
        (old) =>
          old
            ? {
                all: Math.max(0, old.all - 1),
                published:
                  wasDraft === false
                    ? Math.max(0, old.published - 1)
                    : old.published,
                drafts:
                  wasDraft === true ? Math.max(0, old.drafts - 1) : old.drafts,
              }
            : old,
      );
    },
  });
}
