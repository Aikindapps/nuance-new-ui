// Article-page date + read-time formatting.
//
// Nuance Post date fields (publishedDate / created / modified) are
// milliseconds-since-epoch stored as Text — NOT nanoseconds (project lesson
// 2026-04-22). Pass straight to new Date(parseInt(ms)).

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseMs(ms: string): Date | null {
  if (!ms || !ms.trim()) return null;
  const n = Number.parseInt(ms.trim(), 10);
  if (!Number.isFinite(n) || n === 0) return null;
  const d = new Date(n);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "Sep 17, 2021" — the masthead meta-row date format (Figma 1:4478). Returns
// "" for empty / "0" / unparseable input so callers can fall back or omit.
export function formatLongDate(ms: string): string {
  const d = parseMs(ms);
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// "4 min read" from a word count (Text). ~200 wpm, floored at 1 minute.
// Returns "" when the word count is missing/zero so the caller can omit the
// label rather than show a misleading "1 min read".
export function readTimeLabel(wordCount: string): string {
  const n = Number.parseInt((wordCount || "").trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${Math.max(1, Math.round(n / 200))} min read`;
}
