import { ArticleFeed } from "./ArticleFeed";
import { useArticles } from "../hooks/useArticles";
import { homeStatus } from "../../../constants/copy";

// PR #5 — Popular tab content for logged-in users. Same useArticles('popular')
// data source (getPopularThisWeek, 7-day window) as the anonymous `/` route;
// logged-in re-hosts it as a plain infinite feed inside HomeLoggedIn's chrome,
// uniform with the New and Following tabs. Replaces the deferred "Your mix"
// recommendations tab — decision #29.

export function PopularTab() {
  const query = useArticles("popular");
  return (
    <ArticleFeed
      query={query}
      emptyMessage={`${homeStatus.emptyTitle} ${homeStatus.emptyBody}`}
      feedLabel="Popular articles on Nuance"
    />
  );
}
