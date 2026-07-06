import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";

// Moves a published post back to draft (PostBucket.updatePostDraft, isDraft:true)
// and refreshes the My-Articles lists.
export function useUnpublishPost() {
  const { updatePostDraft } = useActors();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bucketCanisterId,
      postId,
    }: {
      bucketCanisterId: string;
      postId: string;
    }) => {
      const res = await updatePostDraft(bucketCanisterId, postId, true);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-articles"] });
    },
  });
}
