import { TOKEN_SYMBOLS, TOKENS } from "../../../config/tokens";
import { formatAmount } from "../../../lib/tokenMath";
import { tokenIcons } from "../../../images";
import { useTokenBalances } from "../hooks/useTokenBalances";

// "Your current balance is:" row shared by the Deposit and Withdraw modals
// (Figma "Currencies" — 40px token icon, bold amount, symbol). BNB from the
// Figma is excluded (illustrative only — decision #43).
export function BalancesRow() {
  const balances = useTokenBalances();
  return (
    <div className="flex flex-wrap items-center justify-center gap-12 py-4">
      {TOKEN_SYMBOLS.map((sym) => (
        <div key={sym} className="flex w-32 flex-col items-center gap-2">
          <img src={tokenIcons[sym]} alt="" className="size-10 rounded-full" />
          <span className="text-lg font-bold tracking-tight text-ink-80">
            {balances.data
              ? formatAmount(balances.data[sym], {
                  displayDecimals: TOKENS[sym].displayDecimals,
                })
              : "—"}
          </span>
          <span className="text-body font-medium text-ink-60">{sym}</span>
        </div>
      ))}
    </div>
  );
}
