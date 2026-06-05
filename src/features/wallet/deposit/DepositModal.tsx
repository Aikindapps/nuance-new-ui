import { useMemo, useState } from "react";
import { Popup } from "../../../components/ui/Popup";
import { useAuth } from "../../../contexts/useAuth";
import { walletCopy } from "../../../constants/copy";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount } from "../../../lib/tokenMath";
import { principalToAccountIdentifier } from "../../../lib/accountIdentifier";
import { useTokenBalances } from "../hooks/useTokenBalances";

export const DEPOSIT_TITLE_ID = "deposit-modal-title";

// Read-only deposit view (decision #42 update): the address depends on the
// selected token — ICP is addressed by its legacy account identifier (verified
// in scripts/verify-account-id.ts), NUA/ckBTC by the principal. No outbound
// transfer here (that's Withdraw, still deferred). Modal content renders above
// ToastProvider, so feedback is the inline copied-label flip, not a toast.
export function DepositModal({ onClose }: { onClose: () => void }) {
  const { principal } = useAuth();
  const balances = useTokenBalances();
  const [selected, setSelected] = useState<SupportedTokenSymbol>("NUA");
  const [copied, setCopied] = useState(false);

  const principalText = principal?.toText() ?? "";
  const accountId = useMemo(
    () => (principalText ? principalToAccountIdentifier(principalText) : ""),
    [principalText],
  );

  const isIcp = selected === "ICP";
  const address = isIcp ? accountId : principalText;
  const addressLabel = isIcp
    ? walletCopy.depositAddressAccountId
    : walletCopy.depositAddressPrincipal;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the address is still selectable on screen */
    }
  };

  return (
    <Popup
      titleId={DEPOSIT_TITLE_ID}
      title={walletCopy.depositTitle}
      onClose={onClose}
      closeAriaLabel={walletCopy.depositCloseAria}
    >
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-body text-ink-80">{walletCopy.depositBody}</p>

        {/* Current balances */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-medium uppercase tracking-wide text-ink-60">
            {walletCopy.depositInWallet}
          </p>
          <div className="flex divide-x divide-ink-border-5 rounded-card border border-ink-border-10">
            {TOKEN_SYMBOLS.map((sym) => (
              <div key={sym} className="flex flex-1 flex-col items-center gap-1 py-4">
                <span className="text-lg font-bold text-ink">
                  {balances.data ? formatAmount(balances.data[sym]) : walletCopy.balanceError}
                </span>
                <span className="text-label text-ink-60">{TOKENS[sym].symbol}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Currency selector */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-medium uppercase tracking-wide text-ink-60">
            {walletCopy.depositSelectLabel}
          </p>
          <div className="flex gap-2">
            {TOKEN_SYMBOLS.map((sym) => {
              const active = sym === selected;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setSelected(sym);
                    setCopied(false);
                  }}
                  aria-pressed={active}
                  className={`flex-1 rounded-card border px-4 py-2 text-body font-medium transition-colors ${
                    active
                      ? "border-brand-purple bg-brand-purple-5 text-brand-purple"
                      : "border-ink-border-10 text-ink-80 hover:bg-ink-border-5"
                  }`}
                >
                  {TOKENS[sym].symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-medium uppercase tracking-wide text-ink-60">
            {addressLabel}
          </p>
          <button
            type="button"
            onClick={copy}
            className="flex items-center justify-between gap-3 rounded-card border border-ink-border-10 px-4 py-3 text-left transition-colors hover:bg-ink-border-5"
          >
            <span className="break-all text-body text-ink-80">{address}</span>
            <span className="shrink-0 text-label font-medium text-brand-purple">
              {copied ? walletCopy.depositCopied : walletCopy.depositCopy}
            </span>
          </button>
        </div>
      </div>
    </Popup>
  );
}
