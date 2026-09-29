type Props = { className?: string };

// "NUR / Illustration / Load error" (Figma node 2005:2830). Kit component,
// bounds 108.75x87: an 87x87 light-blue backing square centred horizontally
// (10.875 clear on each side) with a white list card (three content-row
// bars) drawn inside it, and an alert badge ("!") on the card's
// bottom-right corner (also inside the square). Positions per NIC-563
// measurements. Decorative -- colours are fixed kit values (not
// currentColor), per Dana's kit notes: light-blue backing #F3F7FF, thin
// #202123 line-art.
export function KitIllustrationLoadError({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 108.75 87"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Background [RECTANGLE] 87x87 r12 */}
      <rect x="10.875" y="0" width="87" height="87" rx="12" fill="#F3F7FF" />

      {/* List card [RECTANGLE] 72x60 */}
      <rect
        x="18.375"
        y="13.5"
        width="72"
        height="60"
        rx="8"
        fill="#FFFFFF"
        stroke="#202123"
        strokeWidth="1"
      />

      {/* Content row 1/2/3 [RECTANGLE] */}
      <rect x="30.375" y="28" width="48" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      <rect x="30.375" y="42" width="40" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      <rect x="30.375" y="56" width="44" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />

      {/* Alert badge [ELLIPSE] 26x26 */}
      <circle cx="83" cy="69" r="13" fill="#FFFFFF" stroke="#202123" strokeWidth="1.5" />
      {/* Bang bar [RECTANGLE] 1.6x9 */}
      <rect x="82.2" y="62" width="1.6" height="9" rx="0.8" fill="#202123" />
      {/* Bang dot [ELLIPSE] 2.6x2.6 */}
      <circle cx="83" cy="74.7" r="1.3" fill="#202123" />
    </svg>
  );
}
