// 16-design-px inline spinner for busy buttons (Add member "Adding…", the
// ConfirmDialog "Removing…"). currentColor = the button's text colour.
export function ButtonSpinner() {
  return (
    <svg
      className="size-[calc(16*var(--fpx))] animate-spin"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
