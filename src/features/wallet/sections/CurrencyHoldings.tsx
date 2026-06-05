import {
  DISPLAY_TOKEN_ORDER,
  type HoldingRow,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount, fromE8s } from "../../../lib/tokenMath";
import { walletCopy } from "../../../constants/copy";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import { useNuaPrices, nuaEquivalentOf } from "../hooks/useNuaEquivalent";
import { TokenCard } from "./TokenCard";

// Currency holdings (Figma 1:46399): 2-up token cards. NUA/Free-NUA show a
// "Nuance token" subtitle and no conversion; ICP/ckBTC show a "= N NUA" line.
const ROWS: HoldingRow[][] = [
  DISPLAY_TOKEN_ORDER.slice(0, 2),
  DISPLAY_TOKEN_ORDER.slice(2, 4),
];

export function CurrencyHoldings() {
  const balances = useTokenBalances();
  const freeNua = useFreeNuaBalance();
  const prices = useNuaPrices();

  const rawFor = (row: HoldingRow): bigint | undefined =>
    row === "FreeNUA" ? freeNua.data : balances.data?.[row];

  const cardFor = (row: HoldingRow) => {
    const raw = rawFor(row);
    const label = row === "FreeNUA" ? "Free NUA" : row;
    const subtitle =
      row === "FreeNUA" || row === "NUA" ? walletCopy.nuanceToken : undefined;
    const amount =
      raw === undefined
        ? walletCopy.balanceError
        : formatAmount(raw, { displayDecimals: row === "FreeNUA" ? 0 : 4 });

    // Conversion line only for ICP/ckBTC; null = unavailable → hidden.
    let nuaEquivalent: string | null | undefined;
    if (row === "ICP" || row === "ckBTC") {
      nuaEquivalent = null;
      if (raw !== undefined && prices.data) {
        const eq = nuaEquivalentOf(
          prices.data,
          row as SupportedTokenSymbol,
          fromE8s(raw),
        );
        if (eq != null) nuaEquivalent = `= ${Math.round(eq)} NUA`;
      }
    }
    return { row, label, subtitle, amount, nuaEquivalent };
  };

  return (
    <section className="divide-y divide-ink-border-5">
      {ROWS.map((pair, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-[calc(16*var(--fpx))] py-[calc(16*var(--fpx))] sm:grid-cols-2 sm:divide-x sm:divide-ink-border-5"
        >
          {pair.map((row) => (
            <TokenCard key={row} {...cardFor(row)} />
          ))}
        </div>
      ))}
    </section>
  );
}
