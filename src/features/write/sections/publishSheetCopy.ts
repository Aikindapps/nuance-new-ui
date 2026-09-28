// Publish sheet toasts (NIC-412 phone bottom sheet). ASCII-only module -
// use " - " for an em-dash, never the typographic glyph. Read off frames
// 2673:6205 (success) / 2673:6449 (error + Retry). Do NOT edit
// src/constants/copy.ts from here - the Mint success path keeps using
// C.toasts.published unchanged (decision D-24).
export const publishSheetCopy = {
  publishedToast: "Your article has been published",
  publishFailedToast: "Couldn't publish.",
  retry: "Retry",
} as const;
