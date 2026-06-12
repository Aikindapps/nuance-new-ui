import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Popup } from "../../../components/ui/Popup";
import { useAuth } from "../../../contexts/useAuth";
import { walletCopy } from "../../../constants/copy";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { principalToAccountIdentifier } from "../../../lib/accountIdentifier";
import { BalancesRow } from "../components/BalancesRow";

export const DEPOSIT_TITLE_ID = "deposit-modal-title";

// Deposit modal (Figma §7.2: 1:46991 select → 1:47902 QR). Two pages: pick a
// currency, then "Generate code" renders the QR + copyable address. The address
// itself is deterministic per principal — ICP by its legacy account identifier
// (verified in scripts/verify-account-id.ts), NUA/ckBTC by the principal — so
// "generate" is instant and purely client-side. No outbound transfer here.
// Modal content renders above ToastProvider, so feedback is the inline
// copied-label flip, never a toast. The currency picker is the button-row the
// project uses in place of the Figma dropdown (accepted deviation, PR #12).
export function DepositModal({ onClose }: { onClose: () => void }) {
  const { principal } = useAuth();
  const [selected, setSelected] = useState<SupportedTokenSymbol>("NUA");
  const [page, setPage] = useState<"select" | "code">("select");
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

  if (page === "code") {
    return (
      <Popup
        titleId={DEPOSIT_TITLE_ID}
        title={walletCopy.depositTitle}
        onClose={onClose}
        closeAriaLabel={walletCopy.depositCloseAria}
        footer={
          <button
            type="button"
            onClick={() => {
              setPage("select");
              setCopied(false);
            }}
            className="flex h-12 items-center justify-center rounded-card border border-brand-purple bg-white px-6 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            {walletCopy.depositChangeCurrency}
          </button>
        }
      >
        <div className="mt-6 flex flex-col gap-6">
          <p className="text-body font-medium text-ink">{walletCopy.depositScan}</p>

          {/* QR (Figma 1:47906 — 304px code in an 8px white inset) */}
          <div className="mx-auto rounded-2xl border border-ink-border-10 bg-white p-2">
            <QRCodeSVG value={address} size={304} marginSize={2} />
          </div>

          {/* "or enter this code manually" divider (Figma 1:47909) */}
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-ink-border-10" />
            <span className="text-body text-ink-60">{walletCopy.depositManual}</span>
            <span className="h-px flex-1 bg-ink-border-10" />
          </div>

          {/* Address + copy */}
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

  return (
    <Popup
      titleId={DEPOSIT_TITLE_ID}
      title={walletCopy.depositTitle}
      onClose={onClose}
      closeAriaLabel={walletCopy.depositCloseAria}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-card border border-brand-purple bg-white px-6 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            {walletCopy.depositCancel}
          </button>
          <button
            type="button"
            onClick={() => setPage("code")}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium"
          >
            {walletCopy.depositGenerate}
          </button>
        </>
      }
    >
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-body text-ink">
          {walletCopy.depositBodyLine1}
          <br />
          {walletCopy.depositBodyLine2}
        </p>

        <BalancesRow />

        {/* Currency selector */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-bold text-ink">
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
          <p className="text-label text-ink-60">{walletCopy.depositHelper}</p>
        </div>
      </div>
    </Popup>
  );
}
