import { walletMobileCopy } from "./walletMobileCopy";
import {
  IllustrationLoadError,
} from "../../../components/ui/icons/IllustrationLoadError";

type Props = { onRetry: () => void };

// Phone full-page wallet error (Figma 2422:4900). Modelled on the
// shipped NotificationsLoadError, minus its px-4 (AccountShell's
// <main> already pads phone width, so adding it here would shrink
// the column).
export function WalletLoadError({ onRetry }: Props) {
  const c = walletMobileCopy;
  const illustrationClass = "h-[87px] w-[109px] text-ink-60";
  const buttonClass = [
    "bg-brand-gradient-button rounded-card px-6 py-2.5",
    "text-body font-medium text-white",
    "shadow-purple-glow-medium transition-opacity",
    "hover:opacity-90",
  ].join(" ");
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <IllustrationLoadError className={illustrationClass} />
      <p className="text-lg font-bold text-ink">{c.loadErrorTitle}</p>
      <p className="text-body text-ink-60">{c.loadErrorBody}</p>
      <button type="button" onClick={onRetry} className={buttonClass}>
        {c.retryLabel}
      </button>
    </div>
  );
}
