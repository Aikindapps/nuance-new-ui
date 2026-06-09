import { walletCopy } from "../../../constants/copy";
import { useModal } from "../../../services/modal";
import { IconDeposit } from "../../../components/ui/icons/IconDeposit";
import { IconWithdraw } from "../../../components/ui/icons/IconWithdraw";
import { DepositModal, DEPOSIT_TITLE_ID } from "../deposit/DepositModal";

// Wallet intro (Figma 1:46392). Deposit is active (read-only address view —
// decision #42 update). Withdraw stays deferred — INERT_ARIA "Coming soon",
// matching the article ActionBar stub convention.
const INERT = { "aria-disabled": true as const, title: walletCopy.comingSoon };

export function WalletIntro() {
  const modal = useModal();

  const openDeposit = () =>
    modal.open(<DepositModal onClose={modal.close} />, {
      ariaLabelledBy: DEPOSIT_TITLE_ID,
    });

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className="flex flex-col gap-[calc(8*var(--fpx))] text-ink-80">
        <h1 className="text-lg font-bold text-ink-80">{walletCopy.introHeading}</h1>
        <p className="text-label leading-[var(--text-label--line-height)]">
          {walletCopy.introBody}
        </p>
      </div>
      <div className="flex items-center gap-[calc(16*var(--fpx))]">
        <button
          type="button"
          onClick={openDeposit}
          className="flex h-[calc(48*var(--fpx))] flex-1 items-center justify-center gap-[calc(8*var(--fpx))] rounded-card border border-brand-purple bg-white text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
        >
          <IconDeposit className="size-[calc(24*var(--fpx))]" />
          {walletCopy.depositLabel}
        </button>
        <button
          type="button"
          {...INERT}
          className="bg-brand-gradient-button flex h-[calc(48*var(--fpx))] flex-1 cursor-not-allowed items-center justify-center gap-[calc(8*var(--fpx))] rounded-card text-body font-medium text-white shadow-purple-glow-medium"
        >
          <IconWithdraw className="size-[calc(24*var(--fpx))]" />
          {walletCopy.withdrawLabel}
        </button>
      </div>
    </section>
  );
}
