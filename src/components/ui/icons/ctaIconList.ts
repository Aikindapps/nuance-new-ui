// NIC-378 §6.6 — ordered CTA icon name list + type.
// Lives in a plain .ts module so CtaIcon.tsx can satisfy
// react-refresh/only-export-components (no non-component co-exports).

export const CTA_ICONS = [
  "heart",
  "star",
  "pencil",
  "bell",
  "book",
  "envelope",
  "comment",
  "coffee",
] as const;

export type CtaIconName = (typeof CTA_ICONS)[number];
