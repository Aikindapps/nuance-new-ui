// NotificationsLoadError -- mobile-only error state (Figma 2304:3104).
// Centered column: illustration + heading + body + primary Try-again button.

import { notificationsCopy } from "../../constants/copy";
import { IllustrationLoadError } from "../../components/ui/icons/IllustrationLoadError";

type Props = { className?: string; onRetry: () => void };

export function NotificationsLoadError({ className = "", onRetry }: Props) {
  const c = notificationsCopy;
  return (
    <div className={`flex flex-col items-center gap-4 px-4 py-16 text-center ${className}`}>
      <IllustrationLoadError className="h-[87px] w-[109px] text-ink-60" />
      <p className="text-lg font-bold text-ink">{c.loadErrorTitle}</p>
      <p className="text-body text-ink-60">{c.loadErrorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-brand-gradient-button rounded-card px-6 py-2.5 text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90"
      >
        {c.retryLabel}
      </button>
    </div>
  );
}
