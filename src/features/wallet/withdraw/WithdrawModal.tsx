import { useMemo, useState } from "react";
import { Principal } from "@icp-sdk/core/principal";
import { Popup } from "../../../components/ui/Popup";
import { IconPartySuccess } from "../../../components/ui/icons/IconPartySuccess";
import { useAuth } from "../../../contexts/useAuth";
import { withdrawCopy } from "../../../constants/copy";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount, fromE8s, toE8s } from "../../../lib/tokenMath";
import {
  accountIdBytesFromHex,
  principalToAccountIdentifier,
} from "../../../lib/accountIdentifier";
import { BalancesRow } from "../components/BalancesRow";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useNuaPrices, priceBetween } from "../hooks/useNuaEquivalent";
import { useWithdraw } from "./useWithdraw";

export const WITHDRAW_TITLE_ID = "withdraw-modal-title";

function isPrincipalText(text: string): boolean {
  try {
    return Principal.fromText(text).toText() === text;
  } catch {
    return false;
  }
}

// Withdraw modal (Figma 1:47170 form → 1:48066 success). Modal content renders
// above ToastProvider, so all feedback is inline (validation rows, mutation
// error row, success page) — never a toast. The currency picker is the same
// button-row the Deposit modal uses in place of the Figma dropdown (accepted
// deviation, PR #12). BNB from the Figma is excluded (illustrative only).
export function WithdrawModal({ onClose }: { onClose: () => void }) {
  const { principal } = useAuth();
  const balances = useTokenBalances();
  const prices = useNuaPrices();
  const withdraw = useWithdraw();

  const [token, setToken] = useState<SupportedTokenSymbol>("NUA");
  const [receiver, setReceiver] = useState("");
  const [amountText, setAmountText] = useState("");
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState<{ amount: bigint; token: SupportedTokenSymbol } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const c = withdrawCopy;
  const cfg = TOKENS[token];
  const principalText = principal?.toText() ?? "";

  const balanceE8s = balances.data?.[token] ?? 0n;
  const maxE8s = balanceE8s > cfg.fee ? balanceE8s - cfg.fee : 0n;

  const amountE8s = useMemo(() => {
    const n = parseFloat(amountText);
    return Number.isFinite(n) && n > 0 ? toE8s(n, cfg.decimals) : 0n;
  }, [amountText, cfg.decimals]);

  // Receiver validation. ICP accepts a principal OR a checksummed 64-hex
  // account id (decision #43); NUA/ckBTC are principal-only. Self-sends are
  // rejected in both address forms.
  const receiverTrimmed = receiver.trim();
  const receiverState = useMemo<"empty" | "ok" | "invalid" | "self">(() => {
    if (!receiverTrimmed) return "empty";
    const isPrincipal = isPrincipalText(receiverTrimmed);
    const isIcpAccountId =
      token === "ICP" && accountIdBytesFromHex(receiverTrimmed) != null;
    if (!isPrincipal && !isIcpAccountId) return "invalid";
    if (isPrincipal && receiverTrimmed === principalText) return "self";
    if (
      isIcpAccountId &&
      principalText &&
      receiverTrimmed.toLowerCase() ===
        principalToAccountIdentifier(principalText)
    ) {
      return "self";
    }
    return "ok";
  }, [receiverTrimmed, token, principalText]);

  const amountTooHigh = amountE8s > maxE8s;
  const valid =
    receiverState === "ok" && amountE8s > 0n && !amountTooHigh && terms;

  // "= X NUA | Y ICP | Z ckBTC" cross-rate line (Figma 1:47200). Hidden parts
  // degrade silently when a Sonic quote is missing.
  const calcLine = useMemo(() => {
    const n = parseFloat(amountText);
    const amount = Number.isFinite(n) && n > 0 ? n : 0;
    const parts = TOKEN_SYMBOLS.map((target) => {
      const v =
        amount === 0 ? 0 : priceBetween(prices.data ?? [], token, target, amount);
      if (v == null) return null;
      return `${v.toFixed(TOKENS[target].displayDecimals)} ${target}`;
    }).filter(Boolean);
    return parts.length ? `= ${parts.join(" | ")}` : null;
  }, [amountText, prices.data, token]);

  const submit = () => {
    setError(null);
    withdraw.mutate(
      { token, receiver: receiverTrimmed, amount: amountE8s },
      {
        onSuccess: (vars) => setDone({ amount: vars.amount, token: vars.token }),
        onError: (e) => setError(e.message),
      },
    );
  };

  if (done) {
    return (
      <Popup
        titleId={WITHDRAW_TITLE_ID}
        title={c.successTitle}
        onClose={onClose}
        closeAriaLabel={c.closeAria}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium"
          >
            {c.successButton}
          </button>
        }
      >
        <div className="mt-6 flex flex-col gap-6">
          <p className="text-body text-ink">
            <strong>
              {formatAmount(done.amount, {
                displayDecimals: TOKENS[done.token].displayDecimals,
              })}{" "}
              {done.token}
            </strong>{" "}
            {c.successBody}
          </p>
          <IconPartySuccess className="mx-auto my-10 size-[calc(240*var(--fpx))]" />
        </div>
      </Popup>
    );
  }

  return (
    <Popup
      titleId={WITHDRAW_TITLE_ID}
      title={c.title}
      onClose={onClose}
      closeAriaLabel={c.closeAria}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-card border border-brand-purple bg-white px-6 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            {c.cancelLabel}
          </button>
          <button
            type="button"
            disabled={!valid || withdraw.isPending}
            onClick={submit}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {withdraw.isPending ? c.withdrawing : c.withdrawLabel}
          </button>
        </>
      }
    >
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-body text-ink">
          {c.bodyLine1}
          <br />
          {c.bodyLine2}
        </p>

        <BalancesRow />

        {/* Currency selector */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-bold text-ink">{c.selectLabel}</p>
          <div className="flex gap-2">
            {TOKEN_SYMBOLS.map((sym) => {
              const active = sym === token;
              return (
                <button
                  key={sym}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setToken(sym);
                    setError(null);
                  }}
                  className={`flex-1 rounded-card border px-4 py-2 text-body font-medium transition-colors ${
                    active
                      ? "border-brand-purple bg-brand-purple-5 text-brand-purple"
                      : "border-ink-border-10 text-ink-80 hover:bg-ink-border-5"
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* Receiver */}
        <div className="flex flex-col gap-2">
          <label htmlFor="withdraw-receiver" className="text-label font-bold text-ink">
            {c.receiverLabel}
          </label>
          <input
            id="withdraw-receiver"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={receiver}
            placeholder={
              token === "ICP" ? c.receiverPlaceholderIcp : c.receiverPlaceholder
            }
            onChange={(e) => setReceiver(e.target.value)}
            aria-invalid={receiverState === "invalid" || receiverState === "self"}
            aria-describedby="withdraw-receiver-error"
            className="rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink focus:border-brand-purple focus:outline-none"
          />
          <p id="withdraw-receiver-error" className="text-label text-error empty:hidden">
            {receiverState === "invalid"
              ? token === "ICP"
                ? c.errorReceiverInvalidIcp
                : c.errorReceiverInvalid
              : receiverState === "self"
                ? c.errorReceiverSelf
                : null}
          </p>
        </div>

        {/* Amount + calculation line */}
        <div className="flex flex-col gap-2">
          <label htmlFor="withdraw-amount" className="text-label font-bold text-ink">
            {c.amountLabel}
          </label>
          <div className="relative">
            <input
              id="withdraw-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              placeholder={c.amountPlaceholder}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d{0,8}$/.test(v)) setAmountText(v);
              }}
              aria-invalid={amountTooHigh}
              aria-describedby="withdraw-amount-error"
              className="w-full rounded-card border border-ink-border-10 bg-ink-border-5 py-3 pl-4 pr-16 text-body text-ink focus:border-brand-purple focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setAmountText(
                  fromE8s(maxE8s, cfg.decimals).toFixed(cfg.displayDecimals),
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-label font-medium text-ink-60 hover:text-brand-purple"
            >
              {c.maxLabel}
            </button>
          </div>
          {calcLine && (
            <p className="px-2 text-label font-medium text-ink-80">{calcLine}</p>
          )}
          <p id="withdraw-amount-error" className="text-label text-error empty:hidden">
            {amountTooHigh ? c.errorAmount : null}
          </p>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-brand-purple)]"
          />
          <span className="text-label text-ink-80">{c.terms}</span>
        </label>

        {error && <p className="text-label text-error">{error}</p>}
      </div>
    </Popup>
  );
}
