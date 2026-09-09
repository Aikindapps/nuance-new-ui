import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useToast } from "../../../services/toast";
import { manageArticlesKey, type ManageArticlePage } from "./useManageArticles";
import { manageArticlesCopy } from "../../../constants/copy";

// Cached data shape for the manage-articles infinite query.
type CachedData = InfiniteData<ManageArticlePage>;

type Vars = {
  handle: string;            // publication handle — the query key + Publisher lookup
  postId: string;
  newIsDraft: boolean;       // the value AFTER the toggle (true = unpublish, false = publish)
};

type Ctx = { previous: CachedData | undefined };

// Publish / unpublish toggle mutation with optimistic update + rollback.
//
// Flipping Live ON = publish; Live OFF = unpublish. Routed through the
// publication's Publisher canister (updatePublicationPostDraft), which checks
// isEditor(caller) and then flips the draft flag AS the publication canister.
// A direct PostBucket.updatePostDraft from the browser is rejected because a
// publication post's author principal is the publication canister, not the
// editor — that was the "Failed to update publish status" bug (NIC-274).
//
// On success: success toast. On error: rollback + error toast.
// On settle: invalidate the manage-articles query so the server state reconciles.
export function usePublishToggle() {
  const { getPublicationCanisters, updatePublicationPostDraft } = useActors();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ handle, postId, newIsDraft }) => {
      // Resolve the publication's Publisher canister id (PostCore keys
      // publications by canister id, not handle). Same lookup as
      // usePublicationEditorCount.
      const cans = await getPublicationCanisters();
      const match = cans.find(
        ([h]) => h.toLowerCase() === handle.toLowerCase(),
      );
      if (!match) throw new Error("Publication not found");
      const result = await updatePublicationPostDraft(
        match[1],
        postId,
        newIsDraft,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },

    onMutate: async ({ handle, postId, newIsDraft }) => {
      const key = manageArticlesKey(handle);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CachedData>(key);
      if (previous) {
        queryClient.setQueryData<CachedData>(key, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            rows: page.rows.map((row) =>
              row.postId === postId ? { ...row, isDraft: newIsDraft } : row,
            ),
          })),
        });
      }
      return { previous };
    },

    onError: (err, { handle }, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(manageArticlesKey(handle), ctx.previous);
      }
      console.error(err);
      toast.show(manageArticlesCopy.toastToggleError, "error");
    },

    onSuccess: (_data, { newIsDraft }) => {
      toast.show(
        newIsDraft ? manageArticlesCopy.toastUnpublished : manageArticlesCopy.toastPublished,
        "success",
      );
    },

    onSettled: (_data, _err, { handle }) => {
      queryClient.invalidateQueries({ queryKey: manageArticlesKey(handle) });
    },
  });
}
