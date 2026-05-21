import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { User } from "../../../candid/User/User";

// Mutation: unfollow an author or publication by handle.
//
// Mirror of `useFollowAuthor` — same cache contract (decision #34), inverse
// optimistic update (filters the handle out of `followersArray` rather
// than appending). Handle comparison is case-insensitive on the optimistic
// side because the User canister stores via a lowercase reverse index;
// the server-truth response in onSuccess is what we end up with regardless.

type Context = {
  previous: User | null;
  principalText: string | null;
};

export function useUnfollowAuthor() {
  const { unfollowAuthor } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<User, Error, string, Context>({
    mutationFn: async (handle: string) => {
      const result = await unfollowAuthor(handle);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (handle) => {
      const principalText = principal?.toText() ?? null;
      if (!principalText) return { previous: null, principalText: null };

      const key = ["my-profile", principalText];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<User>(key) ?? null;

      if (previous) {
        const target = handle.toLowerCase();
        // Cast as User — see note in useFollowAuthor (bindgen class merge).
        queryClient.setQueryData<User>(key, {
          ...previous,
          followersArray: previous.followersArray.filter(
            (h) => h.toLowerCase() !== target,
          ),
        } as User);
      }

      return { previous, principalText };
    },
    onError: (_err, _handle, context) => {
      if (!context?.principalText || !context.previous) return;
      queryClient.setQueryData(
        ["my-profile", context.principalText],
        context.previous,
      );
    },
    onSuccess: (updatedUser, _handle, context) => {
      if (!context?.principalText) return;
      queryClient.setQueryData(
        ["my-profile", context.principalText],
        updatedUser,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });
}
