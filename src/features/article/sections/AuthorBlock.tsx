import { Link } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { FollowButton } from "../../../components/ui/FollowButton/FollowButton";
import { SocialIcon } from "../../../components/ui/icons/SocialIcon";
import { formatCount } from "../../../lib/formatCount";
import { detectSocialPlatform, normalizeUrl } from "../lib/socialChannels";
import type { UserListItem } from "../../../candid/User/User";

// Article author card — Figma 1:5324/1:5325 + §4.3 (`1:17074`). Bordered
// card: avatar, @handle, followers / following counts, social links, bio,
// Follow button.
//
// PR #8 Phase 3a wires the Follow button: extracted into `<FollowButton/>`
// which owns auth gating, mutation, optimistic flip, toast, and the
// self-follow no-render guard. `followingCount` comes from the author's
// full User record (useArticle); null while unavailable, in which case
// the "N following" stat is omitted rather than shown as 0.

type Props = {
  author: UserListItem | null;
  followingCount: number | null;
};

export function AuthorBlock({ author, followingCount }: Props) {
  if (!author) return null;

  const socials = author.socialChannelsUrls
    .map((u) => u.trim())
    .filter((u) => u !== "");

  return (
    <div className="px-6 lg:px-14">
      <div className="flex flex-col items-start gap-6 rounded-card border border-ink-border/20 p-6 md:flex-row md:items-center md:gap-8 lg:px-12 lg:py-8">
        <Avatar
          src={author.avatar}
          label={author.displayName || author.handle}
          sizeClass="size-20 lg:size-[calc(120*var(--fpx))]"
          textClass="text-[length:calc(40*var(--fpx))]"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Link
            to={`/${author.handle.toLowerCase()}`}
            className="text-title-sm font-medium text-ink hover:underline"
          >
            @{author.handle}
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-label font-medium text-ink-80">
            <span>{formatCount(author.followersCount)} followers</span>
            {followingCount !== null && (
              <>
                <span className="text-ink-40">|</span>
                <span>{followingCount} following</span>
              </>
            )}
            {socials.length > 0 && (
              <>
                <span className="text-ink-40">|</span>
                <span className="flex items-center gap-1">
                  {socials.map((url) => (
                    <a
                      key={url}
                      href={normalizeUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Author social link"
                      className="flex size-6 items-center justify-center rounded-[calc(2*var(--fpx))] transition-colors hover:bg-ink-border-5"
                    >
                      <SocialIcon
                        platform={detectSocialPlatform(url)}
                        className="size-[calc(18*var(--fpx))] text-ink-60"
                      />
                    </a>
                  ))}
                </span>
              </>
            )}
          </div>

          {author.bio && (
            <p className="text-label text-ink-80">{author.bio}</p>
          )}
        </div>

        <FollowButton targetHandle={author.handle} />
      </div>
    </div>
  );
}
