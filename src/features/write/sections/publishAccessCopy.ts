// Access (Everyone / Only subscribers) copy for the Publish panel (NIC-419).
// Kept in its own ASCII-only module so diffs stay transit-safe (NIC-180);
// do not add typographic punctuation here.
export const publishAccessCopy = {
  label: "Access",
  everyone: "Everyone",
  subscribersOnly: "Only subscribers",
  subscribersUnavailable:
    "Only subscribers is available once subscriptions are switched on for the selected profile or publication.",
} as const;
