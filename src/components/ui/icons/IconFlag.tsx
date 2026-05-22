type Props = { className?: string };

// NUR / Icon / Flag — Figma master 108:972 (asset path 219:851).
// Stroke-based glyph; stroke currentColor, no inline opacity (consumer drives
// dim/active state via text colour classes).
export function IconFlag({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 15.3333 18.6667"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M1 11.8333C1 11.8333 1.83333 11 4.33333 11C6.83333 11 8.5 12.6667 11 12.6667C13.5 12.6667 14.3333 11.8333 14.3333 11.8333V1.83333C14.3333 1.83333 13.5 2.66667 11 2.66667C8.5 2.66667 6.83333 1 4.33333 1C1.83333 1 1 1.83333 1 1.83333V11.8333ZM1 11.8333V17.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
