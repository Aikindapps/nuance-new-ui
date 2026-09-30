import { useEffect, useId, type ReactNode } from "react";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import { editorMobileCopy } from "./editorMobileCopy";

// Phone bottom sheet chrome for the Write editor (NIC-539): the Insert block
// sheet (Figma 2679:6263) and the More sheet (Figma 2681:3278). Scrim ink
// 40% (tap closes), white panel with 16 top corners and no shadow, a 36x4
// handle, an 18/28 bold title, 52-high rows with a hairline under every row
// but the last, and an outlined Cancel. Escape closes too. `above` is drawn
// over the scrim just above the panel (the More sheet lifts the action pill
// there). Inner spacing per the frames (NIC-589): 16 above the handle, 20
// handle to title, 2 title to rows, 6 last row to Cancel, 24 below Cancel
// (Insert block 512 tall, More 252).
export function EditorBottomSheet({
  title,
  onClose,
  above,
  children,
}: {
  title: string;
  onClose: () => void;
  above?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div aria-hidden className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <FocusTrap open>
        <div tabIndex={-1} className="relative flex flex-col outline-none">
          {above}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex flex-col rounded-t-[calc(16*var(--fpx))] bg-white pb-[calc(24*var(--fpx))] pt-[calc(16*var(--fpx))]"
          >
            <div
              aria-hidden
              className="mx-auto h-[calc(4*var(--fpx))] w-[calc(36*var(--fpx))] rounded-[calc(2*var(--fpx))] bg-ink-border/20"
            />
            <h2
              id={titleId}
              className="mt-[calc(20*var(--fpx))] px-[calc(24*var(--fpx))] text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink"
            >
              {title}
            </h2>
            <ul className="mt-[calc(2*var(--fpx))] flex flex-col">{children}</ul>
            <button
              type="button"
              onClick={onClose}
              className="mx-[calc(24*var(--fpx))] mt-[calc(6*var(--fpx))] flex h-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] border border-brand-purple bg-white text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-brand-purple"
            >
              {editorMobileCopy.cancel}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

// One sheet row: 24 icon (ink-border 60%) + 18/28 medium label, 52 high
// including its bottom hairline; the last row has no hairline.
export function EditorSheetRow({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <li className="h-[calc(52*var(--fpx))] border-b border-ink-border/10 last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex size-full items-center gap-[calc(12*var(--fpx))] px-[calc(24*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-ink disabled:opacity-50"
      >
        <span aria-hidden className="flex size-[calc(24*var(--fpx))] shrink-0 items-center justify-center text-ink-border/60">
          {icon}
        </span>
        {label}
      </button>
    </li>
  );
}
