type Props = { className?: string };

// Plus glyph for the editor's "+" block-insert button. A literal plus (not a
// branded NUR asset); the Figma "+" trigger is a generic plus in a tinted
// square. fill is currentColor. (Swap for a Figma asset if one is exported.)
export function IconPlus({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}
