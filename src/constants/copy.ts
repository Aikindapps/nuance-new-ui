// Centralized user-facing copy per decision #21. Components import named
// exports from here so non-engineers can edit headlines without touching
// JSX, and so future i18n requires no refactor.

// Metadata keys. The logged-out home serves "popular" and "new"; the
// logged-in home also serves "following". A given URL reuses the same entry
// regardless of auth state — anon and authed `/` both use `popular`, `/new`
// both use `new` (decision #29).
type HomeMetaKey = "popular" | "new" | "following";

export const homeMetadata: Record<
  HomeMetaKey,
  { title: string; description: string; h1: string }
> = {
  popular: {
    title: "Nuance — Popular articles",
    description:
      "Discover popular articles from writers on Nuance, the on-chain blogging platform. Read the best stories on crypto, DAOs, Web3, and more.",
    h1: "Popular articles on Nuance",
  },
  new: {
    title: "Nuance — New articles",
    description:
      "The latest articles from writers on Nuance, the on-chain blogging platform. Fresh stories on crypto, DAOs, Web3, and more.",
    h1: "New articles on Nuance",
  },
  following: {
    title: "Nuance — From the writers, publications and topics you follow",
    description:
      "Articles from the writers, publications and topics you follow on Nuance, the on-chain blogging platform.",
    h1: "Articles from the writers, publications and topics you follow on Nuance",
  },
};

export const homeStatus = {
  loadingMore: "Loading more articles…",
  scrollForMore: "Scroll for more",
  allCaughtUp: "You’re all caught up.",
  errorTitle: "Couldn’t load articles right now.",
  errorBody: "Something went wrong talking to the Nuance canisters.",
  emptyTitle: "No articles yet.",
  emptyBody: "Be the first to publish something worth reading.",
  loadingSrLabel: "Loading articles…",
};

export const heroCopy = {
  topicsHeading: "Topics that might interest you:",
  exploreAllLabel: "Explore all topics",
  fallbackTopics: [
    "Crypto",
    "DAO",
    "Digital",
    "Trading",
    "Logistics",
    "Education",
    "Investing",
    "Web 3.0",
  ],
};

export const popularWritersCopy = {
  heading: "Popular writers you might like",
};

export const popularPublicationsCopy = {
  heading: "Popular publications you might like",
  viewAllLabel: "View all publications",
};

export const ctaBannerCopy = {
  heading: "Join the on-chain blogging revolution!",
  body: "Nuance is a blockchain blog platform empowering writers all over the world. Become a writer and share your knowledge unlimited!",
  primary: "Get started",
  secondary: "Login",
};

export const headerCopy = {
  homeAriaLabel: "Nuance home",
  navDiscover: "Discover",
  searchAriaLabel: "Search",
  searchSubmitAriaLabel: "Submit search",
  searchInputAriaLabel: "Search Nuance",
  searchPlaceholder: "Search",
  login: "Login",
  getStarted: "Get started",
  // Logged-in-only header copy (Figma 1:50116).
  startWriting: "Start writing",
  notificationsAriaLabel: "Notifications",
  openMenuAriaLabel: "Open menu",
  userMenuAriaLabel: "Account menu",
  myArticles: "My articles",
  logout: "Logout",
};

// Mobile nav drawer (NIC-66). Reuses many headerCopy strings; new strings
// live here to avoid cluttering headerCopy.
export const navDrawerCopy = {
  closeMenuAriaLabel: "Close menu",
  navAboutNuance: "About Nuance",
  aboutUrl: "https://wiki.nuance.xyz",
  navHome: "Home",
  navPopular: "Popular",
  navFollowing: "Following",
  navNew: "New",
  navWallet: "Wallet",
  // Re-exported from headerCopy shape for convenience in the drawer component.
  navDiscover: "Discover",
  getStarted: "Get started",
  login: "Login",
  startWriting: "Start writing",
  myArticles: "My articles",
  notifications: "Notifications",
  logout: "Logout",
};

