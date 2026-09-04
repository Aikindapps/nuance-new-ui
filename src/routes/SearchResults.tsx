import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Tab } from "../components/ui/Tab";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { useSearchPosts } from "../features/search/hooks/useSearchPosts";
import { useSearchUsers } from "../features/search/hooks/useSearchUsers";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { ExploreWriterCard } from "../features/explore/sections/ExploreWriterCard";
import { ExplorePublicationRow } from "../features/explore/sections/ExplorePublicationRow";
import { TopicFollowPill } from "../features/article/sections/TopicFollowPill";
import { useAllTags } from "../features/onboarding/useAllTags";
import { searchCopy } from "../constants/copy";

// NIC-41/NIC-60 Search Phase 1 + Phase 2 — /search/<tab>?q=...
//
// Four tabs: Articles (NIC-41), Writers / Publications / Topics (NIC-60).
// Each tab is a NavLink that preserves ?q=.

// ── Topics sub-components ────────────────────────────────────────────────────

const TOPICS_INITIAL_VISIBLE = 48;
const TOPICS_PAGE_SIZE = 48;

function TopicsResults({ q }: { q: string }) {
  const tags = useAllTags();
  const [visible, setVisible] = useState(TOPICS_INITIAL_VISIBLE);

  // Reset "Show more" count whenever the query changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setVisible(TOPICS_INITIAL_VISIBLE), [q]);

  const lcq = q.trim().toLowerCase();
  const allTags = tags.data ?? [];

  const matched = allTags.filter((t) => t.value.toLowerCase().includes(lcq));
  matched.sort((a, b) => {
    const aStarts = a.value.toLowerCase().startsWith(lcq);
    const bStarts = b.value.toLowerCase().startsWith(lcq);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.value.toLowerCase().localeCompare(b.value.toLowerCase());
  });

  if (tags.isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{
              height: "calc(48 * var(--fpx))",
              width: `calc(${[96, 128, 112, 144, 104][i % 5]} * var(--fpx))`,
              borderRadius: 9999,
            }}
          />
        ))}
      </div>
    );
  }

  if (!tags.isLoading && matched.length === 0) {
    return (
      <div className="py-16 text-center text-ink-60">
        {searchCopy.topicsNoResults.replace("{q}", q)}
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-wrap gap-4">
        {matched.slice(0, visible).map((tag) => (
          <li key={tag.id}>
            <TopicFollowPill tag={{ tagId: tag.id, tagName: tag.value }} />
          </li>
        ))}
      </ul>

      {matched.length > visible && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + TOPICS_PAGE_SIZE)}
            className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
          >
            {searchCopy.loadMore}
          </button>
        </div>
      )}
    </>
  );
}

// ── Writers sub-component ────────────────────────────────────────────────────

function WritersResults({ q }: { q: string }) {
  const { writers, isLoading, isError } = useSearchUsers(q);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ height: 340, borderRadius: "var(--radius-card)" }}
          />
        ))}
      </div>
    );
  }

  if (isError || (!isLoading && writers.length === 0)) {
    return (
      <div className="py-16 text-center text-ink-60">
        {isError
          ? searchCopy.errorBody
          : searchCopy.writersNoResults.replace("{q}", q)}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {writers.map((author) => (
        <li key={author.handle}>
          <ExploreWriterCard author={author} />
        </li>
      ))}
    </ul>
  );
}

// ── Publications sub-component ───────────────────────────────────────────────

function PublicationsResults({ q }: { q: string }) {
  const { publications, isLoading, isError } = useSearchUsers(q);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ height: 120, borderRadius: "var(--radius-card)" }}
          />
        ))}
      </div>
    );
  }

  if (isError || (!isLoading && publications.length === 0)) {
    return (
      <div className="py-16 text-center text-ink-60">
        {isError
          ? searchCopy.errorBody
          : searchCopy.publicationsNoResults.replace("{q}", q)}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {publications.map((pub) => (
        <li key={pub.handle}>
          <ExplorePublicationRow publication={pub} />
        </li>
      ))}
    </ul>
  );
}

// ── Main SearchResults shell ─────────────────────────────────────────────────

export function SearchResults({ tab }: { tab: "articles" | "writers" | "publications" | "topics" }) {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  // Only fire the Articles search query on the Articles tab; pass "" on other
  // tabs so useSearchPosts (enabled: q.trim() !== "") skips the network call.
  const searchQuery = useSearchPosts(tab === "articles" ? q : "");

  if (!q.trim()) {
    // No query: show a neutral prompt for all tabs.
    return (
      <CenteredMessage
        heading={searchCopy.emptyPromptHeading}
        body={searchCopy.emptyPromptBody}
      />
    );
  }

  const qs = encodeURIComponent(q);

  return (
    <PageShell>
      <title>{`${searchCopy.resultsTitle.replace("{q}", q)} ${searchCopy.metaTitleSuffix}`}</title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          {/* ── Title ── */}
          <h1 className="mt-8 text-[length:calc(36*var(--fpx))] font-bold text-ink">
            {searchCopy.resultsTitle.replace("{q}", q)}
          </h1>

          {/* ── Tab bar ── */}
          <nav
            className="mt-6 border-b border-ink-border/20"
            aria-label="Search result categories"
          >
            <div className="flex">
              <Tab to={`/search/articles?q=${qs}`} end>
                {searchCopy.articlesTab}
              </Tab>
              <Tab to={`/search/writers?q=${qs}`} end>
                {searchCopy.writersTab}
              </Tab>
              <Tab to={`/search/publications?q=${qs}`} end>
                {searchCopy.publicationsTab}
              </Tab>
              <Tab to={`/search/topics?q=${qs}`} end>
                {searchCopy.topicsTab}
              </Tab>
            </div>
          </nav>

          {/* ── Results ── */}
          <section
            className="mt-10 pb-16 md:mt-12 lg:mt-14"
            aria-label={searchCopy.feedLabel}
          >
            {tab === "articles" && (
              <ArticleFeed
                query={searchQuery}
                emptyMessage={searchCopy.noResults.replace("{q}", q)}
                feedLabel={searchCopy.feedLabel}
              />
            )}
            {tab === "writers" && <WritersResults q={q} />}
            {tab === "publications" && <PublicationsResults q={q} />}
            {tab === "topics" && <TopicsResults q={q} />}
          </section>
        </div>
      </main>
    </PageShell>
  );
}

// /search → /search/articles (preserving ?q= if present).
export function SearchRedirect() {
  const [params] = useSearchParams();
  const q = params.get("q");
  const to = q
    ? `/search/articles?q=${encodeURIComponent(q)}`
    : "/search/articles";
  return <Navigate to={to} replace />;
}
