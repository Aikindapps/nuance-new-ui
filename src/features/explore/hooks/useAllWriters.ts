import { useQuery } from "@tanstack/react-query";
import type { UserListItem } from "../../../candid/User/User";
import { useActors } from "../../../contexts/useActors";

// NIC-292 — Replaces the useExploreDiscovery / deriveDiscovery post-sampling
// source for /explore/writers with the authoritative full handle registry.
//
// Steps:
// 1. In parallel, call getAllHandles() (every handle: writers + publications)
//    and getPublicationCanisters() ([handle, canisterId] for every publication).
// 2. Build a Set of publication handles so they can be partitioned out.
//    (Same lowercase trick used in useSearchUsers.ts / useMyFollows.ts —
//    the User canister reverse-index is lowercase; mixed case silently returns
//    nothing.)
// 3. Dedupe + lowercase all handles, then filter OUT publication handles.
// 4. Hydrate via getUsersByHandles in BATCHES of 200 with bounded concurrency
//    of 6 at a time. The writer set can be thousands of handles; a single call
//    risks exceeding the IC query response-size limit.
// 5. Index hydrated users by lowercased handle, map back in order, filter out
//    unresolved entries (suspended / deleted), then sort most-followed first.
//    UserListItem.followersCount is a STRING.

export type AllWritersResult = {
  writers: UserListItem[];
  isLoading: boolean;
  isError: boolean;
};

export function useAllWriters(): AllWritersResult {
  const { getAllHandles, getPublicationCanisters, getUsersByHandles } =
    useActors();

  const query = useQuery<UserListItem[]>({
    queryKey: ["all-writers"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // 1. Fetch all handles and all publication handles in parallel.
      //    Any rejection here propagates and puts the query into isError.
      const [handles, pubCanisters] = await Promise.all([
        getAllHandles(),
        getPublicationCanisters(),
      ]);

      // 2. Build a set of publication handles (lowercase).
      const pubHandleSet = new Set(pubCanisters.map(([h]) => h.toLowerCase()));

      // 3. Dedupe + lowercase all handles, then partition out publications.
      const writerHandles = Array.from(
        new Set(handles.map((h) => h.toLowerCase())),
      ).filter((h) => !pubHandleSet.has(h));

      if (writerHandles.length === 0) {
        return [];
      }

      // 4. Hydrate in batches of 200 with bounded concurrency of 6.
      //    Any failed batch rejects the whole queryFn → isError.
      const BATCH_SIZE = 200;
      const CONCURRENCY = 6;

      const batches: string[][] = [];
      for (let i = 0; i < writerHandles.length; i += BATCH_SIZE) {
        batches.push(writerHandles.slice(i, i + BATCH_SIZE));
      }

      const hydrated: UserListItem[] = [];
      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const window = batches.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          window.map((batch) => getUsersByHandles(batch)),
        );
        for (const chunk of results) {
          hydrated.push(...chunk);
        }
      }

      // 5. Index by lowercased handle for O(1) lookup.
      const byHandle = new Map(
        hydrated.map((u) => [u.handle.toLowerCase(), u]),
      );

      // 6. Map back in deduplicated order, filter out unresolved, sort
      //    most-followed first. followersCount is a STRING.
      return writerHandles
        .map((h) => byHandle.get(h))
        .filter((u): u is UserListItem => u !== undefined)
        .sort(
          (a, b) =>
            (Number(b.followersCount) || 0) - (Number(a.followersCount) || 0),
        );
    },
  });

  return {
    writers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
