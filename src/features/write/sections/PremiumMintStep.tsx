import { useEffect, useId, useRef } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import { premiumMintSheetCopy as sc } from "./premiumMintSheetCopy";
import { MintPicturePreview } from "./MintPicturePreview";
import {
  keysErrorMessage,
  priceErrorMessage,
  sanitizeKeys,
  sanitizePrice,
} from "../lib/premiumMintFields";

// Desktop limited-edition NFT mint setup (Figma 2724:3290 default /
// 2726:6320 values / 2727:6384 validation error). Not a pop-up: a step
// inside the desktop PublishView overlay -- PublishView renders this in
// place of its own content, inside the same white full-page surface and
// centred 666 column, and keeps its own state (tags, publication, access)
// so Back returns to it unchanged. Owns no queries and no mint state;
// PremiumMintView (the controller) passes everything in. Same strings as
// the phone sheet (premiumMintSheetCopy).

const c = writeArticleCopy.premium;

function Spinner() {
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

type PremiumMintStepProps = {
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
  usdEquiv: number | null;
  isValid: boolean;
  onMint: () => void;
  onCancel: () => void;
};

export function PremiumMintStep({
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
  usdEquiv,
  isValid,
  onMint,
  onCancel,
}: PremiumMintStepProps) {
  const keysInputId = useId();
  const priceInputId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Entering the step (and switching to / back from minting): move focus
  // to the heading, since the button that was pressed is gone.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [processing]);

  // Escape = Back, except while minting (Back is disabled then too).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [processing, onCancel]);

  const buttonRow = "flex w-full items-center justify-between";

  if (processing) {
    return (
      <>
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <h1
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-bold text-ink outline-none"
          >
            {c.processingTitle}
          </h1>
          <p className="text-body text-ink">{c.processingBody}</p>
        </div>
        <Spinner />
        <div className={buttonRow}>
          <Button
            variant="outlined"
            disabled
            sx={{ ...secondaryButtonSx, opacity: 0.4 }}
          >
            {sc.back}
          </Button>
        </div>
      </>
    );
  }

  const priceError = priceErrorMessage(price);
  const keysError = keysErrorMessage(keys, minKeys);

  const inputBase =
    "h-[calc(48*var(--fpx))] w-[calc(140*var(--fpx))] " +
    "rounded-[calc(6*var(--fpx))] bg-ink-border-5 " +
    "px-[calc(16*var(--fpx))] text-body text-ink-80 outline-none " +
    "placeholder:text-ink-60 " +
    "focus:border-brand-purple focus:bg-brand-purple-5";
  const inputOk = " border border-ink-border-10";
  const inputErr = " border-[1.5px] border-brand-purple";

  return (
    <>
      {/* Heading */}
      <div className="flex flex-col gap-[calc(12*var(--fpx))]">
        <h1
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink-60 outline-none"
        >
          {sc.heading}
        </h1>
        <p className="text-label font-medium text-ink-80">
          {sc.subHeading}
        </p>
      </div>

      <MintPicturePreview
        src={
          !imageLoading && svg
            ? "data:image/svg+xml," + encodeURIComponent(svg)
            : null
        }
      />

      <hr className="w-full border-t border-ink-border/10" />

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
            onChange={(e) => onKeysChange(sanitizeKeys(e.target.value))}
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
          <p
            role="alert"
            className="text-label font-medium text-brand-purple"
          >
            {c.keysCountError}
          </p>
        )}
      </div>

      <hr className="w-full border-t border-ink-border/10" />

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
        <div className="flex flex-col gap-[calc(8*var(--fpx))]">
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
              {usdEquiv != null
                ? usdEquiv.toFixed(2)
                : sc.conversionPlaceholder}{" "}
              {sc.usdUnit}
            </p>
          )}
        </div>
      </div>

      <hr className="w-full border-t border-ink-border/10" />

      {/* Terms checkbox */}
      <label
        className={
          "flex min-h-[calc(44*var(--fpx))] cursor-pointer " +
          "items-center gap-[calc(8*var(--fpx))]"
        }
      >
        <Checkbox
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          sx={{
            p: 0,
            color: "var(--color-ink-40)",
            "&.Mui-checked": { color: "var(--color-brand-purple)" },
            "& .MuiSvgIcon-root": { fontSize: 16 },
          }}
        />
        <span className="text-body leading-[calc(18*var(--fpx))] text-ink">
          {sc.termsLabel}
        </span>
      </label>

      <hr className="w-full border-t border-ink-border/10" />

      <div className={buttonRow}>
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
    </>
  );
}
