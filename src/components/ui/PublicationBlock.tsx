import type { UserListItem } from "../../candid/User/User";
import { formatCount } from "../../lib/formatCount";
import { Avatar } from "./Avatar";

export function PublicationBlock({ publication }: { publication: UserListItem }) {
  const followersLabel = formatCount(publication.followersCount);

  return (
    <a
      href={`/publication/${publication.handle}`}
      className="flex h-full gap-4 rounded-card border border-ink-border/20 bg-white p-6 shadow-purple-glow transition-shadow hover:shadow-purple-glow-hover md:p-8 lg:p-10"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
        <h3 className="truncate text-title-sm font-medium text-ink">
          {publication.displayName || publication.handle}
        </h3>
        <p className="text-[length:calc(16*var(--fpx))] font-medium leading-6 text-ink-80">
          {followersLabel} followers
        </p>
        {publication.bio && (
          <p className="line-clamp-3 text-[length:calc(16*var(--fpx))] leading-normal text-ink-80">
            {publication.bio}
          </p>
        )}
      </div>
      <Avatar
        src={publication.avatar}
        label={publication.displayName || publication.handle}
        sizeClass="size-20 md:size-[calc(100*var(--fpx))] lg:size-[calc(120*var(--fpx))]"
        textClass="text-[length:calc(32*var(--fpx))] md:text-[length:calc(40*var(--fpx))] lg:text-[length:calc(48*var(--fpx))]"
        rounded="card"
      />
    </a>
  );
}
