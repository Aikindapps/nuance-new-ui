type Props = { className?: string };

// NUR / Icon / Key -- key glyph for the desktop "View keys sold" button.
// Same geometry as the module-private SheetKeyIcon in
// MyArticlesActionSheet.tsx.
export function IconKey({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M11 12 18.5 4.5M18.5 4.5 21 7M18.5 4.5 16 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
