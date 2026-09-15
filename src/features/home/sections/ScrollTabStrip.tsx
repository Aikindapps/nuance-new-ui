import type { ReactNode } from "react";

// Horizontal-scroll tab strip with a right-edge fade hinting more tabs on
// narrow viewports (mobile 393, NIC-326). The fade ("F-fade") is a
// white→transparent gradient over the right edge, mobile only (md:hidden),
// pointer-events-none so it never blocks a tab. Uses var(--color-surface)
// (the page background) so it blends on both the logged-in (bg-white) and
// logged-out home. Inline linear-gradient avoids Tailwind-v4 gradient-util
// naming drift.
export function ScrollTabStrip({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <nav
        aria-label={ariaLabel}
        className="scrollbar-hide flex items-center overflow-x-auto border-b border-ink-border/20"
      >
        {children}
      </nav>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-px right-0 top-0 w-12 md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to left, var(--color-surface), transparent)",
        }}
      />
    </div>
  );
}
