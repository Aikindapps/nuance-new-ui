import { useQuery } from "@tanstack/react-query";
import type { UserListItem } from "../../../candid/User/User";
import { useActors } from "../../../contexts/useActors";

// NIC-291 — Replaces the popular/latest post-sampling source (useExploreDiscovery /
// deriveDiscovery) with the authoritative full publication registry.
//
// Steps:
// 1. Call getPublicationCanisters() — returns every [handle, canisterId] pair.
// 2. Dedupe + lowercase handles (the User canister reverse-index is lowercase;
//    passing mixed case silently returns nothing).
// 3. Hydrate via getUsersByHandles, filter out unresolved entries, then sort
//    most-followed first. UserListItem.followersCount is a STRING.

export type AllPublicationsResult = {
  publications: UserListItem[];
  isLoading: boolean;
  isError: boolean;
};

export function useAllPublications(): AllPublicationsResult {
  const { getPublicationCanisters, getUsersByHandles } = useActors();

  const query = useQuery<UserListItem[]>({
    queryKey: ["all-publications"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const pubCanisters = await getPublicationCanisters().catch(
        () => [] as Array<[string, string]>,
      );

      const lcHandles = Array.from(
        new Set(pubCanisters.map(([h]) => h.toLowerCase())),
      );

      if (lcHandles.length === 0) {
        return [];
      }

      const users = await getUsersByHandles(lcHandles).catch(
        () => [] as UserListItem[],
      );

      // Index by lowercased handle for O(1) lookup.
      const byHandle = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

      // Map back in the same deduplicated order, filter out any that didn't
      // hydrate (suspended / deleted publications), then sort most-followed first.
      return lcHandles
        .map((h) => byHandle.get(h))
        .filter((u): u is UserListItem => u !== undefined)
        .sort(
          (a, b) =>
            (Number(b.followersCount) || 0) - (Number(a.followersCount) || 0),
        );
    },
  });

  return {
    publications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
