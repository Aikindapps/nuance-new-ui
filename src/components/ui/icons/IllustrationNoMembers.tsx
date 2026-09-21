type Props = { className?: string };

// No-members illustration -- two stacked row-tile cards on a background square,
// approximating Figma "NUR / Illustration / No members" (frame 2319:3003, 175x140).
// Decorative; colour comes from the parent text colour (currentColor).
export function IllustrationNoMembers({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 175 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* background square */}
      <rect x="44" y="26" width="87" height="87" rx="12" fill="currentColor" fillOpacity="0.06" />
      {/* back row tile */}
      <rect x="51.5" y="38" width="72" height="30" rx="8" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
      {/* avatar placeholder inside back tile */}
      <circle cx="68" cy="53" r="8" fill="currentColor" fillOpacity="0.08" />
      {/* name bar inside back tile */}
      <rect x="82" y="49" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="82" y="56" width="22" height="4" rx="2" fill="currentColor" fillOpacity="0.10" />
      {/* front row tile (slightly larger, fully opaque stroke) */}
      <rect x="48.5" y="56" width="78" height="34" rx="8" fill="white" fillOpacity="0.9" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1" />
      {/* avatar placeholder inside front tile */}
      <circle cx="66" cy="73" r="9" fill="currentColor" fillOpacity="0.08" />
      {/* name bar inside front tile */}
      <rect x="82" y="68" width="32" height="4" rx="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="82" y="76" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.10" />
      {/* no-member indicator -- small circle with dash */}
      <circle cx="122" cy="100" r="13" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <rect x="116.5" y="99" width="11" height="2" rx="0.8" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
}
