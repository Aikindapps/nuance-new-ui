type Props = { className?: string };

// "NUR / Illustration / No members" (Figma node 2004:2831). Kit component,
// component bounds ~109x87: a light-blue backing square with a white
// row-tile card (avatar + name/meta bars) overlapping its top-right corner.
// Decorative -- colours are fixed kit values (not currentColor), per Dana's
// kit notes: light-blue backing #F3F7FF, thin #202123 line-art.
export function KitIllustrationNoMembers({ className = "" }: Props) {
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

      {/* Row tile (back) [RECTANGLE] 72x30 */}
      <rect
        x="19.5"
        y="9"
        width="72"
        height="30"
        rx="8"
        fill="#FFFFFF"
        stroke="#202123"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Row tile (front) [RECTANGLE] 78x34 */}
      <rect
        x="25"
        y="23"
        width="78"
        height="34"
        rx="8"
        fill="#FFFFFF"
        stroke="#202123"
        strokeWidth="1"
      />

      {/* Avatar ring [ELLIPSE] 18x18 */}
      <circle cx="44" cy="40" r="9" stroke="#202123" strokeWidth="1.5" />
      {/* Head [ELLIPSE] 6x6 */}
      <circle cx="44" cy="37" r="3" stroke="#202123" strokeWidth="1.5" />
      {/* Shoulders [VECTOR] 9x2 */}
      <path
        d="M39.5 44c1.2-2.4 3-3.6 4.5-3.6s3.3 1.2 4.5 3.6"
        stroke="#202123"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Name bar [RECTANGLE] 34x5 */}
      <rect x="58" y="34" width="34" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      {/* Meta bar [RECTANGLE] 22x4 */}
      <rect x="58" y="43" width="22" height="4" rx="2" fill="#373A49" fillOpacity="0.1" />
    </svg>
  );
}
