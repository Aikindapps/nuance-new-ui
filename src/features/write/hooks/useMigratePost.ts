import { useMutation } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { Post } from "../../../candid/PostBucket/PostBucket";

// Moves an existing personal draft into a publication via
// PostBucket.migratePostToPublication. That method records the creator
// unconditionally (unlike a plain save-as-update on a publication post),
// which is what fixes the empty-byline bug for personal-draft → publication
// flows (decision #36 addendum). The bucketCanisterId comes from the Post
// returned by the preceding personal save.
export function useMigratePost() {
  const { migratePostToPublication } = useActors();
  return useMutation({
    mutationFn: async (args: {
      bucketCanisterId: string;
      postId: string;
      publicationHandle: string;
      isDraft: boolean;
    }): Promise<Post> => {
      const res = await migratePostToPublication(
        args.bucketCanisterId,
        args.postId,
        args.publicationHandle,
        args.isDraft,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
  });
}
