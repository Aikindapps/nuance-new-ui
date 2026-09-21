type Props = { className?: string };

// Load-error illustration -- card with content rows and an alert badge
// (Figma NUR / Illustration / Load error, frame 2304:3104, 109x87).
// Decorative; colour comes from the parent's text colour (currentColor).
export function IllustrationLoadError({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 109 87"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="11" y="0" width="87" height="87" rx="12" fill="currentColor" fillOpacity="0.06" />
      <rect x="18.5" y="13.5" width="72" height="60" rx="8" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
      <rect x="30.5" y="27" width="48" height="5" rx="2.5" fill="currentColor" fillOpacity="0.12" />
      <rect x="30.5" y="38" width="40" height="5" rx="2.5" fill="currentColor" fillOpacity="0.12" />
      <rect x="30.5" y="49" width="44" height="5" rx="2.5" fill="currentColor" fillOpacity="0.12" />
      <circle cx="81.5" cy="64.5" r="13" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.5" />
      <rect x="80.5" y="58" width="2" height="9" rx="0.8" fill="currentColor" fillOpacity="0.75" />
      <circle cx="81.5" cy="71" r="1.5" fill="currentColor" fillOpacity="0.75" />
    </svg>
  );
}
