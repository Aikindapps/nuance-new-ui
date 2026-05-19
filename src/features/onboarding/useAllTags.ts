import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../contexts/useActors";

// Every tag on the platform — drives the TopicsModal picker. Tags change
// rarely, so a long staleTime keeps this off the network on revisit.

export function useAllTags() {
  const { getAllTags } = useActors();

  return useQuery({
    queryKey: ["all-tags"],
    staleTime: 30 * 60 * 1000, // 30 min
    queryFn: () => getAllTags(),
  });
}
