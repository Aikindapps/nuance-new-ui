type Props = { className?: string };

// Up/down arrows glyph for the Members "Sort" button trigger (generic sort
// affordance; fill is currentColor, matching IconPlus's convention).
export function IconSort({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 4v14m0 0-3.5-3.5M8 18l3.5-3.5M16 20V6m0 0 3.5 3.5M16 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
