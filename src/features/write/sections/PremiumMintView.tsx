import { useEffect, useState } from "react";
import { useIsMobileViewport } from "../../../lib/useIsMobileViewport";
import { PremiumMintSheet } from "./PremiumMintSheet";
import { PremiumMintStep } from "./PremiumMintStep";
import { buildSvgForPremiumArticle, loadHeaderImage } from "../lib/premiumThumbnail";
import { useIcpUsdRate, icpToUsd } from "../hooks/useIcpUsdRate";
import { usePublicationEditorCount } from "../hooks/usePublicationEditorCount";

// Limited-edition NFT mint setup -- the controller. Owns the picture, the
// field state, the editor-count and ICP->USD queries, validation and the
// mint call, and renders the phone bottom sheet (PremiumMintSheet, opened
// by WriteArticleForm through the modal service) or the desktop step
// (PremiumMintStep, rendered by PublishView in place of its own content).
export const PREMIUM_MINT_VIEW_TITLE_ID = "premium-mint-view-title";

type PremiumMintViewProps = {
  post: { title: string; subtitle: string; coverUrl: string };
  handle: string;
  tagIds: string[];
  publicationHandle: string;
  onMint: (premium: {
    thumbnail: string;
    icpPrice: bigint;
    maxSupply: bigint;
  }) => Promise<boolean>;
  onCancel: () => void;
};

// Validate all mint conditions.
function validateNft(
  resizedHeaderImage: string,
  termsAccepted: boolean,
  keys: string,
  price: string,
  minKeys: number,
): boolean {
  if (!resizedHeaderImage) return false;
  if (!termsAccepted) return false;
  const keysInt = parseInt(keys, 10);
  if (!Number.isInteger(keysInt) || keysInt < minKeys || keysInt > 10000) return false;
  if (!/^\d*\.?\d{0,4}$/.test(price) || price === "" || price === ".") return false;
  const e8s = Math.round(parseFloat(price) * 1e8);
  if (e8s < 100000 || e8s > 10_000_000_000) return false;
  return true;
}

export function PremiumMintView({
  post,
  handle,
  publicationHandle,
  onMint,
  onCancel,
}: PremiumMintViewProps) {
  const isMobile = useIsMobileViewport();

  const [resizedHeaderImage, setResizedHeaderImage] = useState("");
  // Initialize to true only if there is actually a URL to fetch.
  const [imageLoading, setImageLoading] = useState(!!post.coverUrl);
  const [keys, setKeys] = useState("");
  const [price, setPrice] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load + resize header image on mount. All setState calls are in callbacks,
  // not in the synchronous effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!post.coverUrl) return;
    loadHeaderImage(post.coverUrl)
      .then((dataUrl) => {
        setResizedHeaderImage(dataUrl);
      })
      .catch(() => {
        // On error, fall back to the original URL so the SVG still renders.
        setResizedHeaderImage(post.coverUrl);
      })
      .finally(() => {
        setImageLoading(false);
      });
  }, [post.coverUrl]);

  // USD equivalent (D-142): one cached ICP -> USD quote for this screen,
  // read here once and passed down so desktop and phone show the same value.
  const usdPerIcp = useIcpUsdRate();
  const icpAmount = price && /^\d*\.?\d{0,4}$/.test(price) ? parseFloat(price) : 0;
  const usdEquiv = icpToUsd(usdPerIcp, icpAmount);

  // Editor-aware minimum (NIC-225): backend requires maxSupply > numberOfEditors
  // + 1, and editors are each auto-given a key, so the floor is editorCount + 2.
  const { editorCount, isError: editorCountError } =
    usePublicationEditorCount(publicationHandle);
  const minKeys = editorCount != null ? editorCount + 2 : null;

  const isValid =
    minKeys != null &&
    validateNft(resizedHeaderImage, termsAccepted, keys, price, minKeys);

  // Build SVG only when the image is loaded.
  const svg =
    resizedHeaderImage
      ? buildSvgForPremiumArticle(
          { title: post.title, subtitle: post.subtitle, headerImage: resizedHeaderImage },
          handle,
        )
      : null;

  const handleMint = async () => {
    if (!isValid || processing || !svg) return;
    setProcessing(true);
    const icpPrice = BigInt(Math.round(parseFloat(price) * 1e8));
    const maxSupply = BigInt(parseInt(keys, 10));
    const thumbnail = svg;
    const ok = await onMint({ thumbnail, icpPrice, maxSupply });
    if (!ok) {
      // Return to config state on failure; parent has already toasted the error.
      setProcessing(false);
    }
    // On success the parent closes the modal — no state update needed.
  };

  if (isMobile) {
    return (
      <PremiumMintSheet
        titleId={PREMIUM_MINT_VIEW_TITLE_ID}
        processing={processing}
        imageLoading={imageLoading}
        svg={svg}
        keys={keys}
        price={price}
        onKeysChange={setKeys}
        onPriceChange={setPrice}
        termsAccepted={termsAccepted}
        onTermsChange={setTermsAccepted}
        minKeys={minKeys}
        editorCount={editorCount}
        editorCountError={editorCountError}
        usdEquiv={usdEquiv}
        isValid={isValid}
        onMint={() => void handleMint()}
        onCancel={onCancel}
      />
    );
  }

  return (
    <PremiumMintStep
      titleId={PREMIUM_MINT_VIEW_TITLE_ID}
      processing={processing}
      imageLoading={imageLoading}
      svg={svg}
      keys={keys}
      price={price}
      onKeysChange={setKeys}
      onPriceChange={setPrice}
      termsAccepted={termsAccepted}
      onTermsChange={setTermsAccepted}
      minKeys={minKeys}
      editorCount={editorCount}
      editorCountError={editorCountError}
      usdEquiv={usdEquiv}
      isValid={isValid}
      onMint={() => void handleMint()}
      onCancel={onCancel}
    />
  );
}
