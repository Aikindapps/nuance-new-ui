import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";
import { useAuth } from "../../../../contexts/useAuth";

// The authed caller's draft posts for the My Articles "Drafts" tab. See
// useMyAllPosts for the keying/enablement rationale.
export function useMyDraftPosts(from = 0, to = 20) {
  const { getMyDraftPosts } = useActors();
  const { isAuthenticated, principal } = useAuth();
  return useQuery({
    queryKey: ["my-posts", "draft", principal?.toText() ?? "anon", from, to],
    enabled: isAuthenticated,
    queryFn: () => getMyDraftPosts(from, to),
  });
}
