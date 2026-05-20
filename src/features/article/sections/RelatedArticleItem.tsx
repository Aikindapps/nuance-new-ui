import { Link } from "react-router-dom";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { IconVerified } from "../../../components/ui/icons/IconVerified";
import type { Article } from "../../home/types";

// Compact related-article row — Figma 1:6257 (the foldout list item).
// 114×86 thumbnail + title (16/24 bold) + byline (14/24 purple).
export function RelatedArticleItem({ article }: { article: Article }) {
  const url = buildArticleUrl({
    handle: article.routeHandle,
    postId: article.id,
    bucketCanisterId: article.bucketCanisterId,
    title: article.title,
  });

  return (
    <Link to={url} className="group flex items-start gap-2">
      <div className="h-[calc(86*var(--fpx))] w-[calc(114*var(--fpx))] shrink-0 overflow-hidden rounded-card bg-ink-80">
        {article.imageSrc ? (
          <img
            src={article.imageSrc}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-brand-gradient h-full w-full" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-label font-bold text-ink line-clamp-3 group-hover:underline">
          {article.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-1 text-[length:calc(14*var(--fpx))] leading-6 text-brand-purple">
          {article.publication && (
            <>
              <span>In</span>
              <span className="underline">{article.publication.name}</span>
              <span>by</span>
            </>
          )}
          <span className="underline">{article.author.handle}</span>
          {article.author.isVerified && <IconVerified className="size-4" />}
        </p>
      </div>
    </Link>
  );
}
