import { useMemo } from "react";
import DOMPurify from "dompurify";
import { hardenLinks } from "../../../lib/htmlSanitize";

// Article body renderer (PR #7 Phase 4, decision #31).
//
// The canister stores the body as an HTML string authored in Nuance's
// editor, and does not sanitize on write — so rendering it raw would be a
// stored-XSS vector (a malicious writer could ship <script> to every
// reader). DOMPurify strips scripts, event handlers and javascript: URLs
// while keeping the safe content. Element styling lives in `.article-prose`
// (src/index.css) since the canister HTML carries no classes.

// `hardenLinks` (external-link rel hardening, PR #7 review m6) now lives in
// src/lib/htmlSanitize.ts so the PR #9 editor's save path reuses it.
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
