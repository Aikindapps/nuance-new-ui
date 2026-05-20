import type { ReactNode } from "react";

// NUR / Button / Floating — a 72px round white button with a purple glow.
// Used as the rail scroll affordance (Phase 7) and the related-articles
// foldout toggle (Phase 8). The icon is passed as children so each caller
// supplies the glyph it needs.
type Props = {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function FloatingButton({
  onClick,
  ariaLabel,
  children,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex size-[calc(72*var(--fpx))] items-center justify-center rounded-full bg-white text-brand-purple shadow-[var(--shadow-purple-glow)] transition-shadow hover:shadow-[var(--shadow-purple-glow-hover)] ${className}`}
    >
      {children}
    </button>
  );
}