// Notifications (PR #10, Figma 1:51584). The foldout + /notifications route
// share copy. The header line is depicted in the Figma; the empty state /
// view-all / route copy are invented here (the Figma is a draft and omits
// them).
export const notificationsCopy = {
  title: "Notifications",
  viewAll: "View all",
  emptyTitle: "No notifications yet",
  emptyHint: "Follow some writers or topics and updates will show up here.",
  loadMore: "Load more",
  loadingError: "Couldn't load your notifications. Try refreshing.",
  // /notifications route — Figma is silent; copy is invented for the full page.
  routeHeading: "Notifications",
  routeMetaTitle: "Notifications — Nuance",
  routeMetaDescription:
    "Recent activity from writers, publications, and topics you follow on Nuance.",
  loading: "Loading…",
};

export const homeLoggedInCopy = {
  // WelcomeBanner copy. "Welcome back" for registered users (profile fetch
  // returned a User record); "Welcome to Nuance" for unregistered principals
  // — those exist in local dev (test identities) and in any prod scenario
  // where a brand-new II principal is logging in for the first time.
  welcomeBackPrefix: "Welcome back,",
  welcomeBackSuffix: "!",
  welcomeNew: "Welcome to Nuance!",
  // WelcomeBanner second line — relative time of the PREVIOUS login (the one
  // before the current session). Omitted entirely on a first-ever login.
  lastLoginLabel: "Last login",
  // Phase 5 cold-start empty state for the Following tab.
  followingEmpty:
    "You are not yet following any writers, publications or topics. When you do, they will show up here.",
};

export const writeCtaBannerCopy = {
  heading: "Feeling inspired? Start writing!",
  primary: "Create a new article",
  primaryAriaLabel: "Create a new article",
};

export const writeArticleCopy = {
  metadata: {
    title: "Nuance — Write an article",
    description:
      "Write and publish your article on Nuance, the on-chain blogging platform.",
  },
  titlePlaceholder: "Title",
  subtitlePlaceholder: "Add a subtitle",
  bodyPlaceholder: "Start your story…",
  loadingArticle: "Loading article…",
  loadError: "This article could not be loaded for editing.",
  coverPrompt: "Drop highlighted image here or ",
  coverChooseFile: "choose file",
  statusDraft: "Draft",
  statusPublished: "Published",
  notSavedYet: "Not saved yet",
  saved: "Saved",
  unsavedChanges: "Unsaved changes",
  actionBar: {
    undo: "Undo",
    redo: "Redo",
    preview: "Preview",
    saveDraft: "Save as draft",
    saveChanges: "Save changes",
    continue: "Continue",
  },
  publish: {
    titlePublish: "Publish",
    titleDraft: "Save as draft",
    topicsLabel: "Topics",
    topicsPlaceholder: "Search topics…",
    topicsHint: "Choose 1–3 topics.",
    publishButton: "Publish",
    saveDraftButton: "Save as draft",
    cancel: "Cancel",
    closeAriaLabel: "Close",
  },
  leaveGuard: {
    title: "Leave without saving?",
    body: "You have unsaved changes. Save this as a draft before you leave?",
    saveDraft: "Save as draft",
    leave: "Leave without saving",
    closeAriaLabel: "Close",
  },
  toasts: {
    savedDraft: "Saved as draft.",
    changesSaved: "Changes saved.",
    published: "Published!",
    emptyBody: "Add some content before saving.",
    tooLong: "This article is too long to save.",
    needTopic: "Add at least one topic.",
    saveFailed: "Couldn't save. Please try again.",
    imageTooLarge: "Image is too large (max 10 MB).",
  },
  editorError: {
    title: "The editor hit a problem",
    body: "Your last autosave is safe. Reload the editor to keep writing.",
    reload: "Reload editor",
  },
  preview: {
    open: "Preview",
    close: "Close preview",
    lastModified: "Last modified",
    noContent: "Nothing to preview yet.",
  },
};

