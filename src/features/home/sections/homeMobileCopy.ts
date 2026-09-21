// Mobile-only copy for the logged-in Home phone states (NIC-420).
// Curly apostrophes use \u2019 JS escapes so the source file stays pure ASCII.
// writersHeading / publicationsHeading: the Default frame (2315:7908) shows
// "Popular writers" / "Popular publications" -- shorter than the desktop copy
// ("Popular writers you might like" / "Popular publications you might like").
// Both keys are present so PopularWriters and PopularPublications can render
// a phone-only shorter heading.
export const homeMobileCopy = {
  errorTitle: "Something went wrong",
  errorBody: "We couldn\u2019t load your feed.",
  tryAgain: "Try again",
  followingEmptyTitle: "You\u2019re not following anyone yet",
  followingEmptyBody: "Follow writers and publications to see their latest posts here.",
  discoverWriters: "Discover writers",
  loadingSrLabel: "Loading your feed",
  writersHeading: "Popular writers",
  publicationsHeading: "Popular publications",
};
