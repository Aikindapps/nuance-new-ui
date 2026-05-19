import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/useAuth";
import { useActors } from "../contexts/useActors";
import type { User } from "../candid/User/User";

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
      // This is a query against our own, always-valid, authed principal.
      // A network or replica failure rejects the call before a Result is
      // ever produced (React Query then enters `isError`) — so an `err`
      // variant here can only mean one thing: this principal has no Nuance
      // profile yet. Treat every `err` as the unregistered empty state
      // rather than string-matching the canister's "User not found" wording,
      // which is not a stable contract. Consumers rely on this: WelcomeBanner
      // falls back to a generic greeting, and OnboardingGate opens the
      // RegisterModal (PR #6 review m1).
      if ("err" in result) {
        return null;
      }
      return result.ok;
    },
  });
}
