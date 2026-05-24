import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";

// The authed caller's published posts for the My Articles "Published" tab.
// See useMyAllPosts for the keying/enablement rationale.
export function useMyPublishedPosts(from = 0, to = 20) {
  const { getMyPublishedPosts } = useActors();
  const { isAuthenticated, principal } = useAuth();
  return useQuery({
    queryKey: ["my-posts", "published", principal?.toText() ?? "anon", from, to],
    enabled: isAuthenticated,
    queryFn: () => getMyPublishedPosts(from, to),
  });
}
