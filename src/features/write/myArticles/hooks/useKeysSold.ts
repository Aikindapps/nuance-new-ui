import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../../contexts/useActors";

export type KeysSold = {
  /** Actual sales count -- transactions.length. NOT currentSupply. */
  sold: number;
  /** Edition size the author configured -- maxSupply. */
  total: number;
  /** Price per key, in e8s -- icpPrice from the same supply read. */
  priceE8s: bigint;
};

// Read-only "keys sold" figure for the Keys & sales panel (NIC-467).
//
// THE FIELD THIS REPO GETS WRONG ELSEWHERE (do not "fix" to match them --
// this was settled by probing 8 live production NFT canisters, see the
// card notes):
//   currentSupply  = keys MINTED so far (initialSupply + sales + 1 spare),
//                    NOT the sold count and NOT the edition size.
//   maxSupply      = the edition size the author configured. This is M.
//   transactions   = the actual sales. transactions.length is N, the sold
//                    count -- this is the only correct source for it.
// NftPurchaseModal.tsx and useArticleKeys.ts were fixed in NIC-480 and
// now read maxSupply / the sold count correctly, same as here.
//
// nftCanisterId isn't on the Article type (too much blast radius to add it
// there for one screen), so this resolves postId -> nftCanisterId via
// getAllNftCanisters(), the same precedent useArticleKeys.ts /
// useWalletHistory.ts use.
export function useKeysSold(postId: string | null) {
  const { getAllNftCanisters, getExtSupply } = useActors();

  return useQuery<KeysSold>({
    queryKey: ["keys-sold", postId ?? "none"],
    // Only fetch once the panel is actually open -- a postId is passed in.
    // Otherwise the My Articles list would sweep every NFT canister on load.
    enabled: postId != null,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!postId) throw new Error("no postId");
      const pairs = await getAllNftCanisters();
      const match = pairs.find(([id]) => id === postId);
      if (!match) throw new Error("no NFT canister for this article");
      const [, nftCanisterId] = match;
      const supply = await getExtSupply(nftCanisterId);
      return {
        sold: supply.transactions.length,
        total: Number(supply.maxSupply),
        priceE8s: supply.icpPrice,
      };
    },
  });
}
