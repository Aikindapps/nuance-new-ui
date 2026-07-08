import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { deriveDiscovery } from "../../home/lib/deriveDiscovery";

export function useExploreDiscovery() {
  const actors = useActors();
  return useQuery({
    queryKey: ["explore-discovery"],
    queryFn: () =>
      deriveDiscovery(actors, {
        samplePopular: 80,
        sampleLatest: 80,
        topWriters: 48,
        topPublications: 24,
        topTopics: 0,
      }),
    staleTime: 1000 * 60 * 5,
  });
}
