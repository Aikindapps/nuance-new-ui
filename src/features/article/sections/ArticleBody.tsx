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

// New-tab links must not leak window.opener. Registered once at module load.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target")) {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function ArticleBody({ html }: { html: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html), [html]);

  if (!clean.trim()) {
    return (
      <p className="text-body text-ink-60">This article has no content.</p>
    );
  }

  // `clean` is DOMPurify-sanitized above — safe to inject as HTML.
  return (
    <div className="article-prose" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
