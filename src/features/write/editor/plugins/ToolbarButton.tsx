import type { ReactNode } from "react";

// A single icon button in the dark floating selection toolbar (Figma 1:37223).
// Active = the fluor-purple highlight; inactive = white.
export function ToolbarButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex size-[calc(32*var(--fpx))] items-center justify-center rounded-[calc(4*var(--fpx))] transition-colors hover:bg-white/10 ${
        active ? "text-brand-purple-fluor" : "text-white"
      }`}
    >
      {children}
    </button>
  );
}
