import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "../../../components/ui/Popup";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import { buildSvgForPremiumArticle, loadHeaderImage } from "../lib/premiumThumbnail";
import { useNuaPrices, priceBetween } from "../../wallet/hooks/useNuaEquivalent";
import { usePublicationEditorCount } from "../hooks/usePublicationEditorCount";

export const PREMIUM_MINT_VIEW_TITLE_ID = "premium-mint-view-title";

// Spinner — mirrors NftPurchaseModal's inline Spinner component.
function Spinner() {
  return (
    <div className="relative mx-auto my-6 size-16">
      <svg className="absolute inset-0 size-16" viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="32" cy="32" r="29" stroke="rgba(55,58,73,0.10)" strokeWidth="6" />
      </svg>
      <svg className="absolute inset-0 size-16 animate-spin" viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="#5405D4"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="182"
          strokeDashoffset="145"
        />
      </svg>
    </div>
  );
}

// Footer button row, right-aligned with 12px gap.
function FooterRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">{children}</div>
  );
}

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
  const c = writeArticleCopy.premium;

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

  // Price equivalents via Sonic.
  const { data: prices } = useNuaPrices();
  const icpAmount = price && /^\d*\.?\d{0,4}$/.test(price) ? parseFloat(price) : 0;
  const ckbtcEquiv =
    prices && icpAmount > 0 ? priceBetween(prices, "ICP", "ckBTC", icpAmount) : null;
  const nuaEquiv =
    prices && icpAmount > 0 ? priceBetween(prices, "ICP", "NUA", icpAmount) : null;

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

  // Processing state: no close control, inputs disabled.
  if (processing) {
    return (
      <Popup
        titleId={PREMIUM_MINT_VIEW_TITLE_ID}
        title={c.processingTitle}
        onClose={() => undefined}
        closeAriaLabel=""
      >
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-body text-ink">{c.processingBody}</p>
          <Spinner />
        </div>
        <FooterRow>
          <Button
            variant="outlined"
            disabled
            sx={{ ...secondaryButtonSx, opacity: 0.4 }}
          >
            {c.cancel}
          </Button>
        </FooterRow>
      </Popup>
    );
  }

  return (
    <Popup
      titleId={PREMIUM_MINT_VIEW_TITLE_ID}
      title={c.title}
      onClose={onCancel}
      closeAriaLabel={c.cancel}
    >
      <div className="mt-6 flex flex-col gap-6">
        {/* Thumbnail preview */}
        <div className="flex justify-center">
          {imageLoading ? (
            <Spinner />
          ) : svg ? (
            <img
              src={"data:image/svg+xml," + encodeURIComponent(svg)}
              alt="Premium NFT preview"
              className="max-h-64 max-w-full rounded"
            />
          ) : null}
        </div>

        {/* AMOUNT OF KEYS */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <label className="text-label font-bold text-ink" htmlFor="pm-keys">
            {c.keysLabel}
          </label>
          <input
            id="pm-keys"
            type="text"
            inputMode="numeric"
            value={keys}
            placeholder={c.keysPlaceholder}
            disabled={processing}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              // Cap at 10000
              if (v === "" || parseInt(v, 10) <= 10000) {
                setKeys(v);
              } else {
                setKeys("10000");
              }
            }}
            className="h-[calc(48*var(--fpx))] w-full rounded-[calc(6*var(--fpx))] border-2 border-ink-border-10 bg-ink-border-5 px-[calc(16*var(--fpx))] text-body text-ink outline-none focus:border-brand-purple focus:bg-brand-purple-5"
          />
          <p className="text-[length:calc(13*var(--fpx))] text-ink-60">
            {c.keysInfo}
          </p>
          {minKeys != null && (
            <p className="text-[length:calc(13*var(--fpx))] text-ink-60">
              {c.keysMinHint
                .replace("{count}", String(editorCount))
                .replace("{min}", String(minKeys))}
            </p>
          )}
          {editorCountError && (
            <p className="text-label text-error">{c.keysCountError}</p>
          )}
        </div>

        {/* COST PER KEY (IN ICP) */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <label className="text-label font-bold text-ink" htmlFor="pm-price">
            {c.priceLabel}
          </label>
          <input
            id="pm-price"
            type="text"
            inputMode="decimal"
            value={price}
            placeholder={c.pricePlaceholder}
            disabled={processing}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*\.?\d{0,4}$/.test(v)) {
                setPrice(v);
              }
            }}
            className="h-[calc(48*var(--fpx))] w-full rounded-[calc(6*var(--fpx))] border-2 border-ink-border-10 bg-ink-border-5 px-[calc(16*var(--fpx))] text-body text-ink outline-none focus:border-brand-purple focus:bg-brand-purple-5"
          />
          {/* Conversion sub-line */}
          {icpAmount > 0 && (ckbtcEquiv != null || nuaEquiv != null) && (
            <p className="text-[length:calc(13*var(--fpx))] text-ink-60">
              ={" "}
              {ckbtcEquiv != null && (
                <span>{ckbtcEquiv.toFixed(6)} ckBTC</span>
              )}
              {ckbtcEquiv != null && nuaEquiv != null && " = "}
              {nuaEquiv != null && (
                <span>{nuaEquiv.toFixed(2)} NUA</span>
              )}
            </p>
          )}
        </div>

        {/* Terms checkbox */}
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={termsAccepted}
            disabled={processing}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-brand-purple)]"
          />
          <span className="text-label text-ink">{c.terms}</span>
        </label>
      </div>

      <FooterRow>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={processing}
          sx={secondaryButtonSx}
        >
          {c.cancel}
        </Button>
        <Button
          variant="contained"
          disabled={!isValid || processing}
          onClick={() => void handleMint()}
          sx={primaryButtonSx}
        >
          {c.mintButton}
        </Button>
      </FooterRow>
    </Popup>
  );
}
