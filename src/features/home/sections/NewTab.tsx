import { ArticleFeed } from "./ArticleFeed";
import { useArticles } from "../hooks/useArticles";
import { homeStatus } from "../../../constants/copy";

// Phase 6 — New tab content for logged-in users. Same useArticles('new')
// data source as the anonymous /new route; logged-in just re-hosts that
// surface inside HomeLoggedIn's chrome (header + welcome banner + topics +
// write-CTA + tab bar). PR #5 may revisit this if recs sections land here
// too, but the plan keeps logged-in New identical to logged-out New for now.

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
