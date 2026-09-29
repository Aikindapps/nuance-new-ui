import { useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import { FollowButton } from "../components/ui/FollowButton/FollowButton";
import { IconChevronRight } from "../components/ui/icons/IconChevronRight";
import {
  ArticleFeed,
  ArticleFeedSkeleton,
} from "../features/home/sections/ArticleFeed";
import { formatCount } from "../lib/formatCount";
import { usePublication } from "../features/publication/hooks/usePublication";
import { usePublicationPosts } from "../features/publication/hooks/usePublicationPosts";
import { usePublicationCta } from "../features/publication/hooks/usePublicationCta";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { publicationCopy } from "../constants/copy";
import { PublicationCtaBar } from "../features/publication/sections/PublicationCtaBar";
import { isCtaEmpty } from "../features/publication/lib/cta";
import { usePublicationSettings } from "../features/publication/hooks/usePublicationSettings";
import { PublicationCategoryTabs } from "../features/publication/sections/PublicationCategoryTabs";
import {
  categoryPath,
  categoryTabs,
} from "../features/publication/lib/categories";

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
  const { h: rawHandle = "", category } = useParams();
  const handle = normalizeHandle(rawHandle);
  // NIC-537: the category slug from /publication/:handle/:category (the
  // router has already decoded it), lowercased like the canister's slug.
  // null = the All tab.
  const categoryParam = category === undefined ? null : category.toLowerCase();

  return (
    <PublicationHomeInner handle={handle} categoryParam={categoryParam} />
  );
}

function PublicationHomeInner({
  handle,
  categoryParam,
}: {
  handle: string;
  categoryParam: string | null;
}) {
  const location = useLocation();
  const publication = usePublication(handle);
  // The publication's categories, in saved order. Same public read and
  // query key as the Settings screen, so an editor's save there refreshes
  // these tabs.
  const settings = usePublicationSettings(handle);
  const tabs = useMemo(
    () => categoryTabs(settings.publication?.categories ?? []),
    [settings.publication],
  );
  const activeTab =
    categoryParam === null
      ? null
      : (tabs.find((t) => t.slug === categoryParam) ?? null);
  // A category list starts loading from the URL straight away, alongside
  // the category list read that confirms the slug.
  const postsQuery = usePublicationPosts(handle, categoryParam);
  const ctaQuery = usePublicationCta(handle);

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

  // Unknown slug (a removed or renamed category, or a bad link), or the
  // category list couldn't be read: back to All.
  if (categoryParam !== null && !settings.isLoading && activeTab === null) {
    return <Navigate to={`/publication/${handle}`} replace />;
  }

  // A known category reached through a differently written link (the old
  // app put "&", "," and ":" in the URL as-is): move to the tab's own URL
  // so the tab shows as selected.
  if (activeTab !== null) {
    const canonical = categoryPath(handle, activeTab.slug);
    if (location.pathname.toLowerCase() !== canonical.toLowerCase()) {
      return <Navigate to={canonical} replace />;
    }
  }

  const pub = publication.data?.item;
  const publishedCount = publication.data?.publishedCount ?? "0";

  const emptyMessage =
    activeTab !== null
      ? publicationCopy.categoryEmptyFeed.replace(
          "{category}",
          () => activeTab.label.trim(),
        )
      : publicationCopy.emptyFeed.replace(
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
          {/* 2. Category tab bar: All + the publication's categories (NIC-537).
              Only All until the category list arrives, or when it fails. */}
          <div className="mt-6">
            <PublicationCategoryTabs
              handle={handle}
              tabs={tabs}
              activeSlug={activeTab?.slug ?? null}
            />
          </div>

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

          {/* ── 3b. CTA banner (NIC-378) — between identity block and article feed ── */}
          {ctaQuery.cta && !isCtaEmpty(ctaQuery.cta) && (
            <div className="mt-6">
              <PublicationCtaBar
                ctaCopy={ctaQuery.cta.ctaCopy}
                buttonCopy={ctaQuery.cta.buttonCopy}
                link={ctaQuery.cta.link}
                icon={ctaQuery.cta.icon}
                primaryColor={ctaQuery.primaryColor}
              />
            </div>
          )}

          {/* ── 4. Article feed ── */}
          <section
            className="mt-10 pb-16 md:mt-12 lg:mt-14"
            aria-label={publicationCopy.feedLabel}
          >
            {categoryParam !== null && activeTab === null ? (
              // A category URL while the category list is still loading.
              <ArticleFeedSkeleton />
            ) : (
              <ArticleFeed
                query={postsQuery}
                emptyMessage={emptyMessage}
                feedLabel={publicationCopy.feedLabel}
              />
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}
