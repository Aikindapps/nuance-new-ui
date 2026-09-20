// NIC-378 §6.6 — Publication CTA read hook (reader-facing, anon-safe).
// Mirrors usePublicationSettings — resolves handle → canisterId via
// getPublicationCanisters(), fetches via anon getPublicationQuery(), unwraps
// the CTA + primaryColor from the Publication record.
// Degrades to no-bar on error — does NOT throw the page down.

import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { PublicationCta } from "../../../candid/Publisher/declarations/Publisher.did";

export type PublicationCtaData = {
  cta: PublicationCta | null;
  primaryColor: string;
  isLoading: boolean;
  isError: boolean;
};

export function usePublicationCta(handle: string): PublicationCtaData {
  const actors = useActors();
  const enabled = handle !== "";

  const query = useQuery<{ cta: PublicationCta; primaryColor: string }>({
    queryKey: ["publication-cta", handle],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const cans = await actors.getPublicationCanisters();
      const match = cans.find(
        ([h]) => h.toLowerCase() === handle.toLowerCase(),
      );
      if (!match) throw new Error(`No canister for "${handle}"`);
      const [, canisterId] = match;
      const res = await actors.getPublicationQuery(canisterId, handle);
      if (res.__kind__ === "err") throw new Error(res.err);
      return {
        cta: res.ok.cta,
        primaryColor: res.ok.styling.primaryColor,
      };
    },
  });

  return {
    cta: query.data?.cta ?? null,
    primaryColor: query.data?.primaryColor ?? "",
    isLoading: enabled ? query.isLoading : false,
    isError: enabled ? query.isError : false,
  };
}
