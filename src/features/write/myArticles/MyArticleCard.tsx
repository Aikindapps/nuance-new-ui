import { Link } from "react-router-dom";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { myArticlesCopy } from "../../../constants/copy";
import type { MyArticle } from "./hooks/useMyArticles";

// A row in the My Articles list (Figma 5.7): optional thumb + status pill +
// date + title (→ edit) + excerpt + Edit / View / Delete actions.
export function MyArticleCard({
  article,
  onDelete,
  deleting,
}: {
  article: MyArticle;
  onDelete: () => void;
  deleting: boolean;
}) {
  const c = myArticlesCopy;
  const editTo = `/write/${article.id}-${article.bucketCanisterId}`;
  const viewTo = buildArticleUrl({
    handle: article.routeHandle,
    postId: article.id,
    bucketCanisterId: article.bucketCanisterId,
    title: article.title,
  });

  return (
    <article className="flex gap-4 rounded-card border border-ink-border/10 p-4">
      {article.imageSrc && (
        <img
          src={article.imageSrc}
          alt={article.imageAlt}
          className="hidden h-[calc(86*var(--fpx))] w-[calc(114*var(--fpx))] shrink-0 rounded-[calc(8*var(--fpx))] object-cover sm:block"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          {article.isDraft && (
            <span className="rounded-[calc(8*var(--fpx))] bg-ink-border-10 px-2 py-0.5 text-[length:calc(13*var(--fpx))] font-bold text-ink">
              {c.draftPill}
            </span>
          )}
          {article.publishedOn && (
            <span className="text-[length:calc(14*var(--fpx))] text-ink-60">
              {article.publishedOn}
            </span>
          )}
        </div>
        <Link
          to={editTo}
          className="mt-1 line-clamp-2 text-lg font-bold text-ink hover:text-brand-purple"
        >
          {article.title}
        </Link>
        {article.excerpt && (
          <p className="mt-1 line-clamp-2 text-body text-ink-60">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-4 pt-3">
          <Link
            to={editTo}
            className="text-body font-medium text-brand-purple hover:underline"
          >
            {c.edit}
          </Link>
          {!article.isDraft && (
            <Link
              to={viewTo}
              className="text-body font-medium text-brand-purple hover:underline"
            >
              {c.view}
            </Link>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-body font-medium text-error hover:underline disabled:opacity-50"
          >
            {deleting ? c.deleting : c.delete}
          </button>
        </div>
      </div>
    </article>
  );
}
