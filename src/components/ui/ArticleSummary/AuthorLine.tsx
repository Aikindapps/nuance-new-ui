import type { Article } from "../../../features/home/types";
import { Link } from "react-router-dom";
import { Avatar } from "../Avatar";
import { IconVerified } from "../icons/IconVerified";

/**
 * Byline under an article card: avatar + "In Publication by @handle ✓".
 *
 * Layout rules:
 *  - Avatar stays pinned left (shrink-0 on the Avatar itself).
 *  - The text `<p>` fills remaining width (`flex-1 min-w-0`) so long bylines
 *    wrap inside the column rather than shoving the whole block to a new line.
 *  - The "In Publication" and "by @handle ✓" groups each stay together when
 *    wrapping — the verified icon can never orphan to its own line.
 *  - Only the large variant underlines the publication name, per Figma spec.
 */
export function AuthorLine({
  article,
  large,
}: {
  article: Article;
  large: boolean;
}) {
  const { author, publication } = article;
  return (
    <div className="flex items-center gap-4">
      <Avatar
        src={author.avatarSrc}
        label={author.displayName}
        sizeClass="size-10"
        textClass="text-[length:calc(18*var(--fpx))]"
      />
      <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-body font-medium text-brand-purple">
        {publication && (
          <span className="flex items-center gap-1.5">
            <span>In</span>
            <Link
              to={`/publication/${publication.handle.toLowerCase()}`}
              className={
                large
                  ? "underline underline-offset-2 hover:no-underline"
                  : "hover:underline"
              }
            >
              {publication.name}
            </Link>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span>by</span>
          <Link
            to={`/${author.handle.replace("@", "").toLowerCase()}`}
            className="hover:underline"
          >
            {author.handle}
          </Link>
          {author.isVerified && <IconVerified className="size-6" />}
        </span>
      </p>
    </div>
  );
}
