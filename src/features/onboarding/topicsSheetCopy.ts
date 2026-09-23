// Phone-only copy for TopicsSheet (full-screen sheet, <1024px).
// Feature-local, same precedent as premiumMintSheetCopy.ts --
// src/constants/copy.ts is not touched. Strings are taken verbatim
// off the Figma frames (2410:3371 / 2415:3087 / 2417:3151 /
// 2418:3215).

export const MIN_TOPICS = 3;

export const topicsSheetCopy = {
  helperMin: "Select at least 3 topics",
  helperCountOne: "1 topic selected",
  helperCountMany: "{n} topics selected",
  validationMin: "Choose at least 3 topics to continue.",
  busyLabel: "Getting started\u2026",
};
