import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";

function toCount(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export type PublicationPostCounts = {
  totalViews: number;
  totalClaps: number;
  uniqueReaders: number;
  published: number;
};

export function usePublicationPostCounts(handle: string) {
  const { getUserPostCounts } = useActors();
  const query = useQuery<PublicationPostCounts>({
    queryKey: ["publication-post-counts", handle],
    enabled: handle !== "",
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const c = await getUserPostCounts(handle);
      return {
        totalViews: toCount(c.totalViewCount),
        totalClaps: toCount(c.uniqueClaps),
        uniqueReaders: toCount(c.uniqueReaderCount),
        published: toCount(c.publishedCount),
      };
    },
  });
  return {
    counts: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
