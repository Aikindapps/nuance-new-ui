import { useRef, type PointerEvent, type ReactNode } from "react";

// Phone bottom sheet for the Subscribe flow (NIC-626; Figma component set
// "NUR / Subscribe sheet (phone)" 3054:68659, phone frames 3057:6034 ff.).
// Rendered inside the modal service's Dialog (same as PremiumMintSheet), so
// the Dialog supplies the backdrop, focus trap and scroll lock; this owns
// only the sheet itself.
//
// - White panel, 16 top corners, 16 above the 36x4 handle, 20 handle to
//   title, 24 sides, 24 below the buttons.
// - At most the screen height minus 36; the content between the handle and
//   the buttons scrolls on short screens, the buttons stay in view.
// - Closes by tapping the handle, swiping it down or tapping the scrim; no
//   close X. While `dismissable` is false (payment or checkout in progress)
//   all three are ignored.

// How far the handle must be pulled down before letting go closes the sheet.
const DISMISS_DRAG_PX = 80;

type SubscribeSheetProps = {
  titleId: string;
  title: string;
  dismissable: boolean;
  onDismiss: () => void;
  closeAriaLabel: string;
  // Drawn above the title (the success illustration, frame 3063:6950).
  hero?: ReactNode;
  // Stacked full-width buttons, primary first (pinned under the content).
  footer?: ReactNode;
  children: ReactNode;
};

export function SubscribeSheet({
  titleId,
  title,
  dismissable,
  onDismiss,
  closeAriaLabel,
  hero,
  footer,
  children,
}: SubscribeSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startY: number; dy: number } | null>(null);
  const dragged = useRef(false);

  const setOffset = (dy: number, animate: boolean) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 200ms ease-out" : "none";
    el.style.transform = dy > 0 ? `translateY(${dy}px)` : "";
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dismissable) return;
    drag.current = { id: e.pointerId, startY: e.clientY, dy: 0 };
    dragged.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    if (d.dy > 4) dragged.current = true;
    setOffset(d.dy, false);
  };

  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (dismissable && d.dy > DISMISS_DRAG_PX) {
      onDismiss();
      return;
    }
    setOffset(0, true);
  };

  // A tap (or Enter/Space) on the handle closes; the click that ends a drag
  // does not (the drag already decided).
  const onHandleClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (dismissable) onDismiss();
  };

  return (
    <>
      {/* Scrim tap target over the page above the sheet. */}
      <div
        aria-hidden
        data-testid="subscribe-sheet-scrim"
        className="fixed inset-0"
        onClick={dismissable ? onDismiss : undefined}
      />
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 flex max-h-[calc(100dvh-36px)] flex-col rounded-t-[calc(16*var(--fpx))] bg-white"
      >
        <button
          type="button"
          aria-label={closeAriaLabel}
          disabled={!dismissable}
          onClick={onHandleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="flex h-[calc(40*var(--fpx))] w-full shrink-0 touch-none justify-center pt-[calc(16*var(--fpx))] outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-purple"
        >
          <span
            aria-hidden
            className="h-[calc(4*var(--fpx))] w-[calc(36*var(--fpx))] rounded-[calc(2*var(--fpx))] bg-ink-border/20"
          />
        </button>
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-6 ${footer ? "" : "pb-6"}`}
        >
          {hero && <div className="mb-4 flex justify-center">{hero}</div>}
          <h2 id={titleId} className="text-body font-bold text-ink">
            {title}
          </h2>
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-col gap-3 px-6 pb-6 pt-6">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
