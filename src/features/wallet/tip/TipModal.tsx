import { useMemo, useState } from "react";
import { Popup } from "../../../components/ui/Popup";
import { tipModalCopy } from "../../../constants/copy";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount, fromE8s } from "../../../lib/tokenMath";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import {
  useNuaPrices,
  nuaEquivalentOf,
  tokenE8sForNua,
} from "../hooks/useNuaEquivalent";
import { useTipAuthor } from "./useTipAuthor";

export const TIP_MODAL_TITLE_ID = "tip-modal-title";

const APPLAUD_CAP = 10000;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-3">
      <span className="text-body font-bold text-ink">{value}</span>
      <span className="text-label text-ink-60">{label}</span>
    </div>
  );
}

// Tip Author modal (Page 4 §4.2). Input page (pick token + applaud amount +
// confirm terms) → success page. Modal content renders above ToastProvider, so
// feedback is inline (error row + success page), never a toast. Real funds move
// on submit — there's no temporary clamp (Mr Nick self-limits during testing).
export function TipModal({
  postId,
  bucketCanisterId,
  onClose,
}: {
  postId: string;
  bucketCanisterId: string;
  onClose: () => void;
}) {
  const balances = useTokenBalances();
  const freeNua = useFreeNuaBalance();
  const prices = useNuaPrices();
  const tip = useTipAuthor(postId, bucketCanisterId);

  const [token, setToken] = useState<SupportedTokenSymbol>("NUA");
  const [amount, setAmount] = useState(0);
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = tipModalCopy;

  // Spendable balance for the selected token — NUA includes restricted (Free).
  const selectedBalanceE8s = useMemo(() => {
    const regular = balances.data?.[token] ?? 0n;
    return token === "NUA" ? regular + (freeNua.data ?? 0n) : regular;
  }, [balances.data, freeNua.data, token]);

  // Max applauds the balance affords (NUA-equivalent of balance − fee), capped.
  const maxApplauds = useMemo(() => {
    if (!prices.data) return 0;
    const available = selectedBalanceE8s - TOKENS[token].fee;
    if (available <= 0n) return 0;
    const nuaEq = nuaEquivalentOf(prices.data, token, fromE8s(available));
    if (nuaEq == null) return 0;
    return Math.min(APPLAUD_CAP, Math.max(0, Math.floor(nuaEq)));
  }, [prices.data, selectedBalanceE8s, token]);

  // Cost of `amount` applauds in the selected token (display).
  const costDisplay = useMemo(() => {
    if (!prices.data || amount <= 0) return null;
    const decimals = TOKENS[token].decimals;
    const e8s = tokenE8sForNua(prices.data, token, amount * 10 ** decimals);
    if (e8s == null) return null;
    // Per-token precision: NUA is whole; ICP at 4dp; ckBTC needs full 8dp or a
    // realistic tip (~33 base units = 0.00000033) rounds to "0.0000" and reads
    // as free.
    const costDecimals = token === "NUA" ? 0 : token === "ckBTC" ? 8 : 4;
    return (Math.floor(e8s) / 10 ** decimals).toFixed(costDecimals);
  }, [prices.data, amount, token]);

  const valid = amount > 0 && amount <= maxApplauds && terms && !!prices.data;

  const submit = () => {
    setError(null);
    tip.mutate(
      { token, applauds: amount },
      {
        onSuccess: () => setDone(true),
        onError: (e) => setError(e.message),
      },
    );
  };

  if (done) {
    return (
      <Popup
        titleId={TIP_MODAL_TITLE_ID}
        title={c.successTitle}
        onClose={onClose}
        closeAriaLabel={c.closeAria}
      >
        <div className="mt-6 flex flex-col gap-6">
          <p className="text-body text-ink-80">{c.successBody}</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card text-body font-medium text-white"
          >
            {c.successClose}
          </button>
        </div>
      </Popup>
    );
  }

  return (
    <Popup
      titleId={TIP_MODAL_TITLE_ID}
      title={c.title}
      onClose={onClose}
      closeAriaLabel={c.closeAria}
    >
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-body text-ink-80">
          {c.body}{" "}
          <a
            href={c.readMoreUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-purple"
          >
            {c.readMore}
          </a>
        </p>

        {/* Balances */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-medium uppercase tracking-wide text-ink-60">
            {c.inWallet}
          </p>
          <div className="flex divide-x divide-ink-border-5 rounded-card border border-ink-border-10">
            <Stat
              label="Free NUA"
              value={
                freeNua.data != null
                  ? formatAmount(freeNua.data, { displayDecimals: 0 })
                  : "—"
              }
            />
            {TOKEN_SYMBOLS.map((s) => (
              <Stat
                key={s}
                label={s}
                value={balances.data ? formatAmount(balances.data[s]) : "—"}
              />
            ))}
          </div>
        </div>

        {/* Pay with */}
        <div className="flex flex-col gap-2">
          <p className="text-label font-medium uppercase tracking-wide text-ink-60">
            {c.selectLabel}
          </p>
          <div className="flex gap-2">
            {TOKEN_SYMBOLS.map((s) => {
              const active = s === token;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setToken(s);
                    setError(null);
                  }}
                  className={`flex-1 rounded-card border px-4 py-2 text-body font-medium transition-colors ${
                    active
                      ? "border-brand-purple bg-brand-purple-5 text-brand-purple"
                      : "border-ink-border-10 text-ink-80 hover:bg-ink-border-5"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-label font-medium uppercase tracking-wide text-ink-60">
              {c.amountLabel}
            </p>
            <button
              type="button"
              onClick={() => setAmount(maxApplauds)}
              className="text-label font-medium text-brand-purple"
            >
              {c.maxLabel.replace("{max}", String(maxApplauds))}
            </button>
          </div>
          <input
            type="number"
            min={0}
            max={APPLAUD_CAP}
            step={1}
            inputMode="numeric"
            value={amount === 0 ? "" : amount}
            placeholder={c.amountPlaceholder}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setAmount(0);
                return;
              }
              if (/^\d*$/.test(v)) {
                const n = parseInt(v, 10) || 0;
                if (n <= APPLAUD_CAP) setAmount(n);
              }
            }}
            className="rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink focus:border-brand-purple focus:outline-none"
          />
          {costDisplay && (
            <p className="text-label text-ink-60">
              {c.costPrefix} {costDisplay} {token}
            </p>
          )}
          {amount > maxApplauds && amount > 0 && (
            <p className="text-label text-error">{c.overMax}</p>
          )}
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

        <button
          type="button"
          disabled={!valid || tip.isPending}
          onClick={submit}
          className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card text-body font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tip.isPending ? c.applauding : c.applaudLabel}
        </button>
      </div>
    </Popup>
  );
}
