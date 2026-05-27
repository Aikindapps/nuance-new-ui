import { useEffect } from "react";
import { ArticleBody } from "../../article/sections/ArticleBody";
import { formatLongDate } from "../../article/lib/articleFormat";
import { IconBack } from "../../../components/ui/icons/IconBack";
import { writeArticleCopy } from "../../../constants/copy";
import { StatusTag } from "./StatusTag";

// "Preview of changes" overlay (Figma 1:37814) — a read-only view of the
// in-progress article exactly as the published page will render the body
// (.article-prose via ArticleBody, the same DOMPurify-sanitized renderer the
// ReadArticle route uses). Fixed full-screen overlay so the editor state
// underneath stays intact: closing returns the writer to the same cursor /
// scroll position. The "last modified" stamp is "now" — preview reflects the
// current unsaved state, which is by definition newer than the canister copy.
export function PreviewOverlay({
  title,
  subtitle,
  coverUrl,
  bodyHtml,
  isPublished,
  modifiedMs,
  onClose,
}: {
  title: string;
  subtitle: string;
  coverUrl: string;
  bodyHtml: string;
  isPublished: boolean;
  // Milliseconds since epoch as a string (matches Post.modified wire shape).
  modifiedMs: string;
  onClose: () => void;
}) {
  const c = writeArticleCopy;
  const dateText = formatLongDate(modifiedMs);

  // Escape closes the overlay — consistent with the LoginModal / Popup pattern.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Article preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-white"
    >
      {/* Same 932px Figma reading column the editor route uses
          (routes/WriteArticle.tsx) — preview is read-as-published, not a
          full-bleed surface. */}
      <article className="mx-auto flex max-w-[calc(932*var(--fpx))] flex-col gap-[calc(50*var(--fpx))] pb-[calc(80*var(--fpx))] pt-12 lg:pt-20">
        {/* Breadcrumb row — back + status + last modified, matching the
            editor's own breadcrumb so the surface feels like the editor in
            read mode. */}
        <div className="flex items-center gap-3 px-6 py-3 lg:px-24">
          <button
            type="button"
            onClick={onClose}
            aria-label={c.preview.close}
            className="flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            <IconBack className="size-[calc(18*var(--fpx))]" />
          </button>
          <StatusTag label={isPublished ? c.statusPublished : c.statusDraft} />
          {dateText && (
            <span className="text-body text-ink-60">
              {c.preview.lastModified}: {dateText}
            </span>
          )}
        </div>

        {/* Header — title + subtitle, same type scale as the masthead h1. */}
        <div className="flex flex-col gap-[calc(32*var(--fpx))] px-6 lg:px-24">
          <h1 className="text-title-md font-extrabold text-ink md:text-title-lg lg:text-title-xl">
            {title.trim() || c.titlePlaceholder}
          </h1>
          {subtitle.trim() && (
            <p className="text-lg font-medium text-ink-80">{subtitle}</p>
          )}
        </div>

        {/* Cover image — same aspect / treatment as ReadArticle's masthead. */}
        {coverUrl && (
          <div className="px-6 lg:px-14">
            <img
              src={coverUrl}
              alt={title || "Article header"}
              className="aspect-[820/474] w-full rounded-card object-cover"
            />
          </div>
        )}

        {/* Body — the same .article-prose renderer the published page uses, so
            preview is literally the publish output. */}
        <div className="px-6 lg:px-24">
          {bodyHtml.trim() ? (
            <ArticleBody html={bodyHtml} />
          ) : (
            <p className="text-body text-ink-60">{c.preview.noContent}</p>
          )}
        </div>
      </article>
    </div>
  );
}