export const myArticlesCopy = {
  metadata: {
    title: "Nuance — My articles",
    description: "Manage your drafts and published articles on Nuance.",
  },
  heading: "My articles",
  newArticle: "Write a new article",
  tabs: { all: "All", published: "Published", drafts: "Drafts" },
  empty: {
    all: "You haven't written anything yet.",
    published: "No published articles yet.",
    drafts: "No drafts yet.",
  },
  loading: "Loading…",
  loadError: "Couldn't load your articles.",
  draftPill: "Draft",
  edit: "Edit",
  view: "View",
  delete: "Delete",
  deleting: "Deleting…",
  deleteConfirm: {
    title: "Delete article?",
    body: "This permanently deletes the article. This can't be undone.",
    confirm: "Delete",
    cancel: "Cancel",
    closeAriaLabel: "Close",
  },
  deleted: "Article deleted.",
  deleteFailed: "Couldn't delete. Please try again.",
};

export const loginModalCopy = {
  heading: "Join or log in",
  body: "Register or login with one of the options below to start writing or explore unlimited knowledge.",
  iiLabel: "Continue with internet identity",
  googleLabel: "Continue with Google",
  appleLabel: "Continue with Apple",
  microsoftLabel: "Continue with Microsoft",
  helpLabel: "What is internet identity?",
  helpUrl: "https://id.ai/about",
  closeAriaLabel: "Close",
};

// PR #6 onboarding flow (decision #30). RegisterModal — Figma node 1:1366.
// The avatar selector block is omitted (avatar upload deferred).
export const registerModalCopy = {
  heading: "Nice to meet you!",
  body: "Inspire a world’s generation. Start writing!",
  handleLabel: "Your @handle",
  handleLabelNote: "(cannot be changed)",
  // No leading "@" — the input renders a static "@" adornment (review m4).
  handlePlaceholder: "handle",
  displayNameLabel: "Your display name",
  displayNameLabelNote: "(can be changed)",
  displayNamePlaceholder: "Display name",
  termsPrefix: "Accept the ",
  termsLinkText: "terms and conditions",
  // Placeholder — Nuance has no dedicated terms & conditions page yet
  // (PR #6 plan, 2026-05-19). Swap in the real URL when one exists.
  termsUrl: "#",
  cancelLabel: "Cancel",
  submitLabel: "Create account",
  submittingLabel: "Creating account…",
  closeAriaLabel: "Close",
  errorFallback: "Registration failed. Please try again.",
};

// TopicsModal — Figma node 1:1519 ("What Interests You?"). Step two of the
// onboarding flow; topics are skippable ("Maybe later").
export const topicsModalCopy = {
  heading: "What Interests You?",
  body: "Choose your favorite topics to get started.",
  skipLabel: "Maybe later",
  submitLabel: "Done",
  submittingLabel: "Saving…",
  closeAriaLabel: "Close",
  loading: "Loading topics…",
  loadError: "Couldn’t load topics — you can skip this for now.",
  empty: "No topics available yet.",
  followError: "Couldn’t save your topics. Try again, or skip for now.",
  // Accessible label for the topic-picker button group (review m3).
  pickerAriaLabel: "Topics",
};

