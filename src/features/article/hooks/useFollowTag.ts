import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { PostTagModel__1 } from "../../../candid/PostCore/PostCore";

// insertAt (optional, NIC-473): where the optimistic entry goes in the cached
// ["my-tags"] list. The Activity Topics view passes the pill's old index so
// Undo puts it back in place (the back end also restores the original
// position on a re-follow). Omitted = append, which every other caller uses.
type Tag = { tagId: string; tagName: string; insertAt?: number };
type Context = { previous: PostTagModel__1[] | undefined; principalText: string | null };

export function useFollowTag() {
  const { followTag } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Tag, Context>({
    mutationFn: async (tag) => {
      const result = await followTag(tag.tagId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: async (tag) => {
      const principalText = principal?.toText() ?? null;
      if (!principalText) return { previous: undefined, principalText: null };
      const key = ["my-tags", principalText];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PostTagModel__1[]>(key);
      if (previous && !previous.some((t) => t.tagId === tag.tagId)) {
        const entry: PostTagModel__1 = { tagId: tag.tagId, tagName: tag.tagName };
        const next = [...previous];
        const at =
          tag.insertAt === undefined
            ? next.length
            : Math.min(Math.max(tag.insertAt, 0), next.length);
        next.splice(at, 0, entry);
        queryClient.setQueryData<PostTagModel__1[]>(key, next);
      }
      return { previous, principalText };
    },
    onError: (_err, _tag, context) => {
      if (!context?.principalText || context.previous === undefined) return;
      queryClient.setQueryData(["my-tags", context.principalText], context.previous);
    },
    onSuccess: (_data, _tag, context) => {
      if (!context?.principalText) return;
      queryClient.invalidateQueries({ queryKey: ["my-tags", context.principalText] });
    },
  });
}
