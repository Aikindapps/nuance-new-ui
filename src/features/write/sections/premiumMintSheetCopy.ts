// Copy for the limited-edition NFT mint setup at BOTH widths:
// PremiumMintSheet (phone bottom sheet, <1024px) and PremiumMintStep
// (desktop step inside the Publish view). One string set; the desktop
// canonical frames (2724:3290 / 2726:6320 / 2727:6384) were aligned to
// it. Feature-local, same precedent as myArticlesMobileCopy.ts /
// homeMobileCopy.ts. Strings are taken from the Figma frames
// (2483:3290 / 2484:6252 / 2485:6252), with pricePlaceholder corrected
// to match the field's accepted decimal format (dot, not comma).
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
  pricePlaceholder: "e.g. 0.5",
  priceUnit: "ICP",
  conversionPrefix: "\u2248",
  usdUnit: "USD",
  conversionPlaceholder: "\u2014",
  priceMustBePositive: "Price must be greater than 0.",
  priceBelowMinimum: "Price must be at least 0.001 ICP.",
  keysBelowMinimum: "Enter at least {min} keys.",
  back: "Back",
  publish: "Publish",
  pictureLabel: "Picture to be minted",
  pictureAlt: "Preview of the NFT picture",
  termsLabel: "I accept the terms and conditions",
};
