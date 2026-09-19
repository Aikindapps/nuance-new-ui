// NIC-381 §6.4 — Publication settings read hook.
//
// Resolves handle → canisterId via getPublicationCanisters(), then fetches the
// full Publication record via getPublicationQuery(). Modelled on
// usePublicationMembership — same query conventions (staleTime, enabled guard,
// error/loading surface).

import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { Publication } from "../../../candid/Publisher/declarations/Publisher.did";

export type PublicationSettingsData = {
  publication: Publication;
  canisterId: string;
};

export function usePublicationSettings(handle: string) {
  const actors = useActors();

  const enabled = handle !== "";

  const query = useQuery<PublicationSettingsData>({
    queryKey: ["publication-settings", handle],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const cans = await actors.getPublicationCanisters();
      const match = cans.find(
        ([h]) => h.toLowerCase() === handle.toLowerCase(),
      );
      if (!match) {
        throw new Error(`No canister found for publication "${handle}"`);
      }
      const [, canisterId] = match;
      const res = await actors.getPublicationQuery(canisterId, handle);
      if (res.__kind__ === "err") {
        throw new Error(res.err);
      }
      return { publication: res.ok, canisterId };
    },
  });

  const publication = query.data?.publication ?? null;
  const canisterId = query.data?.canisterId ?? null;
  const isLoading = enabled ? query.isLoading : false;
  const isError = enabled ? query.isError : false;

  return { publication, canisterId, isLoading, isError, refetch: query.refetch };
}
