// Shared HTML hardening for the article body, used on both ends of the
// content lifecycle:
//   - read (PR #7 ArticleBody): after DOMPurify, before render.
//   - write (PR #9 editor save): after Lexical's $generateHtmlFromNodes,
//     before sending to the canister.
//
// Harden external links: any anchor with `target` gets `rel="noopener
// noreferrer"` so it can't leak window.opener. Done as a post-sanitize DOM
// walk rather than DOMPurify.addHook (which is module-global and would
// affect every future sanitize caller). Originally PR #7 review m6.
export function hardenLinks(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("a[target]").forEach((a) => {
    a.setAttribute("rel", "noopener noreferrer");
  });
  return doc.body.innerHTML;
}
