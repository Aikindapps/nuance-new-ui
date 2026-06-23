import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import { FollowButton } from "../components/ui/FollowButton/FollowButton";
import { SocialIcon } from "../components/ui/icons/SocialIcon";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { formatCount } from "../lib/formatCount";
import {
  detectSocialPlatform,
  normalizeUrl,
} from "../features/article/lib/socialChannels";
import { useWriterProfile } from "../features/profile/hooks/useWriterProfile";
import { useAuthorPosts } from "../features/profile/hooks/useAuthorPosts";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { writerProfileCopy } from "../constants/copy";

// Reserved single-segment routes that must never fall through to this dynamic
// route. React Router v7 ranks static paths above dynamic ones, so this guard
// is belt-and-suspenders (AC#7). The list mirrors the router entries in
// main.tsx.
const RESERVED = new Set([
  "new",
  "following",
  "write",
  "my-articles",
  "notifications",
  "wallet",
  "publication",
]);

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

// Writer profile skeleton — mirrors the header block shape while data loads.
function ProfileHeaderSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-4 py-12 text-center"
      aria-busy="true"
    >
      <Skeleton variant="circular" width={120} height={120} />
      <Skeleton variant="text" sx={{ width: 200, height: 36 }} />
      <Skeleton variant="text" sx={{ width: 280, height: 28 }} />
      <Skeleton variant="text" sx={{ width: 160, height: 20 }} />
      <Skeleton variant="rectangular" sx={{ width: 120, height: 40, borderRadius: "var(--radius-card)" }} />
    </div>
  );
}

export function WriterProfile() {
  const { handle: rawHandle = "" } = useParams();
  const handle = normalizeHandle(rawHandle);

  // Belt-and-suspenders reserved-handle guard (AC#7).
  if (RESERVED.has(handle)) {
    return (
      <CenteredMessage
        heading={writerProfileCopy.notFoundHeading}
        body={writerProfileCopy.notFoundBody}
      />
    );
  }

  return <WriterProfileInner handle={handle} />;
}

function WriterProfileInner({ handle }: { handle: string }) {
  const profile = useWriterProfile(handle);
  const postsQuery = useAuthorPosts(handle);

  // Whole-page fetch failure (network/canister error).
  if (profile.isError) {
    return (
      <CenteredMessage
        heading={writerProfileCopy.errorHeading}
        body={writerProfileCopy.errorBody}
      />
    );
  }

  // Not found — canister returned err (handle doesn't exist).
  if (!profile.isLoading && profile.data === null) {
    return (
      <CenteredMessage
        heading={writerProfileCopy.notFoundHeading}
        body={writerProfileCopy.notFoundBody}
      />
    );
  }

  const author = profile.data?.item;
  const followingCount = profile.data?.followingCount ?? null;

  const socials = author
    ? author.socialChannelsUrls.map((u) => u.trim()).filter((u) => u !== "")
    : [];
  const website =
    author?.website && author.website.trim() !== "" ? author.website.trim() : null;
  const allLinks = website ? [website, ...socials] : socials;

  const emptyMessage = writerProfileCopy.emptyFeed.replace("{handle}", handle);

  return (
    <PageShell>
      <title>
        {author
          ? `${author.displayName || `@${handle}`} ${writerProfileCopy.metaTitleSuffix}`
          : "Nuance"}
      </title>
      <main>
        {/* ── Profile header ── */}
        <section
          className="mx-auto max-w-[calc(932*var(--fpx))] px-4 py-12 text-center md:px-8 lg:px-0"
          aria-label="Writer profile"
        >
          {profile.isLoading ? (
            <ProfileHeaderSkeleton />
          ) : (
            author && (
              <div className="flex flex-col items-center gap-4">
                <Avatar
                  src={author.avatar}
                  label={author.displayName || author.handle}
                  sizeClass="size-[calc(120*var(--fpx))]"
                  textClass="text-[length:calc(48*var(--fpx))]"
                />

                <div className="flex flex-col items-center gap-1">
                  <h1 className="text-[length:calc(36*var(--fpx))] font-bold leading-tight text-ink truncate max-w-[calc(600*var(--fpx))]">
                    {author.displayName || `@${author.handle}`}
                  </h1>
                  {author.displayName && (
                    <p className="text-body font-medium text-ink-60">
                      @{author.handle}
                    </p>
                  )}
                </div>

                {/* tagline (bio used as tagline per spec; first line) */}
                {author.bio && (
                  <p className="text-[length:calc(22*var(--fpx))] font-bold leading-snug text-ink truncate max-w-[calc(600*var(--fpx))]">
                    {author.bio.split("\n")[0]}
                  </p>
                )}

                {/* Details row: followers | following | social icons */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[length:calc(16*var(--fpx))] font-medium text-ink-60">
                  <span>
                    {formatCount(author.followersCount)}{" "}
                    {writerProfileCopy.followersLabel}
                  </span>
                  {followingCount !== null && (
                    <>
                      <span className="text-ink-border">|</span>
                      <span>
                        {followingCount} {writerProfileCopy.followingLabel}
                      </span>
                    </>
                  )}
                  {allLinks.length > 0 && (
                    <>
                      <span className="text-ink-border">|</span>
                      <span className="flex items-center gap-1">
                        {allLinks.map((url) => (
                          <a
                            key={url}
                            href={normalizeUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Social link"
                            className="flex size-6 items-center justify-center rounded-[calc(2*var(--fpx))] transition-colors hover:bg-ink-border/10"
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

                {/* Full bio (body text, line-clamped) */}
                {author.bio && (
                  <p className="line-clamp-4 max-w-[calc(600*var(--fpx))] text-[length:calc(18*var(--fpx))] font-medium leading-relaxed text-ink-60">
                    {author.bio}
                  </p>
                )}

                <FollowButton
                  targetHandle={author.handle}
                  label={writerProfileCopy.followButtonLabel}
                />
              </div>
            )
          )}
        </section>

        {/* ── Article feed ── */}
        <section
          className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 pb-16 md:px-8 lg:px-14"
          aria-label={writerProfileCopy.feedLabel}
        >
          <ArticleFeed
            query={postsQuery}
            emptyMessage={emptyMessage}
            feedLabel={writerProfileCopy.feedLabel}
          />
        </section>
      </main>
    </PageShell>
  );
}
