import { Link } from "react-router-dom";
import type { UserListItem } from "../../../candid/User/User";
import { Avatar } from "../../../components/ui/Avatar";
import { FollowButton } from "../../../components/ui/FollowButton/FollowButton";
import { IconChevronRight } from "../../../components/ui/icons/IconChevronRight";
import { formatCount } from "../../../lib/formatCount";
import { exploreCopy } from "../../../constants/copy";

type Props = { publication: UserListItem };

export function ExplorePublicationRow({ publication }: Props) {
  const name = publication.displayName || publication.handle;
  const pubPath = `/publication/${publication.handle.toLowerCase()}`;
  const tagline = publication.bio ? publication.bio.split("\n")[0] : "";
  const description = publication.bio
    ? publication.bio.split("\n").slice(1).join("\n").trim()
    : "";
  const followersLabel = formatCount(publication.followersCount);

  return (
    <article className="flex flex-col gap-4 rounded-card border border-ink-border/20 bg-white p-6 shadow-purple-glow sm:flex-row sm:items-center md:p-8">
      {/* Avatar */}
      <Link to={pubPath} className="shrink-0 self-start sm:self-center">
        <Avatar
          src={publication.avatar}
          label={name}
          sizeClass="size-[calc(80*var(--fpx))] md:size-[calc(100*var(--fpx))]"
          textClass="text-[length:calc(32*var(--fpx))] md:text-[length:calc(40*var(--fpx))]"
          rounded="card"
        />
      </Link>

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <Link to={pubPath} className="group">
          <h2 className="text-title-sm font-bold text-ink group-hover:underline">{name}</h2>
        </Link>
        {tagline && (
          <p className="mt-1 text-[length:calc(16*var(--fpx))] font-semibold leading-6 text-ink-80">
            {tagline}
          </p>
        )}
        {description && (
          <p className="mt-2 line-clamp-3 text-[length:calc(16*var(--fpx))] leading-normal text-ink-80">
            {description}
          </p>
        )}
      </div>

      {/* Divider — hidden on mobile */}
      <div className="hidden w-px shrink-0 self-stretch bg-ink-border/20 md:block" />

      {/* Specs + Follow */}
      <div className="flex shrink-0 flex-row items-center gap-6 sm:flex-col sm:items-end">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-[length:calc(16*var(--fpx))] text-ink-80">
            <IconChevronRight className="size-[calc(10*var(--fpx))] shrink-0 text-ink-60" />
            {followersLabel} {exploreCopy.followersLabel}
          </span>
        </div>
        <FollowButton
          targetHandle={publication.handle}
          label={exploreCopy.followPublicationLabel}
        />
      </div>
    </article>
  );
}
