import { useMutation } from "@tanstack/react-query";
import { useActors } from "../../contexts/useActors";

// Follows the selected topic tags for the authed caller — TopicsModal's
// "Done" action. PostCore.followTags returns a Result_1 variant; the err
// case is rethrown so React Query surfaces it and the modal can offer a
// retry-or-skip (topics are optional — decision #30).
//
// No cache invalidation: the Following feed is not mounted during
// onboarding, so it fetches the new follows fresh on first visit.

export function useFollowTags() {
  const { followTags } = useActors();

  return useMutation({
    mutationFn: async (tagIds: string[]) => {
      const result = await followTags(tagIds);
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
    },
  });
}
