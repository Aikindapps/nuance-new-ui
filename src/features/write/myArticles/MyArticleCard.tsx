import { Link } from "react-router-dom";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { myArticlesCopy } from "../../../constants/copy";
import { type MyArticle, isSubmittedForReview } from "./hooks/useMyArticles";
import { IconKey } from "../../../components/ui/icons/IconKey";
import { myArticlesMobileCopy } from "./myArticlesMobileCopy";

// A row in the My Articles list (Figma 5.7): optional thumb + status pill +
// date + title (→ edit) + excerpt + Edit / View / Delete actions.
export function MyArticleCard({
  article,
  onDelete,
  deleting,
  onUnpublish,
  unpublishing,
  canManage,
}: {
  article: MyArticle;
  onDelete: () => void;
  deleting: boolean;
  onUnpublish: () => void;
  unpublishing: boolean;
  // Whether the current user is an editor of this article's publication.
  // Manage Articles is editor-only, so the "Manage in …" link is shown only to
  // editors — a writer cannot manage and would hit the not-authorized screen.
  canManage: boolean;
}) {
  const c = myArticlesCopy;
  const isNft = article.hasNft;
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
          {isNft && (
            <span className="rounded-full bg-brand-purple-10 px-2.5 py-1 text-[length:calc(12*var(--fpx))] font-medium leading-[calc(15*var(--fpx))] text-brand-purple">
              {myArticlesMobileCopy.mintedTag}
            </span>
          )}
          {article.isDraft && (
            <span className="rounded-[calc(8*var(--fpx))] bg-ink-border-10 px-2 py-0.5 text-[length:calc(13*var(--fpx))] font-bold text-ink">
              {isSubmittedForReview(article) ? c.inReviewPill : c.draftPill}
            </span>
          )}
          {article.publication && (
            <span className="rounded-[calc(8*var(--fpx))] bg-brand-purple-5 px-2 py-0.5 text-[length:calc(13*var(--fpx))] font-bold text-brand-purple">
              {c.inPublicationPrefix} {article.publication.name}
            </span>
          )}
          {article.publishedOn && (
            <span className="text-[length:calc(14*var(--fpx))] text-ink-60">
              {article.publishedOn}
            </span>
          )}
        </div>
        <Link
          to={isNft || !article.isDraft || article.publication !== null ? viewTo : editTo}
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
          {/* Edit is offered only for own-handle drafts. A published article is
              read-only (one state per article): to change it, Unpublish first —
              it returns to an editable draft (NIC-283). NFT articles and
              publication articles are never editable here. */}
          {!isNft && article.isDraft && article.publication === null && (
            <Link
              to={editTo}
              className="text-body font-medium text-brand-purple hover:underline"
            >
              {c.edit}
            </Link>
          )}
          {!article.isDraft && (
            <Link
              to={viewTo}
              className="text-body font-medium text-brand-purple hover:underline"
            >
              {c.view}
            </Link>
          )}
          {article.publication && canManage && (
            <Link
              to={`/publication/${article.publication.handle}/manage/articles`}
              className="text-body font-medium text-brand-purple hover:underline"
            >
              {c.manageInPrefix} {article.publication.name}
            </Link>
          )}
          {/* Unpublish is a personal-post-only action: publication
              publish/unpublish is an editor-only editorial action handled
              in Manage Articles (NIC-86), not in My Articles. */}
          {!article.isDraft && article.publication === null && (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={unpublishing}
              className="text-body font-medium text-brand-purple hover:underline disabled:opacity-50"
            >
              {unpublishing ? c.unpublishing : c.unpublish}
            </button>
          )}
          {article.publication === null && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="text-body font-medium text-error hover:underline disabled:opacity-50"
            >
              {deleting ? c.deleting : c.delete}
            </button>
          )}
          {isNft && (
            <Link
              to={`/my-articles/keys/${article.id}`}
              state={{ from: "my-articles" }}
              aria-label={myArticlesMobileCopy.viewKeysSold}
              title={myArticlesMobileCopy.viewKeysSold}
              className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
            >
              <IconKey className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
