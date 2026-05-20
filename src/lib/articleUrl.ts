// Article URL scheme — load-bearing for SEO (decision #32).
//
// Production nuance.xyz is fronted by a standalone crawler proxy that, for
// known search-engine / link-preview bots, server-renders article HTML by
// parsing the postId and bucket canister ID straight out of the URL path.
// The new frontend MUST keep emitting this exact shape or the proxy fails its
// parse and crawlers silently get the empty JS shell.
//
// Canonical shape (vendor `buildPostUrl`, PostBucket/main.mo):
//   /{handle}/{postId}-{bucketCanisterId}/{slugified-title}
//
// The middle segment joins postId + bucketCanisterId with a literal "-".
// bucketCanisterId is an IC principal (e.g. "3tzz7-naaaa-aaaaf-qakha-cai")
// and itself contains hyphens — so the segment is split on the FIRST "-"
// only: left = postId, right = bucketCanisterId.

// Slug generation. Mirrors the vendor `U.textToUrlSegment`: lowercase, keep
// alphanumerics, collapse every other run to a single "-", trim ends. The
// slug is decorative — the proxy ignores segment 3 — so exact byte-fidelity
// with the Motoko is not required, only a stable, readable segment.
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ArticleUrlParts = {
  handle: string;
  postId: string;
  bucketCanisterId: string;
  title: string;
};

// Builds the canonical article path. `handle` is normalized (leading "@"
// stripped, lowercased) to match the vendor `U.lowerCase(handle)`.
export function buildArticleUrl(parts: ArticleUrlParts): string {
  const handle = parts.handle.replace(/^@/, "").toLowerCase();
  const slug = slugifyTitle(parts.title) || "article";
  return `/${handle}/${parts.postId}-${parts.bucketCanisterId}/${slug}`;
}

// Recovers postId + bucketCanisterId from the route's middle segment.
// Returns null when the segment is malformed (no hyphen, or hyphen at an
// edge) so the route can render a not-found state instead of querying with
// garbage.
export function parseArticleSegment(
  segment: string,
): { postId: string; bucketCanisterId: string } | null {
  const i = segment.indexOf("-");
  if (i <= 0 || i >= segment.length - 1) return null;
  return {
    postId: segment.slice(0, i),
    bucketCanisterId: segment.slice(i + 1),
  };
}
