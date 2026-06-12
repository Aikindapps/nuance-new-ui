import { tokenIcons } from "../../../images";
import type { HoldingRow } from "../../../config/tokens";

type Props = {
  row: HoldingRow;
  label: string;
  subtitle?: string;
  /** Formatted balance, or the em-dash placeholder while loading/on error. */
  amount: string;
  /** NUA-equivalent line (ICP/ckBTC only); omitted when null. */
  nuaEquivalent?: string | null;
};

// One holdings card (Figma 1:46401 etc.): 80px token logo + name/subtitle on the
// left, balance (and optional "= N NUA") right-aligned.
//
// Layout hardening (visual pass 2026-06-12): boxes scale with --fpx but the
// type scale doesn't, so at narrower widths a long 8-dp ckBTC balance collided
// with the token name. The name column truncates (min-w-0) and the amount
// column never shrinks or wraps — overlap is impossible by construction.
export function TokenCard({ row, label, subtitle, amount, nuaEquivalent }: Props) {
  return (
    <div className="flex items-center justify-between gap-[calc(12*var(--fpx))] rounded-card bg-white pl-[calc(16*var(--fpx))] pr-[calc(24*var(--fpx))] py-[calc(16*var(--fpx))]">
      <div className="flex min-w-0 items-center gap-[calc(24*var(--fpx))]">
        <img
          src={tokenIcons[row]}
          alt=""
          aria-hidden
          className="size-[calc(80*var(--fpx))] shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-[calc(4*var(--fpx))]">
          <span className="truncate text-title-sm font-bold text-ink">{label}</span>
          {subtitle && (
            <span className="truncate text-label font-medium text-ink-60">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-[calc(4*var(--fpx))] whitespace-nowrap">
        <span className="text-title-sm font-bold text-ink">{amount}</span>
        {nuaEquivalent != null && (
          <span className="text-body font-medium text-ink-40">{nuaEquivalent}</span>
        )}
      </div>
    </div>
  );
}
