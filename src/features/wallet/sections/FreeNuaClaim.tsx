import { useEffect, useState } from "react";
import { walletCopy } from "../../../constants/copy";
import { useToast } from "../../../services/toast";
import { fromE8s } from "../../../lib/tokenMath";
import { useClaimInfo } from "../hooks/useClaimInfo";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import { useClaimFreeNua } from "../hooks/useClaimFreeNua";

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// Trim trailing zeros: 50 → "50", 14.5 → "14.5", 14.25 → "14.25".
function trimNum(n: number): string {
  return String(Number(n.toFixed(2)));
}

// Free NUA claim (Figma 1:48312): a live countdown to the next claim, plus the
// claim button. Mirrors prod's eligibility: claim active, not blocked, the
// 7-day window elapsed, and the user is not already at the max restricted
// balance. The button is faded while not claimable.
export function FreeNuaClaim() {
  const claim = useClaimInfo();
  const freeNua = useFreeNuaBalance();
  const claimMutation = useClaimFreeNua();
  const { show } = useToast();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (claim.nextClaimAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [claim.nextClaimAt]);

  const remaining = claim.nextClaimAt == null ? 0 : claim.nextClaimAt - now;
  const counting = remaining > 0;

  // The cap is a max *holding* of 50 Free NUA (the canister's 50.01 includes a
  // fee buffer — floor it for display). You can only claim the difference
  // between the cap and what you already hold (canister: maxClaimTokens −
  // restricted balance). 35 held → claim 15; 0 held → claim 50; ≥50 → none.
  const maxFree = Math.floor(claim.maxClaimable);
  const freeHeld = freeNua.data != null ? fromE8s(freeNua.data) : 0;
  const claimable = Math.max(0, maxFree - freeHeld);
  const alreadyAtMax = freeNua.data != null && claimable <= 0;

  const canClaim =
    claim.hasProfile &&
    claim.isVerified &&
    claim.isClaimActive &&
    !claim.isBlocked &&
    !counting &&
    !alreadyAtMax &&
    !claimMutation.isPending;

  const handleClaim = () => {
    claimMutation.mutate(undefined, {
      onSuccess: () => show(walletCopy.claimSuccess, "success"),
      // Surface the canister's own reason (e.g. "User is not verified. Cannot
      // claim restricted tokens.") — the claim has several preconditions our
      // client gate can't fully model (verification, daily caps, per-minute
      // lock). Fall back to the generic copy only if no message came back.
      onError: (err) => show(err.message || walletCopy.claimError, "error"),
    });
  };

  const claimLabel = walletCopy.claimLabel.replace(
    "{max}",
    trimNum(claimable),
  );

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className="flex flex-col gap-[calc(8*var(--fpx))] text-ink-80">
        <h2 className="text-lg font-bold text-ink-80">{walletCopy.freeNuaHeading}</h2>
        <p className="text-label leading-[var(--text-label--line-height)]">
          {walletCopy.freeNuaBody}
        </p>
      </div>
      <div className="flex min-h-[calc(96*var(--fpx))] items-center justify-between gap-[calc(16*var(--fpx))] rounded-[calc(16*var(--fpx))] border border-ink-border-10 bg-ink-border-5 px-[calc(40*var(--fpx))] py-[calc(24*var(--fpx))]">
        <p className="text-body font-medium text-ink-80">
          {/* hasProfile guards the unhydrated-profile state, where isVerified
              is false even for verified users (review m1). */}
          {claim.hasProfile && !claim.isVerified
            ? walletCopy.claimNeedsVerify
            : counting
              ? `${formatHMS(remaining)} ${walletCopy.claimCountdown}`
              : walletCopy.claimReady}
        </p>
        <button
          type="button"
          disabled={!canClaim}
          onClick={handleClaim}
          className="flex h-[calc(48*var(--fpx))] shrink-0 items-center justify-center rounded-card border border-brand-purple px-[calc(24*var(--fpx))] text-body font-medium text-brand-purple transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {claimMutation.isPending ? walletCopy.claiming : claimLabel}
        </button>
      </div>
    </section>
  );
}
