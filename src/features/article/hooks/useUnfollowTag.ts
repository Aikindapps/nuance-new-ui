import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { PostTagModel__1 } from "../../../candid/PostCore/PostCore";

type Tag = { tagId: string; tagName: string };
type Context = { previous: PostTagModel__1[] | undefined; principalText: string | null };

export function useUnfollowTag() {
  const { unfollowTag } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Tag, Context>({
    mutationFn: async (tag) => {
      const result = await unfollowTag(tag.tagId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: async (tag) => {
      const principalText = principal?.toText() ?? null;
      if (!principalText) return { previous: undefined, principalText: null };
      const key = ["my-tags", principalText];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PostTagModel__1[]>(key);
      if (previous) {
        queryClient.setQueryData<PostTagModel__1[]>(
          key,
          previous.filter((t) => t.tagId !== tag.tagId),
        );
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
