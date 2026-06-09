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
export function TokenCard({ row, label, subtitle, amount, nuaEquivalent }: Props) {
  return (
    <div className="flex items-center justify-between rounded-card bg-white pl-[calc(16*var(--fpx))] pr-[calc(24*var(--fpx))] py-[calc(16*var(--fpx))]">
      <div className="flex items-center gap-[calc(24*var(--fpx))]">
        <img
          src={tokenIcons[row]}
          alt=""
          aria-hidden
          className="size-[calc(80*var(--fpx))] shrink-0"
        />
        <div className="flex flex-col gap-[calc(4*var(--fpx))]">
          <span className="text-title-sm font-bold text-ink">{label}</span>
          {subtitle && (
            <span className="text-label font-medium text-ink-60">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[calc(4*var(--fpx))] whitespace-nowrap">
        <span className="text-title-sm font-bold text-ink">{amount}</span>
        {nuaEquivalent != null && (
          <span className="text-body font-medium text-ink-40">{nuaEquivalent}</span>
        )}
      </div>
    </div>
  );
}
