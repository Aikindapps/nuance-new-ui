import { ArticleFeed } from "./ArticleFeed";
import { PopularWriters } from "./PopularWriters";
import { PopularPublications } from "./PopularPublications";
import { useArticles } from "../hooks/useArticles";
import { homeStatus } from "../../../constants/copy";

// Logged-in tab content for the Popular and New feeds. Both are plain
// infinite ArticleFeeds over useArticles(variant) — the same data source as
// the anonymous `/` and `/new` routes, re-hosted inside HomeLoggedIn's chrome
// (header + welcome banner + topics + write-CTA + tab bar). FollowingTab
// stays a separate component (different hook + auth gating). Decision #29.

type Variant = "popular" | "new";

const FEED_LABEL: Record<Variant, string> = {
  popular: "Popular articles on Nuance",
  new: "New articles on Nuance",
};

export function ArticleTab({ variant }: { variant: Variant }) {
  const query = useArticles(variant);
  return (
    <ArticleFeed
      query={query}
      emptyMessage={`${homeStatus.emptyTitle} ${homeStatus.emptyBody}`}
      feedLabel={FEED_LABEL[variant]}
      collapsePartialRows
      afterFeatured={
        <>
          <div className="mt-12 md:mt-14 lg:mt-16">
            <PopularWriters />
          </div>
          <div className="mt-12 md:mt-14 lg:mt-16">
            <PopularPublications />
          </div>
        </>
      }
    />
  );
}
