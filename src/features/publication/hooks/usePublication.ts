import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { UserListItem } from "../../../candid/User/User";

// Publication identity + article count (NIC-42).
//
// getUserListItemByHandle(h) returns a UserListItem for both writers and
// publications (the pub flag is canister-internal; the JS shape is the same).
// getUserPostCounts(h).publishedCount gives the published article count.
//
// Result discrimination mirrors useWriterProfile / useArticle:
//   __kind__==="err" → not-found (return null, don't throw).
//   rejected call → isError.

export type PublicationData = {
  item: UserListItem;
  // publishedCount from getUserPostCounts (candid nat-as-text string).
  publishedCount: string;
};

export function usePublication(handle: string) {
  const { getUserListItemByHandle, getUserPostCounts } = useActors();

  return useQuery<PublicationData | null>({
    queryKey: ["publication", handle],
    enabled: handle !== "",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await getUserListItemByHandle(handle);
      if (res.__kind__ === "err") return null;
      const item = res.ok;

      // Fetch article count in parallel — fail gracefully if unavailable.
      let publishedCount = "0";
      try {
        const counts = await getUserPostCounts(handle);
        publishedCount = counts.publishedCount;
      } catch {
        // Silently degrade — spec omits articles count when unavailable.
      }

      return { item, publishedCount };
    },
  });
}
