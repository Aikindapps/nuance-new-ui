import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";

// Views / claps / tags for an article. PostBucketType (from getPost) carries
// none of these — they live on PostKeyProperties in PostCore. Fetched as a
// separate query from useArticle so the article body never blocks on it.
//
// Resolves to null when PostCore returns an `err` (no key properties for this
// post) — the page still renders, just without the meta bar / tags. A genuine
// transport failure rejects and surfaces as `isError`.
export function usePostMeta(postId: string) {
  const { getPostKeyProperties } = useActors();

  return useQuery<PostKeyProperties | null>({
    queryKey: ["post-meta", postId],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const result = await getPostKeyProperties(postId);
      if ("err" in result) return null;
      return result.ok;
    },
  });
}