// Wallet / Funds Overview (Page 7, PR-1). Deposit/Withdraw render but are
// deferred ("Coming soon") to a later PR — see decision #42.
export const walletCopy = {
  metaTitle: "Wallet — Nuance",
  metaDescription:
    "Manage your Nuance wallet: NUA, ICP and ckBTC balances, and claim your free NUA.",
  // Intro section (Figma 1:46392).
  introHeading: "My Wallet",
  introBody:
    "Here you can manage your Nuance wallet. With the amount of tokens you can buy NFT keys that give you access to certain Nuance articles or applaud authors on their work.",
  depositLabel: "Deposit",
  withdrawLabel: "Withdraw",
  // Deposit modal (Figma §7.2: 1:46991 select page → 1:47902 QR page; upgraded
  // from the PR #12 read-only address view in PR #14). Still no transfer — the
  // QR/address only receives. Note: the Figma helper line says "create a new
  // wallet address", but the address is deterministic per principal; copy kept
  // verbatim from Figma — flag for Mr Nick if it reads as misleading.
  depositTitle: "Deposit",
  depositBodyLine1:
    "Please enter the correct currency to get the deposit address for your wallet.",
  depositBodyLine2: "Your current balance is:",
  depositSelectLabel: "Select currency to deposit",
  depositHelper: "Click on ‘Generate code’ to create a new wallet address",
  depositGenerate: "Generate code",
  depositCancel: "Cancel",
  depositScan: "Scan this code to get the deposit address",
  depositManual: "or enter this code manually",
  depositChangeCurrency: "Choose another currency",
  // ICP is addressed by its legacy account identifier; NUA/ckBTC by principal.
  depositAddressPrincipal: "Your deposit address (principal)",
  depositAddressAccountId: "Your ICP deposit address (account ID)",
  depositCopy: "Copy address",
  depositCopied: "Address copied to clipboard.",
  depositCloseAria: "Close",
  // Currency holdings (Figma 1:46399). Subtitle for the NUA/Free-NUA cards.
  nuanceToken: "Nuance token",
  balanceError: "—",
  // Free NUA tokens (Figma 1:48312).
  freeNuaHeading: "Free NUA tokens",
  freeNuaBody:
    "Free Nuance Tokens are only meant to be used on Nuance before they become refundable. 7 days after your last request, you can request a refill of free new NUA up to a total of 50 NUA.",
  // {time} → HH:MM:SS, {max} → max claimable.
  claimCountdown: "till new free tokens",
  claimReady: "Free NUA available to claim",
  // Shown in place of claimReady/claimCountdown when the user has not completed
  // DecideAI proof-of-humanity — without it, the canister rejects the claim
  // (PR #13, surfaced in PR #12 UAT). Verification lives outside this app.
  claimNeedsVerify: "Verify your account with Decide ID to claim Free NUA",
  claimLabel: "Claim {max} NUA tokens",
  claiming: "Claiming…",
  claimSuccess: "Free NUA claimed.",
  claimError: "Couldn’t claim Free NUA. Try again.",
};

// Article keys (Page 7 §7.1, Figma 1:46454 — PR #14, decision #43). Premium
// articles mint ext_v2 NFT "keys"; this block lists the caller's keys. The
// resold-key claim input is a decision #26-style inert stub — no canister
// surface exists for claim-by-code (verified against User.did + ExtV2.did).
export const articleKeysCopy = {
  heading: "Article keys",
  body: "To access premium minted articles, you’ll need a key. Here are the keys you’ve purchased.",
  // {n} → key count.
  count: "{n} article keys",
  countOne: "1 article key",
  // {n} → zero-padded key number, {total} → supply.
  keyLabel: "Key #{n} (of {total})",
  keyLabelNoSupply: "Key #{n}",
  // Fallback row label when post hydration fails.
  unknownArticle: "Premium article #{postId}",
  transferAria: "Transfer this key",
  loadError: "Couldn’t load your article keys.",
  resoldLabel: "Got a resold key? Enter the code to claim your access.",
  resoldPlaceholder: "0000 - 0000 - 0000 - 0000 - 0000",
  comingSoon: "Coming soon",
  // Transfer-key modal (prod parity: transfer-nft-modal → ext_transfer).
  transferTitle: "Transfer article key",
  transferBody:
    "Send this key to another wallet. The receiver gets this key’s access to the premium article — this wallet loses it.",
  transferReceiverLabel: "Receiver",
  transferReceiverPlaceholder: "Principal ID or account ID",
  transferErrorReceiver:
    "That doesn’t look like a valid principal ID or account ID.",
  transferErrorSelf: "That’s this wallet’s own address.",
  transferTerms:
    "I understand this sends a real, irreversible NFT transfer.",
  transferCancel: "Cancel",
  transferLabel: "Transfer key",
  transferring: "Transferring…",
  transferSuccessTitle: "Key transferred!",
  transferSuccessBody: "has been transferred to the receiver.",
  transferSuccessClose: "Done",
  closeAria: "Close",
};

