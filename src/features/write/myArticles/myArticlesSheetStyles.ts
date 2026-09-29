// Bottom-sheet chrome shared by the filter sheet (Figma 2862:3278) and the
// row action sheet (Figma 2299:9770), in design pixels so it scales with the
// rest of the phone layout (NIC-575). At 393: handle 16 from the top and 20
// below, 24 side inset on the header / rows / Cancel, full-width dividers,
// row pitch 64 including the divider (1 + 17 + 28 + 18), Cancel 48 tall
// including its border with 16 above and 32 below, no panel shadow.
export const SHEET_PANEL_CLASS =
  "relative flex flex-col rounded-t-[calc(16*var(--fpx))] bg-white " +
  "pb-[calc(32*var(--fpx))] pt-[calc(16*var(--fpx))]";
export const SHEET_HANDLE_CLASS =
  "mx-auto mb-[calc(20*var(--fpx))] h-1 w-10 rounded-full bg-ink-border/20";
export const SHEET_ROW_CLASS =
  "flex items-center border-t border-ink-border/10 " +
  "px-[calc(24*var(--fpx))] pb-[calc(18*var(--fpx))] pt-[calc(17*var(--fpx))] " +
  "text-body font-medium";
export const SHEET_CANCEL_CLASS =
  "mx-[calc(24*var(--fpx))] mt-[calc(16*var(--fpx))] flex h-[calc(48*var(--fpx))] " +
  "items-center justify-center rounded-[calc(8*var(--fpx))] border border-brand-purple " +
  "text-body font-medium text-brand-purple";
