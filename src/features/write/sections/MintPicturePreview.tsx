import { useState } from "react";
import { premiumMintSheetCopy as sc } from "./premiumMintSheetCopy";

// Shared "Picture to be minted" preview -- the picture that is (or will be)
// sent to the mint as `thumbnail`. Two call sites:
//   - PremiumMintSheet.tsx (mint setup, phone) -- src is the data-URL built
//     from the SVG about to be minted, or null while it's loading.
//   - KeysAndSalesSheet.tsx (already-minted, phone) -- src is the picture
//     the NFT canister actually minted, fetched over HTTP, or null while
//     the canister lookup is loading.
// Figma 2659:6101 (label + tile on their own), also part of 2483:3290 /
// 2484:6252 / 2485:6252 / 2555:6058 / 2555:6135.
//
// The tile keeps its 120x84 size in every state (loading / failed / loaded)
// so nothing around it shifts. A failed load falls back to the neutral
// placeholder fill instead of a broken image icon -- tracked without an
// effect (repo lint forbids setState in an effect body): a new src is
// retried automatically because it no longer equals the last failed one.
export function MintPicturePreview({ src }: { src: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src != null && src !== failedSrc;

  return (
    <div className="flex flex-col gap-[calc(8*var(--fpx))]">
      <p className="text-label font-bold text-ink">{sc.pictureLabel}</p>
      <div
        className={
          "h-[calc(84*var(--fpx))] w-[calc(120*var(--fpx))] shrink-0 " +
          "overflow-hidden rounded-[calc(8*var(--fpx))] bg-ink-border-5"
        }
      >
        {showImage && (
          <img
            src={src}
            alt={sc.pictureAlt}
            onError={() => setFailedSrc(src)}
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
