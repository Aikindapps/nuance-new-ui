// Format a ms-since-epoch timestamp as a short relative phrase
// ("just now", "5 min ago", "2 hr ago", "3 days ago", "Apr 12, 2025").
// The canister returns Notification.timestamp as a decimal string. Project
// lesson 2026-04-22: Nuance timestamps are milliseconds, not nanoseconds.
//
// Threshold ladder mirrors the Figma's depicted "1 hour ago" / "5 hour ago"
// style; we use compact "min" / "hr" instead of full words to keep notification
// rows on a single line in the 355px-wide foldout.

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export function formatRelativeTime(timestampMs: string, now: number = Date.now()): string {
  const t = Number.parseInt(timestampMs, 10);
  if (!Number.isFinite(t) || t <= 0) return "";
  const diff = Math.max(0, now - t);

  if (diff < MIN_MS) return "just now";
  if (diff < HOUR_MS) {
    const m = Math.floor(diff / MIN_MS);
    return `${m} min ago`;
  }
  if (diff < DAY_MS) {
    const h = Math.floor(diff / HOUR_MS);
    return `${h} hr ago`;
  }
  if (diff < WEEK_MS) {
    const d = Math.floor(diff / DAY_MS);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  // Older than a week — absolute short date. Drops the year for current-year
  // entries to save row space.
  const date = new Date(t);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
