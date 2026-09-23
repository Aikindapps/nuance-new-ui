// Phone-only copy for PremiumMintSheet (bottom sheet, <1024px).
// Feature-local, same precedent as myArticlesMobileCopy.ts /
// homeMobileCopy.ts -- src/constants/copy.ts is not touched. Strings
// are taken verbatim off the Figma frames (2483:3290 / 2484:6252 /
// 2485:6252).
export const premiumMintSheetCopy = {
  heading: "Limited-edition NFT",
  subHeading:
    "Set how many keys to make available and the price per key.",
  keysLabel: "Number of keys",
  keysInfo: "How many keys of this article to make available.",
  keysPlaceholder: "e.g. 100",
  keysUnit: "keys",
  priceLabel: "Price per key",
  priceInfo: "What each key costs. Paid in ICP.",
  pricePlaceholder: "e.g. 0,5",
  priceUnit: "ICP",
  conversionPrefix: "=",
  ckbtcUnit: "ckBTC",
  nuaUnit: "NUA",
  conversionPlaceholder: "\u2014",
  priceMustBePositive: "Price must be greater than 0.",
  priceBelowMinimum: "Price must be at least 0.001 ICP.",
  keysBelowMinimum: "Enter at least {min} keys.",
  back: "Back",
  publish: "Publish",
};
