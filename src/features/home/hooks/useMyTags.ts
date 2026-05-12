import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { PostTagModel__1 } from "../../../candid/PostCore/PostCore";

// Fetches the list of tags the authed user follows. Used by the Following
// tab to determine the empty state — "no writers AND no topics" — and by
// useFollowing to decide whether to call getMyFollowingTagsPostKeyProperties.
//
// getMyTags() uses msg.caller — the authed HttpAgent (Phase 4 ActorsContext)
// is required. Disabled when the user is anonymous.

export function useMyTags() {
  const { principal, isAuthenticated } = useAuth();
  const { getMyTags } = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<Array<PostTagModel__1>>({
    queryKey: ["my-tags", principalText],
    enabled: isAuthenticated && principalText !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: getMyTags,
  });
}
