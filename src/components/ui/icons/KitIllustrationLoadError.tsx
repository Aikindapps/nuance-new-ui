type Props = { className?: string };

// "NUR / Illustration / Load error" (Figma node 2005:2830). Kit component,
// component bounds ~109x87: a light-blue backing square with a white list
// card (three content-row bars) and an alert badge ("!") overlapping its
// bottom-right corner. Decorative -- colours are fixed kit values (not
// currentColor), per Dana's kit notes: light-blue backing #F3F7FF, thin
// #202123 line-art.
export function KitIllustrationLoadError({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 109 87"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Background [RECTANGLE] 87x87 r12 */}
      <rect x="0" y="0" width="87" height="87" rx="12" fill="#F3F7FF" />

      {/* List card [RECTANGLE] 72x60 */}
      <rect
        x="10"
        y="14"
        width="72"
        height="60"
        rx="8"
        fill="#FFFFFF"
        stroke="#202123"
        strokeWidth="1"
      />

      {/* Content row 1/2/3 [RECTANGLE] */}
      <rect x="20" y="28" width="48" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      <rect x="20" y="40" width="40" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      <rect x="20" y="52" width="44" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />

      {/* Alert badge [ELLIPSE] 26x26 */}
      <circle cx="90" cy="68" r="13" fill="#FFFFFF" stroke="#202123" strokeWidth="1.5" />
      {/* Bang bar [RECTANGLE] 2x9 */}
      <rect x="89" y="61" width="2" height="9" rx="0.8" fill="#202123" />
      {/* Bang dot [ELLIPSE] 3x3 */}
      <circle cx="90" cy="74" r="1.5" fill="#202123" />
    </svg>
  );
}
