import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useToast } from "../../../services/toast";
import { manageArticlesKey, type ManageArticlePage } from "./useManageArticles";
import { manageArticlesCopy } from "../../../constants/copy";

// Cached data shape for the manage-articles infinite query.
type CachedData = InfiniteData<ManageArticlePage>;

type Vars = {
  handle: string;            // publication handle — needed for the query key
  bucketCanisterId: string;
  postId: string;
  newIsDraft: boolean;       // the value AFTER the toggle (true = unpublish, false = publish)
};

type Ctx = { previous: CachedData | undefined };

// Publish / unpublish toggle mutation with optimistic update + rollback.
//
// Flipping Live ON = publish = updatePostDraft(bucket, postId, false).
// Flipping Live OFF = unpublish = updatePostDraft(bucket, postId, true).
//
// On success: success toast. On error: rollback + error toast.
// On settle: invalidate the manage-articles query so the server state reconciles.
export function usePublishToggle() {
  const { updatePostDraft } = useActors();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<unknown, Error, Vars, Ctx>({
    mutationFn: async ({ bucketCanisterId, postId, newIsDraft }) => {
      const result = await updatePostDraft(bucketCanisterId, postId, newIsDraft);
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
