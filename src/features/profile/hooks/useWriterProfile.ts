import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { UserListItem } from "../../../candid/User/User";

// Writer profile identity + followingCount (NIC-42).
//
// Two-stage fetch:
//   1. getUserListItemByHandle(handle) → UserListItem (followers, avatar, bio…)
//   2. getUserByPrincipalId(item.principal).ok.followersArray.length → followingCount
//      (project lesson 2026-05-12: followersArray IS the forward following list)
//
// Result discrimination (bindgen): Result_7 carries both __kind__:"ok"|"err"
// AND ok/err fields — mirror useArticle.ts. err = not-found: return null, do
// NOT throw. A rejected call = isError (network/canister failure).

export type WriterProfileData = {
  item: UserListItem;
  // How many accounts this writer follows. null when the second call fails —
  // same graceful omission as the article AuthorBlock (per F3 spec).
  followingCount: number | null;
};

export function useWriterProfile(handle: string) {
  const { getUserListItemByHandle, getUserByPrincipalId } = useActors();

  return useQuery<WriterProfileData | null>({
    queryKey: ["writer-profile", handle],
    enabled: handle !== "",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Handle is already normalized (stripped @ + lowercased) by the route.
      const res = await getUserListItemByHandle(handle);
      if (res.__kind__ === "err") return null;
      const item = res.ok;

      // Fetch the full User to get followingCount (followersArray.length).
      // Failure is non-fatal — omit the "following" segment rather than
      // failing the whole page (per F3).
      let followingCount: number | null = null;
      try {
        const profileRes = await getUserByPrincipalId(item.principal);
        if (profileRes.__kind__ === "ok") {
          followingCount = profileRes.ok.followersArray.length;
        }
      } catch {
        // Silently degrade — per F3.
      }

      return { item, followingCount };
    },
  });
}
