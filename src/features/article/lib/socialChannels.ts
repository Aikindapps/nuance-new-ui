import type { SocialPlatform } from "../../../components/ui/icons/SocialIcon";

// The User canister stores social links as an untyped URL array
// (UserListItem.socialChannelsUrls) — no platform tag. Detect the platform
// from the URL's domain so the right brand glyph renders; anything
// unrecognized falls back to a neutral globe ("other").
export function detectSocialPlatform(url: string): SocialPlatform {
  const u = url.toLowerCase();
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("reddit.")) return "reddit";
  if (u.includes("facebook.") || u.includes("fb.com")) return "facebook";
  if (u.includes("google.")) return "google";
  return "other";
}

// A channel URL may be stored without a scheme ("twitter.com/x"); links need
// an absolute href or the browser resolves them against the article route.
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
