// SEO helpers for the article page (Phase 10).

const ENTITY: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// Plain-text excerpt from sanitized HTML, truncated at a word boundary with
// an ellipsis. Used for meta description / OG description / Twitter card.
// 155 is the conventional meta-description cap for Google snippets.
export function extractExcerpt(html: string, max = 155): string {
  if (!html) return "";
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITY[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

// ISO 8601 string from a Nuance ms-as-text timestamp. Returns "" for
// missing / zero / unparseable input — JSON-LD spec accepts the field
// being absent, so callers should treat "" as "omit the field".
// Mirrors the parsing in articleFormat.ts (project lesson 2026-04-22: ms,
// not ns).
export function formatIsoDate(ms: string): string {
  if (!ms || !ms.trim()) return "";
  const n = Number.parseInt(ms.trim(), 10);
  if (!Number.isFinite(n) || n === 0) return "";
  const d = new Date(n);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
