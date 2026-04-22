import type { Article } from "../../../features/home/types";
import { IconClaps } from "../icons/IconClaps";
import { IconNft } from "../icons/IconNft";

/**
 * Footer row on an article card: published date · claps · NFT badge (large only).
 * `mt-auto` pins this to the bottom of the card so meta bars align horizontally
 * across every card in a row regardless of title/excerpt length.
 */
export function MetaBar({
  article,
  showNft,
}: {
  article: Article;
  showNft: boolean;
}) {
  return (
    <div className="mt-auto flex items-center gap-8 text-body text-ink-60">
      {article.publishedOn && <time>{article.publishedOn}</time>}
      <div className="flex items-center gap-2">
        <IconClaps className="size-6" />
        <span>{article.claps}</span>
      </div>
      {showNft && article.hasNft && (
        <IconNft className="size-6 text-brand-purple" />
      )}
    </div>
  );
}
