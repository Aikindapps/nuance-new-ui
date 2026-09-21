// MyArticleMobileCard -- one row in the 393px My Articles mobile list.
// Layout (Figma 2294:3003 Row frame): 72x54 thumbnail | 2-line clamped title
// | meta line | status label + claps count + kebab overflow button.
// The kebab calls onKebabClick; the sheet is owned by the parent list.

import { Link } from "react-router-dom";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { myArticlesCopy } from "../../../constants/copy";
import { myArticlesMobileCopy } from "./myArticlesMobileCopy";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import type { MyArticle } from "./hooks/useMyArticles";

const mc = myArticlesMobileCopy;
const c = myArticlesCopy;

type Props = {
  article: MyArticle;
  deleting: boolean;
  unpublishing: boolean;
  onKebabClick: () => void;
};

export function MyArticleMobileCard({
  article,
  deleting,
  unpublishing,
  onKebabClick,
}: Props) {
  const isPersonal = article.publication === null;
  const viewTo = buildArticleUrl({
    handle: article.routeHandle,
    postId: article.id,
    bucketCanisterId: article.bucketCanisterId,
    title: article.title,
  });
  const editTo = `/write/${article.id}-${article.bucketCanisterId}`;
  // Drafts that are personal and non-NFT open in the editor; everything else
  // opens the article view (mirrors the desktop MyArticleCard link logic).
  const linkTo =
    article.isDraft && isPersonal && !article.hasNft ? editTo : viewTo;
  const isPending = deleting || unpublishing;

  return (
    <article>
      <div className="flex gap-3 py-3">
        {/* Thumbnail -- 72x54, radius 8, drop-shadow per Figma "Image shadow" */}
        <div
          className="h-[54px] w-[72px] shrink-0 overflow-hidden rounded-[8px] bg-ink-border-10 shadow-[0_2px_8px_0_rgba(55,58,73,0.12)]"
        >
          {article.imageSrc ? (
            <img
              src={article.imageSrc}
              alt={article.imageAlt}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        {/* Title + meta */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Link
            to={linkTo}
            className="line-clamp-2 text-[18px] font-bold leading-[26px] text-ink"
          >
            {article.title}
          </Link>
          <p className="mt-1 truncate text-[16px] leading-[24px] text-ink-60">
            {"@"}{article.author.handle}
            {article.publishedOn ? " \u00b7 " + article.publishedOn : ""}
          </p>
        </div>
      </div>
      {/* Status + claps + kebab row */}
      <div className="flex items-center gap-2 pb-3">
        {/* Draft pill -- shown for drafts only; matches desktop draftPill styling
            (MyArticleCard.tsx). Published articles show no status indicator here
            per NIC-180 scope (publish toggle is deferred). */}
        {article.isDraft && (
          <span className="rounded-[8px] bg-ink-border-10 px-2 py-0.5 text-[13px] font-bold text-ink">
            {c.draftPill}
          </span>
        )}
        <span className="flex-1" />
        {/* Claps -- shown when non-zero, matches frame "Stats bar" clap icon */}
        {article.claps > 0 && (
          <span className="flex items-center gap-1 text-[16px] leading-[24px] text-brand-purple">
            <IconClaps className="h-5 w-5" />
            <span className="font-medium">{article.claps}</span>
          </span>
        )}
        {/* Kebab overflow button */}
        <button
          type="button"
          onClick={onKebabClick}
          disabled={isPending}
          aria-label={mc.kebabAriaLabel}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] disabled:opacity-50"
        >
          <KebabIcon />
        </button>
      </div>
      {/* Row divider */}
      <div className="h-px bg-ink-border/10" />
    </article>
  );
}

// Vertical three-dot overflow icon -- 4x4 ellipses at 0/7/14 vertical centres,
// matching the Figma "Ellipse 4x4 fill #202123 @80%" description.
function KebabIcon() {
  return (
    <svg width="4" height="18" viewBox="0 0 4 18" fill="none" aria-hidden>
      <circle cx="2" cy="2" r="2" fill="#202123" fillOpacity="0.8" />
      <circle cx="2" cy="9" r="2" fill="#202123" fillOpacity="0.8" />
      <circle cx="2" cy="16" r="2" fill="#202123" fillOpacity="0.8" />
    </svg>
  );
}
