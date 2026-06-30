import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { loadDraft } from "../../../services/autosave/store";
import { htmlToEditorStateJson } from "../lib/htmlToEditorState";

export type EditArticleInitial = {
  postId: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  tagIds: string[];
  editorStateJson: string;
  // Canister truth (`!post.isDraft`): editing a published article saves in place
  // ("Save changes", isDraft:false) instead of unpublishing it. A newer local
  // autosave only overrides the body/fields — never the published state.
  isPublished: boolean;
  // Publication home — always taken from the canister post (autosave doesn't
  // carry publication info). Preserves the post's home on re-save so a
  // publication article is never silently re-homed to personal (latent-bug fix).
  isPublication: boolean;
  publicationHandle: string;
  creatorHandle: string;
};

// Loads an existing article into editor-ready shape for /write/:postIdAndBucket.
// Body HTML -> Lexical editorState JSON; tags from PostKeyProperties. Prefers a
// newer LOCAL autosave for this postId (unsaved edits from a prior session)
// over the canister copy. Returns null when not found / unauthorized.
export function useEditArticle(bucketCanisterId: string, postId: string) {
  const { getPost, getPostKeyProperties } = useActors();
  return useQuery<EditArticleInitial | null>({
    queryKey: ["edit-article", bucketCanisterId, postId],
    enabled: postId !== "" && bucketCanisterId !== "",
    staleTime: 0,
    queryFn: async () => {
      const [postRes, metaRes] = await Promise.all([
        getPost(bucketCanisterId, postId),
        getPostKeyProperties(postId),
      ]);
      if (postRes.__kind__ === "err") return null;
      const post = postRes.ok;
      const isPublished = !post.isDraft;
      const tagIds =
        metaRes.__kind__ === "ok"
          ? metaRes.ok.tags.map((t) => t.tagId)
          : [];

      // Prefer a newer local autosave (unsaved edits) over the canister copy.
      // The autosave only carries body/fields — published state stays canister
      // truth so a restored draft of a live article still "Saves changes".
      // Publication fields always come from the canister post — autosave doesn't
      // carry publication info, so these are read once from the canister truth.
      const isPublication = post.isPublication;
      const publicationHandle = post.isPublication ? post.handle : "";
      const creatorHandle = post.creatorHandle;

      const local = loadDraft(post.postId);
      const canisterModified = Number(post.modified) || 0;
      if (local && local.savedAt > canisterModified) {
        return {
          postId: post.postId,
          title: local.title,
          subtitle: local.subtitle,
          coverUrl: local.coverUrl,
          tagIds: local.tagIds.length > 0 ? local.tagIds : tagIds,
          editorStateJson: local.editorStateJson,
          isPublished,
          isPublication,
          publicationHandle,
          creatorHandle,
        };
      }
      return {
        postId: post.postId,
        title: post.title,
        subtitle: post.subtitle,
        coverUrl: post.headerImage,
        tagIds,
        editorStateJson: htmlToEditorStateJson(post.content),
        isPublished,
        isPublication,
        publicationHandle,
        creatorHandle,
      };
    },
  });
}
