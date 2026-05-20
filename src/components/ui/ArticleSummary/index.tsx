import { Link } from "react-router-dom";
import type { Article } from "../../../features/home/types";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { AuthorLine } from "./AuthorLine";
import { MetaBar } from "./MetaBar";

type ArticleSummaryProps = {
  article: Article;
  variant?: "large" | "small";
};

export function ArticleSummary({
  article,
  variant = "small",
}: ArticleSummaryProps) {
  const large = variant === "large";
  const articleUrl = buildArticleUrl({
    handle: article.routeHandle,
    postId: article.id,
    bucketCanisterId: article.bucketCanisterId,
    title: article.title,
  });
  return (
    <article
      className={
        large
          ? "flex h-full flex-col gap-4 lg:gap-6"
          : "flex h-full flex-col gap-4"
      }
    >
      <Link
        to={articleUrl}
        aria-hidden="true"
        tabIndex={-1}
        className={
          large
            ? "block aspect-[628/400] w-full overflow-hidden rounded-card bg-ink-80"
            : "block aspect-[416/242] w-full overflow-hidden rounded-card bg-ink-80"
        }
      >
        {article.imageSrc ? (
          <img
            src={article.imageSrc}
            alt={article.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-brand-gradient h-full w-full" aria-hidden />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4">
        <AuthorLine article={article} large={large} />
        <div className="flex flex-col gap-2">
          <h3
            className={
              large
                ? "font-bold text-ink lg:text-title-lg text-title-sm line-clamp-3"
                : "text-title-sm font-bold text-ink line-clamp-3"
            }
          >
            <Link to={articleUrl} className="hover:underline">
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p
              className={
                large
                  ? "text-body text-ink-80 line-clamp-2 lg:text-lg"
                  : "text-body text-ink-80 line-clamp-2"
              }
            >
              {article.excerpt}
            </p>
          )}
        </div>
        <MetaBar article={article} showNft={large} />
      </div>
    </article>
  );
}
