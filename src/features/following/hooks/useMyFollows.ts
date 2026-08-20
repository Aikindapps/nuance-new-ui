import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import { useMyProfile } from "../../../lib/useMyProfile";
import type { UserListItem } from "../../../candid/User/User";

// NIC-173 — hydrates + partitions the authed user's followed handles into
// Writers and Publications, mirroring the deriveDiscovery.ts pattern.
//
// Steps:
// 1. Read followersArray from the cached "my-profile" (handles the user follows).
// 2. Call getUsersByHandles with lowercased handles (the User canister reverse-
//    index is lowercase — passing mixed case silently returns nothing; same note
//    as deriveDiscovery.ts L89-90).
// 3. Call getPublicationCanisters to get the set of publication handles.
// 4. Partition hydrated UserListItems into writers vs publications by checking
//    whether their handle (lowercased) appears in the publication set.
// 5. Preserve the original followersArray order within each group.

export type MyFollowsResult = {
  writers: UserListItem[];
  publications: UserListItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useMyFollows(): MyFollowsResult {
  const { isAuthenticated, principal } = useAuth();
  const { getUsersByHandles, getPublicationCanisters } = useActors();
  const profile = useMyProfile();

  const principalText = principal?.toText() ?? null;
  const followersArray: string[] = profile.data?.followersArray ?? [];

  // Stable query key: sorted handles + principal so that unfollow (which
  // mutates the profile cache) automatically re-keys and re-fetches here.
  const sortedSig = [...followersArray].sort().join(",");
  const enabled =
    isAuthenticated &&
    principalText !== null &&
    !profile.isLoading &&
    profile.data != null;

  const query = useQuery<{ writers: UserListItem[]; publications: UserListItem[] }>({
    queryKey: ["my-follows", principalText, sortedSig],
    enabled,
    staleTime: 2 * 60 * 1000, // 2 min
    queryFn: async () => {
      if (followersArray.length === 0) {
        return { writers: [], publications: [] };
      }

      const lcHandles = followersArray.map((h) => h.toLowerCase());

      const [users, pubCanisters] = await Promise.all([
        getUsersByHandles(lcHandles).catch(() => [] as UserListItem[]),
        getPublicationCanisters().catch(() => [] as Array<[string, string]>),
      ]);

      // Build a set of lowercase publication handles.
      const pubHandleSet = new Set(pubCanisters.map(([h]) => h.toLowerCase()));

      // Index hydrated users by lowercased handle for O(1) lookup.
      const byHandle = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

      // Walk the original followersArray order to preserve it within each group.
      const writers: UserListItem[] = [];
      const publications: UserListItem[] = [];
      for (const h of lcHandles) {
        const user = byHandle.get(h);
        if (!user) continue;
        if (pubHandleSet.has(h)) {
          publications.push(user);
        } else {
          writers.push(user);
        }
      }

      return { writers, publications };
    },
  });

  return {
    writers: query.data?.writers ?? [],
    publications: query.data?.publications ?? [],
    isLoading: profile.isLoading || query.isLoading,
    isError: query.isError,
    refetch: () => { void query.refetch(); },
  };
}
