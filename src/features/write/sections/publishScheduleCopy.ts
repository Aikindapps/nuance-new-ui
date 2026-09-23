// Publish date & time (scheduled publish) copy for the Publish panel
// (NIC-418). ASCII-only module so diffs stay transit-safe (NIC-180);
// do not add typographic punctuation here - use " - " for an em-dash.
export const publishScheduleCopy = {
  label: "Publish date & time",
  dateAriaLabel: "Publish date",
  timeAriaLabel: "Publish time",
  immediateHelp:
    "Publishes immediately - pick a future date and time to " +
    "schedule.",
  goesLive: "Goes live {date} at {time}",
  scheduleButton: "Schedule",
  noSlotsToday: "No later times today - pick another date",
} as const;
