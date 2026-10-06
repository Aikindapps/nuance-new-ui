// Publish sheet toasts (NIC-412 phone bottom sheet). ASCII-only module -
// use " - " for an em-dash, never the typographic glyph. Read off frames
// 2673:6205 (success) / 2673:6449 (error + Retry). Do NOT edit
// src/constants/copy.ts from here - the Mint success path keeps using
// C.toasts.published unchanged (decision D-24).
export const publishSheetCopy = {
  publishedToast: "Your article has been published",
  publishFailedToast: "Couldn't publish.",
  retry: "Retry",
  // A writer submitting into a publication's review queue (NIC-413).
  // Explainer, link and heading read off frames 2308:5902 / 2307:5902;
  // the failure toast mirrors publishFailedToast.
  submitFailedToast: "Couldn't submit.",
  submitExplainer:
    "Submit this article for review in a publication. An editor will manage the article there.",
  moreOnPublications: "More on publications",
  moreOnPublicationsUrl:
    "https://wiki.nuance.xyz/nuance/publications/how-to-write-for-a-publication",
  // Phone picker: muted heading above the publication rows.
  publicationsHeading: "Publications ({count})",
} as const;
