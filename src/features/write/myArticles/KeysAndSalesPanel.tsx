// KeysAndSalesPanel -- read-only "Keys & sales" panel for the desktop page
// (NIC-512). Desktop twin of the shipped phone bottom sheet
// KeysAndSalesSheet.tsx -- same data (useKeysSold), same strings
// (myArticlesMobileCopy.keysAndSales), same number formatting. Duplicated
// here rather than imported/shared per the task brief; do NOT import from
// or modify KeysAndSalesSheet.tsx.
//
// Figma frames: 2652:6058 (with sales) / 2653:6068 (zero sold) /
// 2655:3278 (loading) / 2658:3818 (overflow).
//
// Terms were fixed at mint time -- there is no editable field anywhere in
// this panel, no checkbox, no Publish button. Price + key quantity are
// shown dimmed with a lock glyph; the point of the screen is the
// "N of M keys sold" line + progress bar.

import { myArticlesMobileCopy } from "./myArticlesMobileCopy";
import { useKeysSold } from "./hooks/useKeysSold";
import { formatSignificant } from "../../../lib/tokenMath";
import { TOKENS } from "../../../config/tokens";
import { useNuaPrices, priceBetween } from "../../wallet/hooks/useNuaEquivalent";
import { MintPicturePreview } from "../sections/MintPicturePreview";

const sc = myArticlesMobileCopy.keysAndSales;

type Props = {
  headingId: string;
  postId: string;
  onDone: () => void;
  extraLoading: boolean;
};

// Thin skeleton bar -- shared shape for the loading treatment.
function SkeletonBar({ className }: { className: string }) {
  return (
    <div aria-hidden className={`animate-pulse rounded-[8px] bg-ink-border-5 ${className}`} />
  );
}

// 16x16 lock glyph -- marks the price/quantity fields as locked (read-only,
// terms fixed at mint time). Same geometry as KeysAndSalesSheet.tsx's
// local LockIcon.
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="1.5"
        stroke="#202123"
        strokeOpacity="0.4"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="#202123"
        strokeOpacity="0.4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KeysAndSalesPanel({ headingId, postId, onDone, extraLoading }: Props) {
  const { data, isPending, isError } = useKeysSold(postId);
  const { data: prices } = useNuaPrices();
  const loading = isPending || extraLoading;

  const priceIcp =
    data && !loading && !isError ? Number(data.priceE8s) / 10 ** TOKENS.ICP.decimals : 0;
  const ckbtcEquiv =
    prices && priceIcp > 0 ? priceBetween(prices, "ICP", "ckBTC", priceIcp) : null;
  const nuaEquiv =
    prices && priceIcp > 0 ? priceBetween(prices, "ICP", "NUA", priceIcp) : null;

  const total = data?.total ?? 0;
  const sold = data?.sold ?? 0;
  // Guard against divide-by-zero when total is 0 (shouldn't happen for a
  // minted article, but the read-only panel must not crash on it).
  const fillPct = total > 0 ? Math.min(100, (sold / total) * 100) : 0;

  const lockedFieldClass =
    "flex h-[calc(48*var(--fpx))] w-[calc(140*var(--fpx))] shrink-0 items-center " +
    "justify-between gap-2 rounded-[calc(6*var(--fpx))] border border-ink-border-10 " +
    "bg-ink-border-5 px-[calc(16*var(--fpx))]";

  return (
    <div className="flex flex-col gap-[calc(32*var(--fpx))]">
      {/* Heading */}
      <div className="flex flex-col gap-[calc(12*var(--fpx))]">
        <h1 id={headingId} className="text-lg font-bold text-ink-60">
          {sc.heading}
        </h1>
        <p className="text-label font-medium text-ink-80">{sc.subHeading}</p>
      </div>

      <MintPicturePreview src={data && !isError ? data.pictureUrl : null} />

      <div className="h-px bg-ink-border/10" />

      {/* Number of keys */}
      <div className="flex flex-col gap-[calc(12*var(--fpx))]">
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <p className="text-label font-bold text-ink">{sc.keysLabel}</p>
          <p className="text-label font-medium text-ink-80">{sc.keysInfo}</p>
        </div>
        <div className="flex items-center gap-[calc(8*var(--fpx))]">
          <div className={lockedFieldClass}>
            {loading ? (
              <SkeletonBar className="h-[calc(16*var(--fpx))] w-[calc(56*var(--fpx))]" />
            ) : (
              <span className="truncate text-body text-ink-40">
                {isError ? sc.conversionPlaceholder : total.toLocaleString()}
              </span>
            )}
            <LockIcon />
          </div>
          <span className="text-body font-medium text-ink-60">{sc.keysUnit}</span>
        </div>
        {/* Sold progress -- track Black/10%, fill Purple/100 */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={loading || isError ? undefined : sold}
          className="h-[calc(4*var(--fpx))] w-full rounded-[calc(2*var(--fpx))] bg-ink-border-10"
        >
          {!loading && !isError && (
            <div
              className="h-full rounded-[calc(2*var(--fpx))] bg-brand-purple"
              style={{ width: `${fillPct}%` }}
            />
          )}
        </div>
        {loading ? (
          <SkeletonBar className="h-[calc(16*var(--fpx))] w-[calc(160*var(--fpx))]" />
        ) : isError ? (
          <p className="text-label font-bold text-error">{sc.soldLineError}</p>
        ) : (
          <p className="text-label font-bold text-ink">{sc.soldLine(sold, total)}</p>
        )}
      </div>

      <div className="h-px bg-ink-border/10" />

      {/* Price per key */}
      <div className="flex flex-col gap-[calc(12*var(--fpx))]">
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <p className="text-label font-bold text-ink">{sc.priceLabel}</p>
          <p className="text-label font-medium text-ink-80">{sc.priceInfo}</p>
        </div>
        <div className="flex items-center gap-[calc(8*var(--fpx))]">
          <div className={lockedFieldClass}>
            {loading ? (
              <SkeletonBar className="h-[calc(16*var(--fpx))] w-[calc(56*var(--fpx))]" />
            ) : (
              <span className="truncate text-body text-ink-40">
                {isError
                  ? sc.conversionPlaceholder
                  : formatSignificant(data!.priceE8s, { decimals: TOKENS.ICP.decimals })}
              </span>
            )}
            <LockIcon />
          </div>
          <span className="text-body font-medium text-ink-60">{sc.priceUnit}</span>
        </div>
        {loading ? (
          <SkeletonBar className="h-[calc(16*var(--fpx))] w-[calc(160*var(--fpx))]" />
        ) : (
          !isError && (
            <p className="text-label text-ink-60">
              {sc.conversionPrefix}{" "}
              {ckbtcEquiv != null ? ckbtcEquiv.toFixed(8) : sc.conversionPlaceholder}{" "}
              {sc.ckbtcUnit} {sc.conversionPrefix}{" "}
              {nuaEquiv != null ? nuaEquiv.toFixed(2) : sc.conversionPlaceholder}{" "}
              {sc.nuaUnit}
            </p>
          )
        )}
      </div>

      <div className="h-px bg-ink-border/10" />

      {/* Done */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-[calc(8*var(--fpx))] bg-brand-gradient-button px-6 py-2.5 text-[18px] font-medium leading-[24px] text-white shadow-[var(--shadow-purple-glow-medium)]"
        >
          {sc.doneLabel}
        </button>
      </div>
    </div>
  );
}
