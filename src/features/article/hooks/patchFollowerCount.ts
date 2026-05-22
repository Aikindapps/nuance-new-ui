import type { QueryClient } from "@tanstack/react-query";
import type { ArticleData } from "./useArticle";

// Direct in-cache patch of `author.followersCount` / `publication.followersCount`
// for every cached `["article", ...]` query whose author or publication handle
// matches `handle`. Used by useFollowAuthor / useUnfollowAuthor in onSuccess —
// replaces the broader invalidate-the-whole-["article"]-family approach that
// triggered an unnecessary refetch per follow click (PR #8 review m3).
//
// followersCount is a string on UserListItem (candid emits nat as text). Parse,
// clamp at 0, stringify back.
export function patchArticleFollowerCount(
  queryClient: QueryClient,
  handle: string,
  delta: number,
): void {
  const target = handle.toLowerCase();
  queryClient.setQueriesData<ArticleData | null>(
    { queryKey: ["article"] },
    (old) => {
      if (!old) return old;
      const authorHit =
        old.author && old.author.handle.toLowerCase() === target;
      const pubHit =
        old.publication && old.publication.handle.toLowerCase() === target;
      if (!authorHit && !pubHit) return old;
      return {
        ...old,
        author: authorHit
          ? { ...old.author!, followersCount: bump(old.author!.followersCount, delta) }
          : old.author,
        publication: pubHit
          ? {
              ...old.publication!,
              followersCount: bump(old.publication!.followersCount, delta),
            }
          : old.publication,
      };
    },
  );
}

function bump(current: string, delta: number): string {
  const n = parseInt(current, 10);
  if (!Number.isFinite(n)) return current;
  return String(Math.max(0, n + delta));
}
