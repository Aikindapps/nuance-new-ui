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
  closeAriaLabel: "Close notifications",
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
