import { useMemo, useState } from "react";
import { Popup } from "../../../components/ui/Popup";
import { tipModalCopy } from "../../../constants/copy";
import {
  TOKEN_SYMBOLS,
  TOKENS,
  type SupportedTokenSymbol,
} from "../../../config/tokens";
import { formatAmount } from "../../../lib/tokenMath";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import { useNuaPrices, NUA_PRICES_STALE_MS } from "../hooks/useNuaEquivalent";
import {
  tipAmountE8s,
  hasQuote,
  planTip,
  maxAffordableApplauds,
  minTipApplauds,
  formatExactE8s,
} from "./tipAmount";
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

/** Fills `{name}` placeholders in a copy template from `vars`. */
function fmt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [key, value]) => s.replaceAll(`{${key}}`, value),
    template,
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

  // NUA never needs a quote; ICP/ckBTC need a Sonic quote and can be
  // loading (initial fetch or a refresh) or simply unavailable (the pool
  // quote failed, so `prices` succeeded but the entry is missing).
  const priceState = useMemo<"ready" | "loading" | "unavailable">(() => {
    if (token === "NUA") return "ready";
    if (prices.isFetching) return "loading";
    return hasQuote(prices.data, token) ? "ready" : "unavailable";
  }, [token, prices.isFetching, prices.data]);

  const freeNuaE8s = token === "NUA" ? freeNua.data ?? 0n : 0n;

  // Exact e8s cost of `amount` applauds -- the same helper the transfer uses,
  // so the number on screen and the number sent can never diverge.
  const amountE8s = useMemo(() => {
    if (amount <= 0 || priceState !== "ready") return null;
    return tipAmountE8s(prices.data, token, amount);
  }, [amount, priceState, prices.data, token]);

  // Smallest applaud count the back end can pay out in `token` at the current
  // price (NIC-568, D-137). Only computed once the price is ready; NUA is 1.
  const minApplauds = useMemo(() => {
    if (priceState !== "ready") return null;
    return minTipApplauds(prices.data, token, APPLAUD_CAP);
  }, [priceState, prices.data, token]);

  const belowMin = minApplauds !== null && amount < minApplauds;

  const plan = useMemo(() => {
    if (amountE8s == null || amountE8s <= 0n || belowMin || !balances.data) {
      return null;
    }
    return planTip(token, amount, amountE8s, balances.data[token], freeNuaE8s);
  }, [amountE8s, belowMin, balances.data, token, amount, freeNuaE8s]);

  // Exact max applauds the reader can afford, found the same way the plan is
  // built (so Max can never pick an amount the transfer then rejects). Hidden
  // (button not rendered) while balances are loading or the price isn't
  // ready.
  const maxApplauds = useMemo(() => {
    if (priceState !== "ready" || !balances.data) return null;
    return maxAffordableApplauds(
      prices.data,
      token,
      balances.data[token],
      freeNuaE8s,
      APPLAUD_CAP,
    );
  }, [priceState, balances.data, prices.data, token, freeNuaE8s]);

  // Hide Max when it would pick an amount below the minimum (NIC-568). "Max 0"
  // stays as it was: it picks no amount, so nothing gets refused.
  const shownMax =
    maxApplauds !== null &&
    maxApplauds > 0 &&
    minApplauds !== null &&
    maxApplauds < minApplauds
      ? null
      : maxApplauds;

  // The single status/cost line under the amount input. First match wins.
  const costLine = useMemo(() => {
    if (token !== "NUA" && priceState === "loading") {
      return { text: fmt(c.priceLoading, { token }), tone: "muted" as const };
    }
    if (token !== "NUA" && priceState === "unavailable") {
      return { text: fmt(c.pricePaused, { token }), tone: "muted" as const };
    }
    if (amount > 0 && minApplauds !== null && amount < minApplauds) {
      return {
        text: fmt(c.tooSmall, { token, min: String(minApplauds) }),
        tone: "error" as const,
      };
    }
    if (plan) {
      const template = plan.feeE8s === TOKENS[token].fee ? c.sendLine : c.sendLineFees;
      return {
        text: fmt(template, {
          amount: formatExactE8s(plan.amountE8s),
          fee: formatExactE8s(plan.feeE8s),
          token,
        }),
        tone: "muted" as const,
      };
    }
    return null;
  }, [token, priceState, amount, minApplauds, plan, c]);

  const valid = terms && plan !== null && plan.affordable;

  const submit = () => {
    setError(null);
    if (!plan) return;
    if (token !== "NUA" && Date.now() - prices.dataUpdatedAt > NUA_PRICES_STALE_MS) {
      // The quote on screen may be stale -- refresh it instead of sending a
      // number that no longer matches the market. The line switches to
      // "Getting the price..." while this runs; the reader presses Applaud
      // again once the refreshed amount is showing.
      void prices.refetch();
      return;
    }
    tip.mutate(plan, {
      onSuccess: () => setDone(true),
      onError: (e) => setError(e.message),
    });
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
                value={
                  balances.data
                    ? formatAmount(balances.data[s], {
                        displayDecimals: TOKENS[s].displayDecimals,
                      })
                    : "—"
                }
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
            {shownMax !== null && (
              <button
                type="button"
                onClick={() => setAmount(shownMax)}
                className="text-label font-medium text-brand-purple"
              >
                {c.maxLabel.replace("{max}", String(shownMax))}
              </button>
            )}
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
          {costLine && (
            <p
              className={`text-label ${costLine.tone === "error" ? "text-error" : "text-ink-60"}`}
            >
              {costLine.text}
            </p>
          )}
          {plan && !plan.affordable && (
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
