// Centralized user-facing copy per decision #21. Components import named
// exports from here so non-engineers can edit headlines without touching
// JSX, and so future i18n requires no refactor.

type HomeVariant = "popular" | "new";

export const homeMetadata: Record<
  HomeVariant,
  { title: string; description: string; h1: string }
> = {
  popular: {
    title: "Nuance — Popular articles on the blockchain",
    description:
      "Discover popular articles from writers on Nuance, the on-chain blogging platform. Read the best stories on crypto, DAOs, Web3, and more.",
    h1: "Popular articles on Nuance",
  },
  new: {
    title: "Nuance — New articles on the blockchain",
    description:
      "The latest articles from writers on Nuance, the on-chain blogging platform. Fresh stories on crypto, DAOs, Web3, and more.",
    h1: "New articles on Nuance",
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
  navAbout: "About Nuance",
  searchAriaLabel: "Search",
  searchSubmitAriaLabel: "Submit search",
  searchInputAriaLabel: "Search Nuance",
  searchPlaceholder: "Search",
  login: "Login",
  getStarted: "Get started",
  openMenuAriaLabel: "Open menu",
  userMenuAriaLabel: "Account menu",
  logout: "Logout",
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
  loadingLabel: "Signing in…",
  errorFallback: "Sign-in failed. Please try again.",
};
