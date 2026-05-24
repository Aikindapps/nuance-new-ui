import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";

// The authed caller's posts (drafts + published) for the My Articles "All"
// tab. Half-open (from, to) range like every PostCore list method. Returns
// PostKeyProperties[]; bodies/titles hydrate separately (Chunk 8, via
// getPostsByPostIds with includeDraft:true so drafts aren't dropped).
//
// Keyed on the principal so a logout/login swaps caches cleanly. Disabled
// when logged out — getMyAllPosts uses msg.caller and is meaningless anon.
export function useMyAllPosts(from = 0, to = 20) {
  const { getMyAllPosts } = useActors();
  const { isAuthenticated, principal } = useAuth();
  return useQuery({
    queryKey: ["my-posts", "all", principal?.toText() ?? "anon", from, to],
    enabled: isAuthenticated,
    queryFn: () => getMyAllPosts(from, to),
  });
}
