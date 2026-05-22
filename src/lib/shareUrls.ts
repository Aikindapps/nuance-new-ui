import type { SocialPlatform } from "../components/ui/icons/SocialIcon";

// Share-intent URLs for the article ShareButton popover (PR #8, §4.4).
//
// The Figma share strip (Google / LinkedIn / Reddit / Facebook) reuses the
// SAME brand glyphs as the author-block social channels — same `SocialIcon`
// palette, no Twitter glyph. Google in this context means "compose a Gmail
// message" (the most natural "share via Google" target for an article).
//
// Each URL is opened via `window.open(href, '_blank', 'noopener,noreferrer')`
// at the consumer site; this file just constructs the href.

export type ShareTarget = Exclude<SocialPlatform, "other">;

export const SHARE_TARGETS: readonly ShareTarget[] = [
  "google",
  "linkedin",
  "reddit",
  "facebook",
] as const;

export function buildShareUrl(
  target: ShareTarget,
  pageUrl: string,
  title: string,
): string {
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(title);
  switch (target) {
    case "google":
      // Gmail web compose. `su` = subject, `body` = message body.
      return `https://mail.google.com/mail/u/0/?fs=1&tf=cm&su=${t}&body=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  }
}

export const SHARE_LABELS: Record<ShareTarget, string> = {
  google: "Share by Gmail",
  linkedin: "Share on LinkedIn",
  reddit: "Share on Reddit",
  facebook: "Share on Facebook",
};
