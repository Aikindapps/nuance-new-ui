// Relative-time formatter for ms-since-epoch timestamps.
//
// Used by WelcomeBanner (last-login time) and any future surface that wants
// "5 minutes ago" / "3 days ago" style copy. Buckets at the granularity a
// human cares about — sub-minute reads as "just now", over a year as the year.

export function formatRelativeTime(ms: number, now: number = Date.now()): string {
  const deltaSeconds = Math.round((now - ms) / 1000);

  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 30) {
    return "just now";
  }

  if (deltaSeconds < 60) {
    return `${deltaSeconds} seconds ago`;
  }

  const minutes = Math.round(deltaSeconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.round(deltaSeconds / 3600);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.round(deltaSeconds / 86400);
  if (days < 30) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.round(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
