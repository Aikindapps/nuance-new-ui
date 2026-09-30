import { useEffect } from "react";
import { writeArticleCopy } from "../../../constants/copy";
import { IconUndo } from "../../../components/ui/icons/IconUndo";
import { IconRedo } from "../../../components/ui/icons/IconRedo";
import { IconOptions } from "../../../components/ui/icons/IconOptions";
import { editorMobileCopy } from "./editorMobileCopy";

// Phone floating action pill (NIC-539, Figma 2676:6222): Undo, Redo, More
// (three dots) and Continue. Preview and Save live in the More sheet; there
// is no SEO control (D-32). Buttons follow desktop: always enabled except
// Continue while a save is in flight.
//  - placement "page": fixed 24 above the bottom edge, 16 side inset, at most
//    361 wide. While it is on the page, toasts sit 16 above it
//    (--toast-bottom, read by ToastProvider).
//  - placement "raised": in flow, drawn above the open More sheet with More
//    highlighted (Figma 2681:3278).
//  - disabled: the loading state (Figma 2683:3283), faded, nothing tappable.
const TOAST_BOTTOM = "calc(104 * var(--fpx))"; // 24 + 64 + 16

const ICON_BUTTON =
  "flex size-[calc(48*var(--fpx))] shrink-0 items-center justify-center rounded-[calc(8*var(--fpx))] text-white transition-colors";

export function MobileActionBar({
  placement = "page",
  onUndo,
  onRedo,
  onMore,
  moreOpen = false,
  onContinue,
  saving = false,
  disabled = false,
}: {
  placement?: "page" | "raised";
  onUndo: () => void;
  onRedo: () => void;
  onMore: () => void;
  moreOpen?: boolean;
  onContinue: () => void;
  saving?: boolean;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (placement !== "page") return;
    const root = document.documentElement;
    root.style.setProperty("--toast-bottom", TOAST_BOTTOM);
    return () => {
      root.style.removeProperty("--toast-bottom");
    };
  }, [placement]);

  const c = writeArticleCopy.actionBar;
  const position =
    placement === "page"
      ? "fixed inset-x-[calc(16*var(--fpx))] bottom-[calc(24*var(--fpx))] z-40 mx-auto"
      : "relative mx-auto w-full";
  const hover = disabled ? "" : "hover:bg-white/10";
  return (
    <div
      className={`bg-brand-gradient ${position} flex h-[calc(64*var(--fpx))] max-w-[calc(361*var(--fpx))] items-center gap-[calc(4*var(--fpx))] rounded-[calc(24*var(--fpx))] p-[calc(8*var(--fpx))] shadow-purple-glow-medium ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onUndo}
        disabled={disabled}
        aria-label={c.undo}
        className={`${ICON_BUTTON} ${hover}`}
      >
        <IconUndo className="h-[calc(12*var(--fpx))] w-[calc(20*var(--fpx))]" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={disabled}
        aria-label={c.redo}
        className={`${ICON_BUTTON} ${hover}`}
      >
        <IconRedo className="h-[calc(12*var(--fpx))] w-[calc(20*var(--fpx))]" />
      </button>
      <button
        type="button"
        onClick={onMore}
        disabled={disabled}
        aria-label={editorMobileCopy.more}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        className={`${ICON_BUTTON} ${moreOpen ? "bg-white/16" : hover}`}
      >
        <IconOptions className="size-[calc(24*var(--fpx))]" />
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || saving}
        className={`ml-auto flex h-[calc(48*var(--fpx))] w-[calc(112*var(--fpx))] shrink-0 items-center justify-center rounded-[calc(8*var(--fpx))] bg-white text-[length:calc(18*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-brand-purple transition-opacity ${
          disabled ? "" : "hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {c.continue}
      </button>
    </div>
  );
}
