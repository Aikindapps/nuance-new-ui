import { useState } from "react";
import { IconShare } from "../icons/IconShare";
import { SharePopover } from "./SharePopover";

// Article share affordance — Figma 4.4 (`1:18426`).
//
// Renders the trigger button in one of two visual variants matching the
// ActionBar's split:
// - `variant="desktop"` — text + icon, mirrors the DesktopBar `item` style
// - `variant="mobile"`  — icon-only, mirrors the MobileBar `iconButton` style
//
// Mobile tries `navigator.share` (the native OS share sheet) first; if it
// rejects (user cancel) or is unavailable, falls back to the popover. Desktop
// always opens the popover — the social-channel grid is the better surface
// on a pointer device and `navigator.share` desktop support is uneven.

type Variant = "desktop" | "mobile";

type Props = {
  title: string;
  url?: string;
  variant: Variant;
};

const DESKTOP_CLASSES =
  "flex h-12 items-center gap-2 rounded-card pl-5 pr-6 text-body font-medium text-white transition-colors hover:bg-white-10";

const MOBILE_CLASSES =
  "flex size-12 items-center justify-center rounded-card text-white transition-colors hover:bg-white-10";

export function ShareButton({ title, url, variant }: Props) {
  // State-backed anchor instead of useRef — the project's `react-hooks/refs`
  // lint rule rejects reading `.current` during render (lesson 2026-05-20).
  // Callback ref drives a state update; Popper re-renders when it resolves.
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const pageUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const tryNativeShare = async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    try {
      await navigator.share({ title, url: pageUrl });
      return true;
    } catch {
      // User cancelled or browser disallowed — fall through to popover.
      return false;
    }
  };

  const onClick = async () => {
    if (variant === "mobile") {
      const used = await tryNativeShare();
      if (used) return;
    }
    setOpen((prev) => !prev);
  };

  const close = () => setOpen(false);

  if (variant === "desktop") {
    return (
      <>
        <button
          ref={setAnchorEl}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={onClick}
          className={DESKTOP_CLASSES}
        >
          <IconShare className="size-6" />
          Share
        </button>
        <SharePopover
          anchorEl={anchorEl}
          open={open}
          onClose={close}
          url={pageUrl}
          title={title}
        />
      </>
    );
  }

  return (
    <>
      <button
        ref={setAnchorEl}
        type="button"
        aria-label="Share article"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onClick}
        className={MOBILE_CLASSES}
      >
        <IconShare className="size-6" />
      </button>
      <SharePopover
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        url={pageUrl}
        title={title}
      />
    </>
  );
}
