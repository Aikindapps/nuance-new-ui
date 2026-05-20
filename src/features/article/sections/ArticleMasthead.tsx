import { Link } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { IconClaps } from "../../../components/ui/icons/IconClaps";
import { IconNft } from "../../../components/ui/icons/IconNft";
import { IconVerified } from "../../../components/ui/icons/IconVerified";
import { IconOptions } from "../../../components/ui/icons/IconOptions";
import type { PostBucketType__1 } from "../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../candid/User/User";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";
import { formatLongDate, readTimeLabel } from "../lib/articleFormat";

// Article masthead — Figma 1:5293 (Title) + 1:5295 (Author details + Subtitle)
// + 1:5298 (Photo). Title is the page's single <h1>.
//
// Insets follow Figma: title at px-56, author/subtitle at px-96, photo at
// px-56 — each scaled down on mobile (Phase 9 refines against the mobile
// frames). The meta row omits the comment count: comments are deferred
// entirely to the Page 4 enrichment PR (decision #31). The 3-dot options
// button renders as a visual shell — its menu is Page 4 too.

type Props = {
  post: PostBucketType__1;
  author: UserListItem | null;
  publication: UserListItem | null;
  meta: PostKeyProperties | null;
};

export function ArticleMasthead({ post, author, publication, meta }: Props) {
  const isPub = post.isPublication;
  const authorHandle = (post.creatorHandle || post.handle).toLowerCase();
  const authorName = author?.displayName || authorHandle;
  const authorAt = `@${author?.handle || authorHandle}`;
  const pubHandle = isPub && post.handle ? post.handle.toLowerCase() : null;
  const pubName = publication?.displayName || pubHandle || "";

  const published =
    formatLongDate(post.publishedDate) || formatLongDate(post.created);
  const modified = formatLongDate(post.modified);
  const showModified = modified !== "" && modified !== published;
  const claps = Number(meta?.claps ?? 0) || 0;
  const readTime = readTimeLabel(post.wordCount);

  return (
    <header>
      <h1 className="px-6 text-title-md font-bold text-ink md:text-title-lg lg:px-14 lg:text-title-xl">
        {post.title || "Untitled"}
      </h1>

      <div className="mt-8 flex flex-col gap-8 px-6 lg:mt-[calc(50*var(--fpx))] lg:px-24">
        <div className="flex flex-col gap-6 lg:gap-10">
          {/* Account row — avatar + "In {publication} by @{author} ✓".
              Mobile uses Figma 1:5433 sizes (40px avatar, 14px byline); desktop
              uses Figma 1:5295 (72px avatar, 18px byline). */}
          <div className="flex items-center gap-3 lg:gap-6">
            <Avatar
              src={author?.avatar || ""}
              label={authorName}
              sizeClass="size-10 lg:size-[calc(72*var(--fpx))]"
            />
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[length:calc(14*var(--fpx))] leading-[calc(24*var(--fpx))] lg:text-body">
              {pubHandle && (
                <>
                  <span className="text-ink-60">In</span>
                  <Link
                    to={`/${pubHandle}`}
                    className="text-brand-purple underline underline-offset-2 hover:no-underline"
                  >
                    {pubName}
                  </Link>
                  <span className="text-ink-60">by</span>
                </>
              )}
              <Link
                to={`/${authorHandle}`}
                className="text-brand-purple underline underline-offset-2 hover:no-underline"
              >
                {authorAt}
              </Link>
              {author?.isVerified && (
                <IconVerified className="size-4 text-brand-purple lg:size-6" />
              )}
            </p>
          </div>

          {/* Meta row — claps · NFT · published · modified · read time · ⋯ */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[length:calc(14*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-60 lg:gap-x-10 lg:text-body">
            <span className="flex items-center gap-1">
              <IconClaps className="size-4 lg:size-6" />
              {claps}
            </span>
            {post.nftCanisterId && <IconNft className="size-4 lg:size-6" />}
            {published && <time>{published}</time>}
            {showModified && <span>Modified: {modified}</span>}
            {readTime && <span>{readTime}</span>}
            <button
              type="button"
              aria-label="More options"
              className="flex size-8 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
            >
              <IconOptions className="size-4 lg:size-6" />
            </button>
          </div>
        </div>

        {post.subtitle && (
          <p className="text-lg text-ink-80">{post.subtitle}</p>
        )}
      </div>

      {post.headerImage && (
        <div className="mt-8 px-6 lg:mt-[calc(50*var(--fpx))] lg:px-14">
          <img
            src={post.headerImage}
            alt={post.title || "Article header"}
            className="aspect-[820/474] w-full rounded-card object-cover"
          />
        </div>
      )}
    </header>
  );
}
