import { useQuery } from "@tanstack/react-query";
import type { UserListItem } from "../../../candid/User/User";
import { useActors } from "../../../contexts/useActors";

// NIC-60 Search Phase 2: client-side handle matching for writers + publications.
//
// Steps:
// 1. getAllHandles() — returns every handle on the platform (writers + pubs).
// 2. Filter to those whose lowercased handle includes the query string.
// 3. Sort: startsWith matches first, then the rest; alphabetical within each group.
// 4. Cap to the first 40 matches.
// 5. Hydrate via getUsersByHandles + getPublicationCanisters (same pattern as useMyFollows).
// 6. Partition into writers vs publications by the pub canister set.

const HANDLE_CAP = 40;

export function useSearchUsers(q: string) {
  const { getAllHandles, getUsersByHandles, getPublicationCanisters } = useActors();

  const query = useQuery<{ writers: UserListItem[]; publications: UserListItem[] }>({
    queryKey: ["search-users", q.trim().toLowerCase()],
    enabled: q.trim() !== "",
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const lcq = q.trim().toLowerCase();

      const handles = await getAllHandles().catch(() => [] as string[]);

      const matched = handles.filter((h) => h.toLowerCase().includes(lcq));

      // Relevance sort: startsWith first, then the rest; alphabetical within each group.
      matched.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lcq);
        const bStarts = b.toLowerCase().startsWith(lcq);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      const capped = matched.slice(0, HANDLE_CAP);
      const lcMatched = capped.map((h) => h.toLowerCase());

      const [users, pubCanisters] = await Promise.all([
        getUsersByHandles(lcMatched).catch(() => [] as UserListItem[]),
        getPublicationCanisters().catch(() => [] as Array<[string, string]>),
      ]);

      // Build a set of lowercase publication handles.
      const pubHandleSet = new Set(pubCanisters.map(([h]) => h.toLowerCase()));

      // Index hydrated users by lowercased handle for O(1) lookup.
      const byHandle = new Map(users.map((u) => [u.handle.toLowerCase(), u]));

      // Walk the capped order to preserve relevance order within each group.
      const writers: UserListItem[] = [];
      const publications: UserListItem[] = [];
      for (const h of lcMatched) {
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
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
