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
  // "Minted" tag on a minted article's row (Figma 2294:3003 "Minted badge").
  mintedTag: "Minted",
  // Action sheet row label -- first item, minted articles only (2299:9770).
  viewKeysSold: "View keys sold",

  // Keys & sales panel (read-only, Figma 2555:6058 / 6097 / 6135 / 6173).
  keysAndSales: {
    heading: "Limited-edition NFT",
    subHeading:
      "These keys are already minted. Here\u2019s the price, quantity, and how many have sold.",
    keysLabel: "Number of keys",
    keysInfo: "How many keys of this article are available.",
    keysUnit: "keys",
    soldLine: (n: number, m: number): string =>
      `${n.toLocaleString()} of ${m.toLocaleString()} keys sold`,
    soldLineLoading: "Loading sold count\u2026",
    soldLineError: "Couldn\u2019t load the sold count.",
    priceLabel: "Price per key",
    priceInfo: "What each key costs. Paid in ICP.",
    priceUnit: "ICP",
    conversionPrefix: "=",
    ckbtcUnit: "ckBTC",
    nuaUnit: "NUA",
    conversionPlaceholder: "\u2014",
    doneLabel: "Done",
    closeAriaLabel: "Close keys & sales",
  },
};