// Wallet history (Page 7 §7.1, Figma 1:46484 — PR #14, decision #43). Rows
// aggregate seven client-side sources; see useWalletHistory for the list.
export const historyCopy = {
  heading: "Your wallet history",
  body: "Your wallet history, including transactions such as key purchases, applauds, and deposits.",
  colAmount: "Amount",
  colDate: "Date",
  colTarget: "For/from article",
  colDescription: "Description",
  empty: "No wallet activity yet.",
  loadError: "Couldn’t load your wallet history.",
  loading: "Loading your wallet history…",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  applaudOne: "1 Applaud",
  applaudMany: "{n} Applauds",
  // {n} → zero-padded key number, {total} → supply (same shape as articleKeys).
  keyLabel: "Key #{n} (of {total})",
  subscription: "Subscription",
  claimDescription: "Free NUA drop",
  claimSource: "Nuance.io",
  freeNuaToken: "Free NUA",
  unknownArticle: "Premium article #{postId}",
  pagePrev: "Previous page",
  pageNext: "Next page",
  pagerAria: "Wallet history pages",
};

// Withdraw modal (Page 7 §7.2, Figma 1:47170 form / 1:48066 success — PR #14,
// decision #43). Free (restricted) NUA is not withdrawable — it lives in the
// User canister's custody subaccount, so only regular ledger balances show.
export const withdrawCopy = {
  title: "Withdraw from wallet",
  bodyLine1:
    "Please select the right currency and amount that you want to withdraw from your wallet.",
  bodyLine2: "Your current balance is:",
  selectLabel: "Select currency to withdraw",
  receiverLabel: "Receiver",
  // ICP can also be addressed by the legacy 64-hex account identifier
  // (exchanges / NNS dapp) — decision #43 accepts both forms for ICP.
  receiverPlaceholder: "Principal ID",
  receiverPlaceholderIcp: "Principal ID or account ID",
  amountLabel: "Select amount",
  amountPlaceholder: "Amount",
  maxLabel: "max",
  errorReceiverInvalid: "That doesn’t look like a valid principal ID.",
  errorReceiverInvalidIcp:
    "That doesn’t look like a valid principal ID or account ID.",
  errorReceiverSelf: "That’s this wallet’s own address.",
  errorAmount: "Amount exceeds your balance minus the transfer fee.",
  terms:
    "I am aware of the general policy and agree to transfer amount of tokens.",
  cancelLabel: "Cancel",
  withdrawLabel: "Withdraw",
  withdrawing: "Withdrawing…",
  successTitle: "Withdraw successful!",
  // Success line renders as "<amount> <token> {successBody}".
  successBody: "has been successfully withdrawn from your wallet.",
  successButton: "Go to wallet",
  closeAria: "Close",
};

// Writer profile (NIC-42, /:handle).
export const writerProfileCopy = {
  metaTitleSuffix: "— Nuance",
  followersLabel: "followers",
  followingLabel: "following",
  followButtonLabel: "Follow author",
  feedLabel: "Articles by this writer",
  // {handle} → the writer's @handle
  emptyFeed: "@{handle} hasn't published anything yet.",
  notFoundHeading: "Writer not found",
  notFoundBody: "That @handle doesn't exist or is no longer on Nuance.",
  errorHeading: "Something went wrong",
  errorBody: "We couldn't load this writer's profile. Please try again.",
};

// Publication home (NIC-42, /publication/:h).
export const publicationCopy = {
  metaTitleSuffix: "— Nuance",
  allTab: "All",
  followersLabel: "followers",
  articlesLabel: "articles",
  followButtonLabel: "Follow publication",
  feedLabel: "Articles from this publication",
  // {name} → the publication's display name
  emptyFeed: "{name} hasn't published anything yet.",
  notFoundHeading: "Publication not found",
  notFoundBody: "That publication doesn't exist or is no longer on Nuance.",
  errorHeading: "Something went wrong",
  errorBody: "We couldn't load this publication. Please try again.",
};

