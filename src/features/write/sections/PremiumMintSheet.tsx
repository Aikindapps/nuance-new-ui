import { useId } from "react";
import Button from "@mui/material/Button";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import { premiumMintSheetCopy as sc } from "./premiumMintSheetCopy";
import {
  MIN_PRICE_E8S,
  parseIcpAmount,
  sanitizeKeys,
  sanitizePrice,
} from "../lib/premiumMintFields";

// Phone-only bottom sheet for the limited-edition NFT mint setup
// form (Figma 2483:3290 / 2484:6252 / 2485:6252). Rendered by
// PremiumMintView below the 1024px seam, inside the modal service's
// Dialog -- it owns no queries, no mint state, no scrim/FocusTrap/
// Escape/close-X of its own. The only exits are Back and a
// successful mint (handled by the parent).

const c = writeArticleCopy.premium;

// Local spinner -- the desktop Spinner in PremiumMintView.tsx is not
// exported, and importing across the two sibling files would create a
// cycle, so this is a small standalone equivalent.
function SheetSpinner() {
  return (
    <div className="relative mx-auto my-6 size-16">
      <svg
        className="absolute inset-0 size-16"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="rgba(55,58,73,0.10)"
          strokeWidth="6"
        />
      </svg>
      <svg
        className="absolute inset-0 size-16 animate-spin"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
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

type PremiumMintSheetProps = {
  titleId: string;
  processing: boolean;
  imageLoading: boolean;
  svg: string | null;
  keys: string;
  price: string;
  onKeysChange: (next: string) => void;
  onPriceChange: (next: string) => void;
  termsAccepted: boolean;
  onTermsChange: (next: boolean) => void;
  minKeys: number | null;
  editorCount: number | null;
  editorCountError: boolean;
  ckbtcEquiv: number | null;
  nuaEquiv: number | null;
  isValid: boolean;
  onMint: () => void;
  onCancel: () => void;
};

export function PremiumMintSheet({
  titleId,
  processing,
  imageLoading,
  svg,
  keys,
  price,
  onKeysChange,
  onPriceChange,
  termsAccepted,
  onTermsChange,
  minKeys,
  editorCount,
  editorCountError,
  ckbtcEquiv,
  nuaEquiv,
  isValid,
  onMint,
  onCancel,
}: PremiumMintSheetProps) {
  const keysInputId = useId();
  const priceInputId = useId();

  if (processing) {
    return (
      <div
        className={
          "fixed inset-x-0 bottom-0 flex max-h-[85vh] flex-col " +
          "rounded-t-[calc(16*var(--fpx))] bg-white"
        }
      >
        <div
          aria-hidden
          className={
            "mx-auto mt-[calc(12*var(--fpx))] " +
            "h-[calc(4*var(--fpx))] w-[calc(36*var(--fpx))] " +
            "rounded-[calc(2*var(--fpx))] bg-ink-border/20"
          }
        />
        <div
          className={
            "flex-1 overflow-y-auto px-[calc(24*var(--fpx))] " +
            "flex flex-col gap-4 pt-[calc(24*var(--fpx))] " +
            "pb-[calc(24*var(--fpx))]"
          }
        >
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {c.processingTitle}
          </h2>
          <p className="text-body text-ink">{c.processingBody}</p>
          <SheetSpinner />
        </div>
        <div
          className={
            "flex items-center justify-between " +
            "px-[calc(24*var(--fpx))] pb-[calc(24*var(--fpx))]"
          }
        >
          <Button
            variant="outlined"
            disabled
            sx={{ ...secondaryButtonSx, opacity: 0.4 }}
          >
            {sc.back}
          </Button>
        </div>
      </div>
    );
  }

  const priceError =
    price === ""
      ? null
      : parseIcpAmount(price) <= 0
        ? sc.priceMustBePositive
        : Math.round(parseIcpAmount(price) * 1e8) < MIN_PRICE_E8S
          ? sc.priceBelowMinimum
          : null;

  const keysError =
    keys === "" || minKeys == null
      ? null
      : parseInt(keys, 10) < minKeys
        ? sc.keysBelowMinimum.replace("{min}", String(minKeys))
        : null;

  const inputBase =
    "h-[calc(48*var(--fpx))] w-[calc(140*var(--fpx))] " +
    "rounded-[calc(6*var(--fpx))] bg-ink-border-5 " +
    "px-[calc(16*var(--fpx))] text-body text-ink outline-none";
  const inputOk = " border border-ink-border-10";
  const inputErr = " border-2 border-brand-purple";

  return (
    <div
      className={
        "fixed inset-x-0 bottom-0 flex max-h-[85vh] flex-col " +
        "rounded-t-[calc(16*var(--fpx))] bg-white"
      }
    >
      <div
        aria-hidden
        className={
          "mx-auto mt-[calc(12*var(--fpx))] " +
          "h-[calc(4*var(--fpx))] w-[calc(36*var(--fpx))] " +
          "rounded-[calc(2*var(--fpx))] bg-ink-border/20"
        }
      />
      <div
        className={
          "flex-1 overflow-y-auto px-[calc(24*var(--fpx))] " +
          "flex flex-col gap-[calc(32*var(--fpx))] " +
          "pt-[calc(24*var(--fpx))] pb-[calc(24*var(--fpx))]"
        }
      >
        {/* Heading */}
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {sc.heading}
          </h2>
          <p className="text-label font-medium text-ink-80">
            {sc.subHeading}
          </p>
        </div>

        <div className="h-px bg-ink-border/10" />

        {/* Thumbnail preview -- not in frame, kept intentionally */}
        <div className="flex justify-center">
          {imageLoading ? (
            <SheetSpinner />
          ) : svg ? (
            <img
              src={"data:image/svg+xml," + encodeURIComponent(svg)}
              alt="Premium NFT preview"
              className="max-h-64 max-w-full rounded"
            />
          ) : null}
        </div>

        {/* Number of keys */}
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              className="text-label font-bold text-ink"
              htmlFor={keysInputId}
            >
              {sc.keysLabel}
            </label>
            <p className="text-label font-medium text-ink-80">
              {sc.keysInfo}
            </p>
          </div>
          <div className="flex items-center gap-[calc(8*var(--fpx))]">
            <input
              id={keysInputId}
              type="text"
              inputMode="numeric"
              value={keys}
              placeholder={sc.keysPlaceholder}
              aria-invalid={keysError != null}
              onChange={(e) =>
                onKeysChange(sanitizeKeys(e.target.value))
              }
              className={inputBase + (keysError ? inputErr : inputOk)}
            />
            <span className="text-body font-medium text-ink-60">
              {sc.keysUnit}
            </span>
          </div>
          {keysError && (
            <p
              role="alert"
              className="text-label font-medium text-brand-purple"
            >
              {keysError}
            </p>
          )}
          {minKeys != null && (
            <p className="text-label font-medium text-ink-80">
              {c.keysMinHint
                .replace("{count}", String(editorCount))
                .replace("{min}", String(minKeys))}
            </p>
          )}
          {editorCountError && (
            <p className="text-label text-error">{c.keysCountError}</p>
          )}
        </div>

        <div className="h-px bg-ink-border/10" />

        {/* Price per key */}
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              className="text-label font-bold text-ink"
              htmlFor={priceInputId}
            >
              {sc.priceLabel}
            </label>
            <p className="text-label font-medium text-ink-80">
              {sc.priceInfo}
            </p>
          </div>
          <div className="flex items-center gap-[calc(8*var(--fpx))]">
            <input
              id={priceInputId}
              type="text"
              inputMode="decimal"
              value={price}
              placeholder={sc.pricePlaceholder}
              aria-invalid={priceError != null}
              onChange={(e) => {
                const v = sanitizePrice(e.target.value);
                if (v !== null) onPriceChange(v);
              }}
              className={inputBase + (priceError ? inputErr : inputOk)}
            />
            <span className="text-body font-medium text-ink-60">
              {sc.priceUnit}
            </span>
          </div>
          {priceError ? (
            <p
              role="alert"
              className="text-label font-medium text-brand-purple"
            >
              {priceError}
            </p>
          ) : (
            <p className="text-label text-ink-60">
              {sc.conversionPrefix}{" "}
              {ckbtcEquiv != null
                ? ckbtcEquiv.toFixed(6)
                : sc.conversionPlaceholder}{" "}
              {sc.ckbtcUnit} = {" "}
              {nuaEquiv != null
                ? nuaEquiv.toFixed(2)
                : sc.conversionPlaceholder}{" "}
              {sc.nuaUnit}
            </p>
          )}
        </div>

        {/* Terms checkbox -- not in the frame, kept intentionally */}
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-brand-purple)]"
          />
          <span className="text-label text-ink">{c.terms}</span>
        </label>
      </div>

      <div
        className={
          "flex items-center justify-between " +
          "px-[calc(24*var(--fpx))] pb-[calc(24*var(--fpx))]"
        }
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={secondaryButtonSx}
        >
          {sc.back}
        </Button>
        <Button
          variant="contained"
          disabled={!isValid}
          onClick={onMint}
          sx={primaryButtonSx}
        >
          {sc.publish}
        </Button>
      </div>
    </div>
  );
}
