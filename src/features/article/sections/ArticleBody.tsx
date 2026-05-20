import { useMemo } from "react";
import DOMPurify from "dompurify";

// Article body renderer (PR #7 Phase 4, decision #31).
//
// The canister stores the body as an HTML string authored in Nuance's
// editor, and does not sanitize on write — so rendering it raw would be a
// stored-XSS vector (a malicious writer could ship <script> to every
// reader). DOMPurify strips scripts, event handlers and javascript: URLs
// while keeping the safe content. Element styling lives in `.article-prose`
// (src/index.css) since the canister HTML carries no classes.

// Harden external links: any anchor with `target` gets `rel="noopener
// noreferrer"` so it can't leak window.opener. Done as a post-sanitize
// DOM walk rather than DOMPurify.addHook (which is module-global and
// would affect every future sanitize caller). PR #7 review m6.
function hardenLinks(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("a[target]").forEach((a) => {
    a.setAttribute("rel", "noopener noreferrer");
  });
  return doc.body.innerHTML;
}

export function ArticleBody({ html }: { html: string }) {
  const clean = useMemo(() => hardenLinks(DOMPurify.sanitize(html)), [html]);

  if (!clean.trim()) {
    return (
      <p className="text-body text-ink-60">This article has no content.</p>
    );
  }

  // `clean` is DOMPurify-sanitized + link-hardened above — safe to inject.
  return (
    <div className="article-prose" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
