// The "Draft" status pill in the editor breadcrumb row (Figma NUR/Tag/Status,
// node 1:149): ink-10% fill, 16/Bold ink text, rounded-8.
export function StatusTag({ label }: { label: string }) {
  return (
    <span className="rounded-[calc(8*var(--fpx))] bg-ink-border-10 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-[length:calc(16*var(--fpx))] font-bold leading-[calc(24*var(--fpx))] text-ink">
      {label}
    </span>
  );
}
