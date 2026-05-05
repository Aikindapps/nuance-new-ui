/**
 * Format a numeric count as a compact string: "20K followers", "1.2M", "0", etc.
 * Input is the canister's string representation (User.followersCount etc.).
 *
 * Rules:
 *  - Empty/invalid/0 → "0"
 *  - >= 1_000_000 → e.g. "1M", "2.3M" (drop trailing .0 when whole)
 *  - >= 1_000 → e.g. "20K", "1.5K"
 *  - < 1_000 → raw integer
 */
export function formatCount(raw: string): string {
  const n = Number(raw || "0");
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  }
  return String(n);
}
