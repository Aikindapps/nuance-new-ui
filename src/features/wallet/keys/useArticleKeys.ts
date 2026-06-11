import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { principalToAccountIdentifier } from "../../../lib/accountIdentifier";
import { buildArticleUrl } from "../../../lib/articleUrl";

export type ArticleKey = {
  postId: string;
  nftCanisterId: string;
  tokenIndex: number;
  /** Display number — tokenIndex + 1 (prod's accessKeyIndex). */
  keyNumber: number;
  /** Total keys issued for the article, when the supply read succeeds. */
  totalSupply: number | null;
  /** Case-preserved author handle, when post hydration succeeds. */
  handle: string | null;
  title: string | null;
  /** Route path for the article, when hydration succeeds. */
  url: string | null;
};

// The caller's premium-article NFT keys (Figma 1:46454; prod parity:
// getOwnedNfts in store/postStore.ts). ext_v2 has no cross-canister owner
// index, so this sweeps every NFT canister in PostCore's registry with
// tokens_ext(accountId) — exactly what production does. Canisters where the
// account owns nothing return an err (treated as "none here"); a canister
// that fails entirely is skipped rather than failing the whole list.
export function useArticleKeys() {
  const {
    getAllNftCanisters,
    getOwnedExtTokens,
    getExtSupply,
    getPostKeyProperties,
    getPostsByPostIds,
  } = useActors();
  const { principal, isAuthenticated } = useAuth();
  const principalText = principal?.toText() ?? null;

  return useQuery<ArticleKey[]>({
    queryKey: ["article-keys", principalText],
    enabled: isAuthenticated && !!principalText,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!principalText) return [];
      const accountId = principalToAccountIdentifier(principalText);
      const pairs = await getAllNftCanisters();

      // Sweep all NFT canisters for tokens owned by this account.
      const hits = (
        await Promise.all(
          pairs.map(async ([postId, nftCanisterId]) => {
            try {
              const res = await getOwnedExtTokens(nftCanisterId, accountId);
              if (res.__kind__ !== "ok" || res.ok.length === 0) return null;
              return {
                postId,
                nftCanisterId,
                tokenIndexes: res.ok.map(([index]) => index),
              };
            } catch {
              return null;
            }
          }),
        )
      ).filter((h): h is NonNullable<typeof h> => h != null);

      // Per owned article: supply counter + post key properties (for handle
      // + bucket canister id). Both degrade to null without dropping the key.
      const enriched = await Promise.all(
        hits.map(async (hit) => {
          const [supply, keyProps] = await Promise.all([
            getExtSupply(hit.nftCanisterId).catch(() => null),
            getPostKeyProperties(hit.postId)
              .then((r) => (r.__kind__ === "ok" ? r.ok : null))
              .catch(() => null),
          ]);
          return { ...hit, supply, keyProps };
        }),
      );

      // Hydrate titles bucket-by-bucket (PostKeyProperties carries no title).
      const byBucket = new Map<string, string[]>();
      for (const e of enriched) {
        if (!e.keyProps) continue;
        const bucket = e.keyProps.bucketCanisterId;
        byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), e.postId]);
      }
      const titleByPostId = new Map<string, string>();
      await Promise.all(
        [...byBucket.entries()].map(async ([bucket, postIds]) => {
          try {
            const posts = await getPostsByPostIds(bucket, postIds, false);
            posts.forEach((p) => titleByPostId.set(p.postId, p.title));
          } catch {
            /* titles degrade to null */
          }
        }),
      );

      return enriched.flatMap((e) =>
        e.tokenIndexes.map((tokenIndex) => {
          const title = titleByPostId.get(e.postId) ?? null;
          const handle = e.keyProps?.handle ?? null;
          const url =
            title && handle && e.keyProps
              ? buildArticleUrl({
                  handle,
                  postId: e.postId,
                  bucketCanisterId: e.keyProps.bucketCanisterId,
                  title,
                })
              : null;
          return {
            postId: e.postId,
            nftCanisterId: e.nftCanisterId,
            tokenIndex,
            keyNumber: tokenIndex + 1,
            totalSupply: e.supply ? Number(e.supply.currentSupply) : null,
            handle,
            title,
            url,
          };
        }),
      );
    },
  });
}
