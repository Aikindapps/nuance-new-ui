import { useEffect, useState } from "react";
import { walletCopy } from "../../../constants/copy";
import { useToast } from "../../../services/toast";
import { fromE8s } from "../../../lib/tokenMath";
import { useMyProfile } from "../../../lib/useMyProfile";
import { useClaimInfo } from "../hooks/useClaimInfo";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import { useClaimFreeNua } from "../hooks/useClaimFreeNua";

// Mirrors src/features/wallet/sections/FreeNuaClaim.tsx (the phone
// variant is a separate file because that file cannot be safely
// edited under our diff transport).

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function trimNum(n: number): string {
  return String(Number(n.toFixed(2)));
}

const STRIP_CLASS = [
  "flex flex-col gap-4 rounded-[calc(16*var(--fpx))]",
  "border border-ink-border-10 bg-ink-border-5 px-4 py-6",
].join(" ");

const SKELETON_BAR =
  "animate-pulse rounded-[8px] bg-ink-border/10";

const BUTTON_CLASS = [
  "flex h-[calc(48*var(--fpx))] w-full items-center",
  "justify-center rounded-card border border-brand-purple",
  "text-body font-medium text-brand-purple",
  "transition-opacity disabled:cursor-not-allowed",
  "disabled:opacity-40",
].join(" ");

// Phone free-NUA claim strip (Figma 2419:4829). Desktop lays the
// countdown and the claim button out side by side; at 361px they do
// not both fit, so the strip stacks status-then-button (Figma).
export function WalletFreeNuaMobile() {
  const profile = useMyProfile();
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

  const remaining =
    claim.nextClaimAt == null ? 0 : claim.nextClaimAt - now;
  const counting = remaining > 0;

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
      onError: (err) =>
        show(err.message || walletCopy.claimError, "error"),
    });
  };

  const claimLabel = walletCopy.claimLabel.replace(
    "{max}",
    trimNum(claimable),
  );

  const headingWrapClass =
    "flex flex-col gap-[calc(8*var(--fpx))] text-ink-80";
  const bodyClass =
    "text-label leading-[var(--text-label--line-height)]";

  const loading = profile.isPending || freeNua.isPending;

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className={headingWrapClass}>
        <h2 className="text-lg font-bold text-ink-80">
          {walletCopy.freeNuaHeading}
        </h2>
        <p className={bodyClass}>{walletCopy.freeNuaBody}</p>
      </div>

      {loading ? (
        <div aria-busy="true" className={STRIP_CLASS}>
          <span
            aria-hidden
            className={`h-5 w-3/5 ${SKELETON_BAR}`}
          />
          <span
            aria-hidden
            className={`h-12 w-full ${SKELETON_BAR}`}
          />
        </div>
      ) : (
        <div className={STRIP_CLASS}>
          <p className="text-body font-medium text-ink-80">
            {claim.hasProfile && !claim.isVerified
              ? walletCopy.claimNeedsVerify
              : counting
                ? `${formatHMS(remaining)} ` +
                  walletCopy.claimCountdown
                : walletCopy.claimReady}
          </p>
          <button
            type="button"
            disabled={!canClaim}
            onClick={handleClaim}
            className={BUTTON_CLASS}
          >
            {claimMutation.isPending
              ? walletCopy.claiming
              : claimLabel}
          </button>
        </div>
      )}
    </section>
  );
}
