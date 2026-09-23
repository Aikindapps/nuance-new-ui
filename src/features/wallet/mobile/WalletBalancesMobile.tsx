import {
  DISPLAY_TOKEN_ORDER,
  TOKENS,
  type HoldingRow,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount, fromE8s } from "../../../lib/tokenMath";
import { walletCopy } from "../../../constants/copy";
import { tokenIcons } from "../../../images";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import {
  useNuaPrices,
  nuaEquivalentOf,
} from "../hooks/useNuaEquivalent";

// Phone token balances (Figma 2419:4829): one compact row per token,
// stacked in a single column with a 1px divider between every row.
// Mirrors CurrencyHoldings' per-row math -- reimplemented here since
// that file cannot be safely edited under our diff transport.

const SKELETON_ROWS = 4;

function rawFor(
  row: HoldingRow,
  balances: Record<SupportedTokenSymbol, bigint> | undefined,
  freeNua: bigint | undefined,
): bigint | undefined {
  return row === "FreeNUA" ? freeNua : balances?.[row];
}

export function WalletBalancesMobile() {
  const balances = useTokenBalances();
  const freeNua = useFreeNuaBalance();
  const prices = useNuaPrices();

  const loading = balances.isPending || freeNua.isPending;

  const barA = "animate-pulse rounded-[8px] bg-ink-border/10";
  const barB = "animate-pulse rounded-[8px] bg-ink-border/5";

  if (loading) {
    return (
      <section
        aria-busy="true"
        className="divide-y divide-ink-border-5 rounded-card bg-white"
      >
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="flex items-center gap-4 py-4"
          >
            <span className={`size-12 shrink-0 ${barA}`} />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className={`h-4 w-36 ${barA}`} />
              <span className={`h-3 w-24 ${barB}`} />
            </span>
            <span className={`h-5 w-20 shrink-0 ${barA}`} />
          </div>
        ))}
      </section>
    );
  }

  const rowClass = "divide-y divide-ink-border-5 rounded-card bg-white";

  return (
    <section className={rowClass}>
      {DISPLAY_TOKEN_ORDER.map((row) => {
        const raw = rawFor(row, balances.data, freeNua.data);
        const label = row === "FreeNUA" ? "Free NUA" : row;
        const subtitle =
          row === "FreeNUA" || row === "NUA"
            ? walletCopy.nuanceToken
            : undefined;
        const displayDecimals =
          row === "FreeNUA" ? 0 : TOKENS[row].displayDecimals;
        const amount =
          raw === undefined
            ? walletCopy.balanceError
            : formatAmount(raw, { displayDecimals });

        let nuaEquivalent: string | null = null;
        if (row === "ICP" || row === "ckBTC") {
          if (raw !== undefined && prices.data) {
            const eq = nuaEquivalentOf(
              prices.data,
              row as SupportedTokenSymbol,
              fromE8s(raw),
            );
            if (eq != null) nuaEquivalent = `= ${Math.round(eq)} NUA`;
          }
        }

        const amountColClass =
          "flex shrink-0 flex-col items-end gap-1 " +
          "whitespace-nowrap";

        return (
          <div
            key={row}
            className="flex items-center gap-4 py-4"
          >
            <img
              src={tokenIcons[row]}
              alt=""
              aria-hidden
              className="size-12 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className="truncate text-title-sm font-bold text-ink"
              >
                {label}
              </span>
              {subtitle && (
                <span className="truncate text-label text-ink-60">
                  {subtitle}
                </span>
              )}
            </div>
            <div className={amountColClass}>
              <span className="text-title-sm font-bold text-ink">
                {amount}
              </span>
              {nuaEquivalent != null && (
                <span className="text-body text-ink-40">
                  {nuaEquivalent}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
