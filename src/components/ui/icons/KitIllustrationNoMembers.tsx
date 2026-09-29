type Props = { className?: string };

// "NUR / Illustration / No members" (Figma node 2004:2831). Kit component,
// bounds 108.75x87: an 87x87 light-blue backing square centred horizontally
// (10.875 clear on each side) with two stacked white row tiles (avatar +
// name/meta bars) drawn inside it. Positions per NIC-563 measurements.
// Decorative -- colours are fixed kit values (not currentColor), per Dana's
// kit notes: light-blue backing #F3F7FF, thin #202123 line-art.
export function KitIllustrationNoMembers({ className = "" }: Props) {
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

      {/* Row tile (back) [RECTANGLE] 72x30 */}
      <rect
        x="12"
        y="16"
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
        x="18"
        y="30"
        width="78"
        height="34"
        rx="8"
        fill="#FFFFFF"
        stroke="#202123"
        strokeWidth="1"
      />

      {/* Avatar ring [ELLIPSE] 18x18 */}
      <circle cx="35" cy="47" r="9" stroke="#202123" strokeWidth="1.5" />
      {/* Head [ELLIPSE] 6x6, filled */}
      <circle cx="35" cy="44" r="3" fill="#202123" />
      {/* Shoulders [VECTOR] 9x2.25 */}
      <path
        d="M30.5 50.75c1.2-1.5 3-2.25 4.5-2.25s3.3 0.75 4.5 2.25"
        stroke="#202123"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Name bar [RECTANGLE] 34x5 */}
      <rect x="52" y="42" width="34" height="5" rx="2.5" fill="#373A49" fillOpacity="0.1" />
      {/* Meta bar [RECTANGLE] 22x4 */}
      <rect x="52" y="51" width="22" height="4" rx="2" fill="#373A49" fillOpacity="0.1" />
    </svg>
  );
}
