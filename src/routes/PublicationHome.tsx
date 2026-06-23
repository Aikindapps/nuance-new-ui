import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import { FollowButton } from "../components/ui/FollowButton/FollowButton";
import { Tab } from "../components/ui/Tab";
import { IconChevronRight } from "../components/ui/icons/IconChevronRight";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { formatCount } from "../lib/formatCount";
import { usePublication } from "../features/publication/hooks/usePublication";
import { usePublicationPosts } from "../features/publication/hooks/usePublicationPosts";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { publicationCopy } from "../constants/copy";

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

// Publication identity-block skeleton while data loads.
function IdentityBlockSkeleton() {
  return (
    <div
      className="flex items-center gap-8 rounded-card border border-black/20 bg-white px-12 py-10"
      aria-busy="true"
    >
      <Skeleton variant="rounded" width={140} height={140} sx={{ borderRadius: "var(--radius-card)", flexShrink: 0 }} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton variant="text" sx={{ width: "50%", height: 36 }} />
        <Skeleton variant="text" sx={{ width: "70%", height: 28 }} />
        <Skeleton variant="text" sx={{ width: "80%", height: 22 }} />
      </div>
    </div>
  );
}

export function PublicationHome() {
  const { h: rawHandle = "" } = useParams();
  const handle = normalizeHandle(rawHandle);

  return <PublicationHomeInner handle={handle} />;
}

function PublicationHomeInner({ handle }: { handle: string }) {
  const publication = usePublication(handle);
  const postsQuery = usePublicationPosts(handle);

  // Whole-page fetch failure (network/canister error).
  if (publication.isError) {
    return (
      <CenteredMessage
        heading={publicationCopy.errorHeading}
        body={publicationCopy.errorBody}
      />
    );
  }

  // Not found — canister returned err.
  if (!publication.isLoading && publication.data === null) {
    return (
      <CenteredMessage
        heading={publicationCopy.notFoundHeading}
        body={publicationCopy.notFoundBody}
      />
    );
  }

  const pub = publication.data?.item;
  const publishedCount = publication.data?.publishedCount ?? "0";

  const emptyMessage = publicationCopy.emptyFeed.replace(
    "{name}",
    pub?.displayName || handle,
  );

  return (
    <PageShell>
      <title>
        {pub
          ? `${pub.displayName || handle} ${publicationCopy.metaTitleSuffix}`
          : "Nuance"}
      </title>
      <main>
        {/* ── 1. Banner / cover ── */}
        <div className="w-full bg-brand-purple">
          {pub?.avatar ? (
            <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 py-6 md:px-8 lg:px-14">
              <img
                src={pub.avatar}
                alt={pub.displayName || handle}
                className="h-[calc(440*var(--fpx))] w-full rounded-card object-cover"
              />
            </div>
          ) : (
            <div className="h-[calc(80*var(--fpx))]" aria-hidden />
          )}
        </div>

        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          {/* ── 2. Category tab bar (All only — no canister source per F6) ── */}
          <nav
            className="mt-6 border-b border-ink-border/20"
            aria-label="Publication categories"
          >
            <div className="flex">
              <Tab to={`/publication/${handle}`} end>
                {publicationCopy.allTab}
              </Tab>
            </div>
          </nav>

          {/* ── 3. Identity block ── */}
          <section className="mt-8" aria-label="Publication details">
            {publication.isLoading ? (
              <IdentityBlockSkeleton />
            ) : (
              pub && (
                <div className="flex flex-col gap-8 rounded-card border border-black/20 bg-white px-6 py-8 md:flex-row md:items-start md:px-12 md:py-10 lg:gap-12">
                  {/* Logo */}
                  <Avatar
                    src={pub.avatar}
                    label={pub.displayName || pub.handle}
                    sizeClass="size-[calc(140*var(--fpx))]"
                    textClass="text-[length:calc(56*var(--fpx))]"
                    rounded="card"
                  />

                  {/* Text block */}
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <h1 className="truncate text-[length:calc(36*var(--fpx))] font-bold leading-tight text-ink">
                      {pub.displayName || pub.handle}
                    </h1>
                    {pub.bio && (
                      <>
                        <p className="truncate text-[length:calc(22*var(--fpx))] font-bold text-ink">
                          {pub.bio.split("\n")[0]}
                        </p>
                        <p className="line-clamp-3 text-[length:calc(18*var(--fpx))] font-medium leading-relaxed text-ink-60">
                          {pub.bio}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Vertical divider (hidden on small screens) */}
                  <div
                    className="hidden w-px shrink-0 self-stretch bg-ink-border/20 md:block"
                    aria-hidden
                  />

                  {/* Specs + CTA */}
                  <div className="flex shrink-0 flex-col items-start gap-4">
                    <ul className="flex flex-col gap-2">
                      <li className="flex items-center gap-2 text-[length:calc(18*var(--fpx))] font-medium text-ink-60">
                        <IconChevronRight className="size-3 shrink-0 text-ink-60" />
                        <span>
                          {formatCount(pub.followersCount)}{" "}
                          {publicationCopy.followersLabel}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[length:calc(18*var(--fpx))] font-medium text-ink-60">
                        <IconChevronRight className="size-3 shrink-0 text-ink-60" />
                        <span>
                          {formatCount(publishedCount)}{" "}
                          {publicationCopy.articlesLabel}
                        </span>
                      </li>
                    </ul>
                    <FollowButton
                      targetHandle={pub.handle}
                      label={publicationCopy.followButtonLabel}
                    />
                  </div>
                </div>
              )
            )}
          </section>

          {/* ── 4. Article feed ── */}
          <section
            className="mt-10 pb-16 md:mt-12 lg:mt-14"
            aria-label={publicationCopy.feedLabel}
          >
            <ArticleFeed
              query={postsQuery}
              emptyMessage={emptyMessage}
              feedLabel={publicationCopy.feedLabel}
            />
          </section>
        </div>
      </main>
    </PageShell>
  );
}
