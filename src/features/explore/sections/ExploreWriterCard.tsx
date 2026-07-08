import { Link } from "react-router-dom";
import type { UserListItem } from "../../../candid/User/User";
import { Avatar } from "../../../components/ui/Avatar";
import { FollowButton } from "../../../components/ui/FollowButton/FollowButton";
import { IconVerified } from "../../../components/ui/icons/IconVerified";
import { formatCount } from "../../../lib/formatCount";

type Props = { author: UserListItem };

export function ExploreWriterCard({ author }: Props) {
  const followersLabel = formatCount(author.followersCount);
  const authorPath = `/${author.handle.toLowerCase()}`;

  return (
    <article className="flex flex-col items-center gap-4 rounded-card border border-ink-border/20 bg-white p-6 shadow-purple-glow transition-shadow hover:shadow-purple-glow-hover md:p-7 lg:p-8">
      <Link to={authorPath} className="flex flex-col items-center gap-4">
        <Avatar
          src={author.avatar}
          label={author.displayName || author.handle}
          sizeClass="size-[calc(96*var(--fpx))] lg:size-[calc(120*var(--fpx))]"
          textClass="text-[length:calc(40*var(--fpx))] lg:text-[length:calc(48*var(--fpx))]"
        />

        <div className="flex items-center justify-center gap-2">
          <p className="truncate text-title-sm font-medium text-ink">
            @{author.handle}
          </p>
          {author.isVerified && (
            <IconVerified className="size-6 shrink-0 text-brand-purple" />
          )}
        </div>
      </Link>

      <p className="w-full text-center text-[length:calc(16*var(--fpx))] font-medium leading-6 text-ink-80">
        {followersLabel} followers
      </p>

      {author.bio && (
        <p className="line-clamp-3 w-full text-center text-[length:calc(16*var(--fpx))] leading-normal text-ink-80">
          {author.bio}
        </p>
      )}

      <FollowButton targetHandle={author.handle} />
    </article>
  );
}
