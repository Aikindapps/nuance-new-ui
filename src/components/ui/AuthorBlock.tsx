import type { UserListItem } from "../../candid/User/User";
import { formatCount } from "../../lib/formatCount";
import { Avatar } from "./Avatar";
import { IconVerified } from "./icons/IconVerified";

export function AuthorBlock({ author }: { author: UserListItem }) {
  const followersLabel = formatCount(author.followersCount);

  return (
    <a
      href={`/${author.handle}`}
      className="flex h-full w-[calc(220*var(--fpx))] shrink-0 flex-col items-center gap-4 rounded-card border border-ink-border/20 bg-white p-6 shadow-purple-glow transition-shadow hover:shadow-purple-glow-hover md:w-[calc(240*var(--fpx))] md:p-7 lg:w-[calc(248*var(--fpx))] lg:p-8"
    >
      <Avatar
        src={author.avatar}
        label={author.displayName || author.handle}
        sizeClass="size-[calc(96*var(--fpx))] lg:size-[calc(120*var(--fpx))]"
        textClass="text-[length:calc(40*var(--fpx))] lg:text-[length:calc(48*var(--fpx))]"
      />

      <div className="flex w-full items-center justify-center gap-2">
        <p className="truncate text-title-sm font-medium text-ink">
          @{author.handle}
        </p>
        {author.isVerified && (
          <IconVerified className="size-6 shrink-0 text-brand-purple" />
        )}
      </div>

      <p className="w-full text-center text-[length:calc(16*var(--fpx))] font-medium leading-6 text-ink-80">
        {followersLabel} followers
      </p>

      {author.bio && (
        <p className="line-clamp-3 w-full text-center text-[length:calc(16*var(--fpx))] leading-normal text-ink-80">
          {author.bio}
        </p>
      )}
    </a>
  );
}