// Manage Articles screen (NIC-40) — access-control spine + 6.1 body (NIC-63).
export const manageArticlesCopy = {
  metaTitleSuffix: "— Nuance",
  title: "Articles",
  notAuthorizedHeading: "Access restricted",
  notAuthorizedBody:
    "You need to be an editor or writer of this publication to manage its articles.",
  errorHeading: "Something went wrong",
  errorBody: "We couldn't verify your access to this publication. Please try again.",
  comingSoonHeading: "Article management is on the way",
  comingSoonBody:
    "The article list and publish controls for this publication are being built.",

  // Header actions (Increment 2 will wire these up).
  newArticle: "+ New article",
  filterStatus: "Filter status",
  sort: "Sort",

  // Table column headers.
  colLive: "Live",
  colTitle: "Title",
  colAuthor: "Author",
  colCategory: "Category",
  colPublished: "Published",
  colModified: "Modified",
  colStats: "Stats",

  // Toggle aria-labels (screen-reader context for the switch role).
  toggleAriaPublish: "Publish article",
  toggleAriaUnpublish: "Unpublish article",

  // NFT badge (display-only; non-interactive).
  nftBadge: "NFT",

  // Stats cell (disabled; NIC-57 will expand this).
  statsComingSoonAriaLabel: "Article stats — coming soon",

  // Empty state.
  emptyHeading: "No articles yet",
  emptyBody: "Create your first article to see it here.",

  // List-level error state.
  listErrorHeading: "Couldn't load articles",
  listErrorBody:
    "There was a problem fetching this publication's articles. Please try again.",
  retryLabel: "Try again",

  // Pagination.
  loadMore: "Load more",
  loadingMore: "Loading…",

  // Skeleton / loading labels.
  loadingArticles: "Loading articles…",

  // Empty-cell fallback (em dash).
  emptyCell: "—",

  // Success / error toasts for the publish toggle.
  toastPublished: "Article published.",
  toastUnpublished: "Article unpublished.",
  toastToggleError: "Failed to update publish status.",
};

// 404 catch-all (* route) and shared not-found pattern (NIC-42).
export const notFoundCopy = {
  heading: "Page not found",
  body: "The page you're looking for doesn't exist.",
  homeLabel: "Go to home",
};

// Tip Author / Applaud modal (Page 4 §4.2). No detailed Figma frame — adapted
// from prod's clap-modal flow. An applaud = 1 NUA; paid in NUA/ICP/ckBTC. The
// recipient split (writer / publication / DAO) is entirely canister-side.
export const tipModalCopy = {
  title: "Start applauding!",
  body: "By applauding this article you tip the writer a fragment of your wallet. One applaud equals one Nuance Token (NUA).",
  readMore: "Read more",
  readMoreUrl: "https://wiki.nuance.xyz/nuance/how-to-tip-applaud-a-writer",
  inWallet: "Currently in your wallet",
  selectLabel: "Pay with",
  amountLabel: "Your applaud amount",
  amountPlaceholder: "Amount",
  // {max} → the max applauds the selected balance allows.
  maxLabel: "Max {max}",
  costPrefix: "≈",
  overMax: "That’s more than your balance allows.",
  terms: "I understand this sends a real, irreversible token transfer.",
  applaudLabel: "Applaud",
  applauding: "Applauding…",
  successTitle: "Thanks for applauding!",
  successBody: "Your applause is on its way to the writer.",
  successClose: "Done",
  closeAria: "Close",
};

// NIC-41 Search Phase 1.
export const searchCopy = {
  metaTitleSuffix: "| Nuance",
  // {q} → the search query
  resultsTitle: "Results for {q}",
  // {q} → the search query
  noResults: 'No results found for \u201c{q}\u201d.',
  errorHeading: "Something went wrong",
  errorBody: "We couldn't complete your search. Please try again.",
  emptyPromptHeading: "Search Nuance",
  emptyPromptBody:
    "Search for articles, writers, publications and topics.",
  articlesTab: "Articles",
  writersTab: "Writers",
  publicationsTab: "Publications",
  topicsTab: "Topics",
  feedLabel: "Search results",
};
