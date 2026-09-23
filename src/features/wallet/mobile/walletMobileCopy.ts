// Phone-only wallet strings (Figma 2420:4869 empty state, 2422:4900
// error state, 2423:4917 overflow "Show more"). Anything already
// covered by walletCopy / articleKeysCopy / historyCopy in
// src/constants/copy.ts is imported there instead of re-declared
// here.
export const walletMobileCopy = {
  loadErrorTitle: "Something went wrong",
  loadErrorBody: "We couldn't load your wallet.",
  retryLabel: "Try again",
  keysEmpty: "No article keys yet",
  keysEmptyBody: "Keys you buy or redeem will appear here.",
  historyEmpty: "No transactions yet",
  historyEmptyBody:
    "Your deposits, applauds and rewards will show up here.",
  showMore: "Show more",
};
