import { Navigate, useSearchParams } from "react-router-dom";
import { Tab } from "../components/ui/Tab";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { useSearchPosts } from "../features/search/hooks/useSearchPosts";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { searchCopy } from "../constants/copy";

// NIC-41 Search Phase 1 — /search/articles?q=...
//
// 4-tab bar: Articles is active (NavLink); Writers/Publications/Topics are
// disabled <span> tooltips ("Coming soon"). No routes for the other tabs.

export function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const searchQuery = useSearchPosts(q);

  if (!q.trim()) {
    // No query: show a neutral prompt.
    return (
      <CenteredMessage
        heading={searchCopy.emptyPromptHeading}
        body={searchCopy.emptyPromptBody}
      />
    );
  }

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
              <Tab to={`/search/articles?q=${encodeURIComponent(q)}`} end>
                {searchCopy.articlesTab}
              </Tab>
              <DisabledTab>{searchCopy.writersTab}</DisabledTab>
              <DisabledTab>{searchCopy.publicationsTab}</DisabledTab>
              <DisabledTab>{searchCopy.topicsTab}</DisabledTab>
            </div>
          </nav>

          {/* ── Results ── */}
          <section
            className="mt-10 pb-16 md:mt-12 lg:mt-14"
            aria-label={searchCopy.feedLabel}
          >
            <ArticleFeed
              query={searchQuery}
              emptyMessage={searchCopy.noResults.replace("{q}", q)}
              feedLabel={searchCopy.feedLabel}
            />
          </section>
        </div>
      </main>
    </PageShell>
  );
}

function DisabledTab({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-disabled="true"
      title="Coming soon"
      className="flex items-center justify-center px-[calc(25*var(--fpx))] py-3 text-body font-medium text-ink-60 cursor-not-allowed"
    >
      {children}
    </span>
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
