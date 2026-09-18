import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { UserListItem } from "../../../candid/User/User";

// NIC-359 / NIC-372 — the caller's followers (people who follow the current
// user). Wraps the `getMyFollowers` facade, which unwraps the User canister's
// `Result_8` to a plain `UserListItem[]` (or throws on the err variant).
export function useMyFollowers() {
  const { principal, isAuthenticated } = useAuth();
  const { getMyFollowers } = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<UserListItem[]>({
    queryKey: ["my-followers", principalText],
    enabled: principalText !== null && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 min — follower list changes slowly
    queryFn: () => getMyFollowers(),
  });
}
