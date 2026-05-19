import IconButton from "@mui/material/IconButton";
import type { ReactNode } from "react";
import { IconClose } from "./icons/IconClose";

// Shared chrome for Modal-service popups (decision #30, PR #6 Phase 1).
//
// Extracted from the hand-rolled container LoginModal shipped in PR #3 —
// the white 696px card, the 24px radius, the responsive padding, and the
// title + close-X header row. The three modal consumers (LoginModal,
// RegisterModal, TopicsModal) all map to Figma's `NUR / Popup` component,
// so the chrome lives in one place.
//
// The body is `children`; consumers own their internal spacing (Figma lays
// popup bodies out with absolute positioning — we reproduce it with flex
// flow, which is more robust to content changes). `footer`, when provided,
// is the right-aligned button row at the bottom of the Register/Topics
// popups; LoginModal has no footer (its buttons live in the body stack).

type PopupProps = {
  // DOM id wired to the Modal service's aria-labelledby. The consumer owns
  // the constant so its open() callers can pass the same id.
  titleId: string;
  title: string;
  onClose: () => void;
  closeAriaLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Popup({
  titleId,
  title,
  onClose,
  closeAriaLabel,
  children,
  footer,
}: PopupProps) {
  return (
    <div className="w-[696px] max-w-[calc(100vw-32px)] rounded-modal bg-white px-6 py-8 md:px-12 md:py-10">
      {/* Header row: title + close (Figma layer "Header" inside NUR / Popup) */}
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-title-md font-bold text-ink">
          {title}
        </h2>
        <IconButton
          onClick={onClose}
          aria-label={closeAriaLabel}
          sx={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-card)",
            color: "var(--color-brand-purple)",
            "&:hover": { backgroundColor: "rgba(84, 5, 212, 0.08)" },
          }}
        >
          <IconClose className="size-6" />
        </IconButton>
      </div>

      {children}

      {/* Footer button row — right-aligned, 8px gap (Figma "Buttons" layer) */}
      {footer && (
        <div className="mt-8 flex items-center justify-end gap-2">{footer}</div>
      )}
    </div>
  );
}
