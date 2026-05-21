import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { User } from "../../../candid/User/User";

// Mutation: follow an author or publication by handle.
//
// Cache contract (decision #34):
// - Optimistic update on ["my-profile", principal] — appends the handle to
//   `followersArray` so `useIsFollowing(handle)` flips to "following"
//   instantly. The button flips, the user sees the result before the
//   network round-trip completes.
// - On error: roll back ["my-profile"] to its snapshot. Toast fires from
//   the consumer (FollowButton) via `mutation.error`.
// - On success: overwrite ["my-profile"] with the server-truth User
//   record (the canister returns the updated caller's User) so we drop the
//   optimistic guess for the authoritative value.
// - On settled: invalidate the entire ["article"] family so the target
//   author's `followersCount` (held in the article query's cached
//   `UserListItem`) refetches and the visible "N followers" text updates.
//
// The "article" invalidation is broad on purpose: PR #8's FollowButton
// is generic — it doesn't know which article query it's on. A consumer
// may be viewing exactly one article at a time, so the cost is one refetch
// per follow action.

type Context = {
  previous: User | null;
  principalText: string | null;
};

export function useFollowAuthor() {
  const { followAuthor } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<User, Error, string, Context>({
    mutationFn: async (handle: string) => {
      const result = await followAuthor(handle);
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
        // `User` is class-merged (bindgen) but the cache stores plain data;
        // the spread loses prototype methods we never call. Cast as User to
        // satisfy TS without resurrecting them.
        queryClient.setQueryData<User>(key, {
          ...previous,
          followersArray: [...previous.followersArray, handle],
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
      // Replace optimistic guess with server truth.
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
