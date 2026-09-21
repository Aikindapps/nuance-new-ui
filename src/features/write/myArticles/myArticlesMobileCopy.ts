// Mobile-only copy additions for the My Articles 393px mobile list.
// Reuses keys from myArticlesCopy (src/constants/copy.ts) for anything
// already defined there; only net-new strings live here.
export const myArticlesMobileCopy = {
  // aria-label on the kebab (vertical 3-dot) overflow button in each card row.
  kebabAriaLabel: "Article options",
  // Action sheet row labels.
  viewArticle: "View article",
  // Filter status button label (secondary button above the card list).
  filterStatusLabel: "Filter status",
  // Sort button label (secondary button, visual-only placeholder).
  sortLabel: "Sort",
  // Filter sheet title and option labels.
  filterSheetTitle: "Filter by status",
  filterAll: "All",
  filterPublished: "Published",
  filterDrafts: "Drafts",
  // Empty-state CTA for the all-tab when no articles exist.
  writeFirst: "Write your first article",
  // Article count line below the page heading.
  articlesCount: (n: number): string => `${n} article${n === 1 ? "" : "s"}`,
  // Error state strings.
  errorTitle: "Something went wrong",
  errorBody: "We couldn't load your articles.",
  tryAgain: "Try again",
  // Cancel label for the action sheet and filter sheet.
  cancelLabel: "Cancel",
  // aria-label for closing the action sheet.
  closeSheetAriaLabel: "Close article menu",
  // aria-label for closing the filter sheet.
  closeFilterAriaLabel: "Close filter menu",
  // Published status label shown in the action sheet meta line.
  published: "Published",
};
