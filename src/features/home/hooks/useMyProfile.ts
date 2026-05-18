import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { User } from "../../../candid/User/User";

// Fetches the authed user's User-canister profile by principal.
//
// Implementation note: uses User.getUserByPrincipalId (a query method) on
// the anonymous agent. Works without Phase 4's authed-agent refactor because
// query methods accept any principal_text and don't care about caller auth.
//
// Disabled when no principal — caller (WelcomeBanner) is logged-in-only by
// virtue of being mounted from HomeLoggedIn, but React Query needs the
// `enabled` flag for the first paint where principal is still null.

export function useMyProfile() {
  const { principal } = useAuth();
  const { getUserByPrincipalId } = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<User | null>({
    queryKey: ["my-profile", principalText],
    enabled: principalText !== null,
    staleTime: 5 * 60 * 1000, // 5 min — profile rarely changes within a session
    queryFn: async () => {
      if (!principalText) return null;
      const result = await getUserByPrincipalId(principalText);
      // "Not registered" comes back as { err }. For WelcomeBanner that's a
      // valid empty state (the user has authed but never completed their
      // Nuance profile) — return null and let the consumer fall back to a
      // generic greeting. Other err values (network, canister error) bubble
      // as a thrown error so React Query enters its `isError` state.
      if ("err" in result) {
        if (result.err.toLowerCase().includes("not found") || result.err.toLowerCase().includes("does not exist")) {
          return null;
        }
        throw new Error(result.err);
      }
      return result.ok;
    },
  });
}
