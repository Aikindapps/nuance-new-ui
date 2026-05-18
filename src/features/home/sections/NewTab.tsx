import { ArticleFeed } from "./ArticleFeed";
import { useArticles } from "../hooks/useArticles";
import { homeStatus } from "../../../constants/copy";

// New tab content for logged-in users. Same useArticles('new') data source
// as the anonymous /new route; logged-in just re-hosts that surface inside
// HomeLoggedIn's chrome (header + welcome banner + topics + write-CTA + tab
// bar). Uniform with PopularTab and FollowingTab — all three logged-in tabs
// are plain infinite feeds via the shared ArticleFeed renderer.

export function NewTab() {
  const query = useArticles("new");
  return (
    <ArticleFeed
      query={query}
      emptyMessage={`${homeStatus.emptyTitle} ${homeStatus.emptyBody}`}
      feedLabel="New articles on Nuance"
    />
  );
}
