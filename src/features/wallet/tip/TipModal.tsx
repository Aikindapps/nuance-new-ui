import { useMemo, useState } from "react";
import { Popup } from "../../../components/ui/Popup";
import { tipModalCopy } from "../../../constants/copy";
import { TOKENS } from "../../../config/tokens";
import { formatAmount } from "../../../lib/tokenMath";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import {
  tipAmountE8s,
  planTip,
  maxAffordableApplauds,
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

// Tip Author modal (Page 4 sec. 4.2). Input page (applaud amount + confirm
// terms; NUA-only, D-520) -> success page. Modal content renders above
// ToastProvider, so feedback is inline (error row + success page), never a
// toast. Real funds move on submit -- there's no temporary clamp (Mr Nick self-limits during testing).
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
  const tip = useTipAuthor(postId, bucketCanisterId);

  const [amount, setAmount] = useState(0);
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = tipModalCopy;

  const freeNuaE8s = freeNua.data ?? 0n;

  // Exact e8s cost of `amount` applauds -- the same helper the transfer uses,
  // so the number on screen and the number sent can never diverge.
  const amountE8s = useMemo(
    () => (amount > 0 ? tipAmountE8s(amount) : null),
    [amount],
  );

  const plan = useMemo(() => {
    if (amountE8s == null || amountE8s <= 0n || !balances.data) return null;
    return planTip(amount, amountE8s, balances.data.NUA, freeNuaE8s);
  }, [amountE8s, balances.data, amount, freeNuaE8s]);

  // Exact max applauds the reader can afford, found the same way the plan is
  // built (so Max can never pick an amount the transfer then rejects). Hidden
  // (button not rendered) while balances are loading.
  const maxApplauds = useMemo(() => {
    if (!balances.data) return null;
    return maxAffordableApplauds(balances.data.NUA, freeNuaE8s, APPLAUD_CAP);
  }, [balances.data, freeNuaE8s]);

  // The cost line under the amount input: the "You send ..." line built from
  // the plan, or nothing when there is no plan.
  const costLine = useMemo(() => {
    if (!plan) return null;
    const template = plan.feeE8s === TOKENS.NUA.fee ? c.sendLine : c.sendLineFees;
    return fmt(template, {
      amount: formatExactE8s(plan.amountE8s),
      fee: formatExactE8s(plan.feeE8s),
      token: "NUA",
    });
  }, [plan, c]);

  const valid = terms && plan !== null && plan.affordable;

  const submit = () => {
    setError(null);
    if (!plan) return;
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
            <Stat
              label="NUA"
              value={
                balances.data
                  ? formatAmount(balances.data.NUA, {
                      displayDecimals: TOKENS.NUA.displayDecimals,
                    })
                  : "\u2014"
              }
            />
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-label font-medium uppercase tracking-wide text-ink-60">
              {c.amountLabel}
            </p>
            {maxApplauds !== null && (
              <button
                type="button"
                onClick={() => setAmount(maxApplauds)}
                className="text-label font-medium text-brand-purple"
              >
                {c.maxLabel.replace("{max}", String(maxApplauds))}
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
            className="rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink placeholder:text-ink-60 focus:border-brand-purple focus:outline-none"
          />
          {costLine && <p className="text-label text-ink-60">{costLine}</p>}
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
