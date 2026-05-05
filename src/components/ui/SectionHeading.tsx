import type { ReactNode } from "react";

type Props = {
  id?: string;
  children: ReactNode;
  className?: string;
};

/**
 * H2 for page sections — "Popular writers you might like", etc.
 * Typography comes from the Figma `NUR / GT Walsheim / 24 Medium` spec
 * (confirmed 2026-04-22 via get_design_context on 1:51846 and 1:51860).
 */
export function SectionHeading({ id, children, className = "" }: Props) {
  return (
    <h2
      id={id}
      className={`text-title-sm font-medium text-ink-80 ${className}`.trim()}
    >
      {children}
    </h2>
  );
}
