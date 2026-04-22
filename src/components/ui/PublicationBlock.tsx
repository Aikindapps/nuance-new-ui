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
        <p className="text-[16px] font-medium leading-6 text-ink-80">
          {followersLabel} followers
        </p>
        {publication.bio && (
          <p className="line-clamp-3 text-[16px] leading-normal text-ink-80">
            {publication.bio}
          </p>
        )}
      </div>
      <Avatar
        src={publication.avatar}
        label={publication.displayName || publication.handle}
        sizeClass="size-20 md:size-[100px] lg:size-[120px]"
        textClass="text-[32px] md:text-[40px] lg:text-[48px]"
        rounded="card"
      />
    </a>
  );
}
