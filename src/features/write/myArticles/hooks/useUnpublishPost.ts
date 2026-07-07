// Unpublish = re-save the full post via PostCore.save with isDraft:true.
// This is the correct author-facing path: PostCore.save authorises a personal
// edit by the caller's principal and, when isDraft:true, removes the post from
// the published/popularity indices (a complete unpublish).
//
// The old implementation called PostBucket.updatePostDraft, which is
// publication-only (errors "It's not a publication post." for personal posts)
// and is canister-internal — not intended to be called from the browser.
//
// Tag IDs live on PostKeyProperties (PostCore), not on the PostBucketType__1
// returned by getPost, so both are fetched in parallel — same pattern as
// useEditArticle.ts.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import type { PostSaveModel } from "../../../../candid/PostCore/PostCore";

export function useUnpublishPost() {
  const { getPost, getPostKeyProperties, savePost } = useActors();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bucketCanisterId,
      postId,
    }: {
      bucketCanisterId: string;
      postId: string;
    }) => {
      const [postRes, metaRes] = await Promise.all([
        getPost(bucketCanisterId, postId),
        getPostKeyProperties(postId),
      ]);
      if (postRes.__kind__ === "err") throw new Error(postRes.err);
      const post = postRes.ok;

      const tagIds =
        metaRes.__kind__ === "ok"
          ? metaRes.ok.tags.map((t) => t.tagId)
          : [];

      const isPub = post.isPublication;
      const model: PostSaveModel = {
        postId: post.postId,
        title: post.title,
        subtitle: post.subtitle,
        content: post.content,
        headerImage: post.headerImage,
        isDraft: true,
        tagIds,
        category: isPub ? post.category : "",
        handle: isPub ? post.handle : "",
        creatorHandle: isPub ? post.creatorHandle : "",
        isPublication: isPub,
        isMembersOnly: post.isMembersOnly,
      };
      const res = await savePost(model);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-articles"] });
    },
  });
}
