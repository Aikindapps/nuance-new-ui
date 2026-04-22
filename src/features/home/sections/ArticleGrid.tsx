import { ArticleSummary } from "../../../components/ui/ArticleSummary";
import type { Article } from "../types";

type ArticleGridProps = {
  articles: Article[];
  layout: "hero" | "grid";
  heading?: string;
  ariaLabel?: string;
};

export function ArticleGrid({
  articles,
  layout,
  heading,
  ariaLabel,
}: ArticleGridProps) {
  const columns =
    layout === "hero"
      ? "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-10 lg:gap-14"
      : "grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-3";

  return (
    <section aria-label={ariaLabel}>
      {heading && (
        <h2 className="mb-6 text-title-sm font-bold text-ink">{heading}</h2>
      )}
      <div className={columns}>
        {articles.map((article) => (
          <ArticleSummary
            key={article.id}
            article={article}
            variant={layout === "hero" ? "large" : "small"}
          />
        ))}
      </div>
    </section>
  );
}
