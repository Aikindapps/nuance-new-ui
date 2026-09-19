type Props = { className?: string };

// Empty-image dropzone illustration -- two stacked photos ("NoImages",
// Figma I1:42239;127:1455, ~108.75x87). Decorative; colour comes from the
// parent's text colour (currentColor).
export function IllustrationNoImages({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 109 87"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="6" y="6" width="82" height="60" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="21" y="21" width="82" height="60" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2" />
      <circle cx="44" cy="39" r="7" fill="currentColor" fillOpacity="0.28" />
      <path d="M26 78L48 54L62 66L78 52L98 78Z" fill="currentColor" fillOpacity="0.28" />
    </svg>
  );
}
