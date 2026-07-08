import { useParams } from "react-router-dom";
import { PageShell, CenteredMessage } from "../components/ui/CenteredMessage";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { useTopicPosts } from "../features/explore/hooks/useTopicPosts";
import { exploreCopy } from "../constants/copy";

// NIC-43 — /explore/topic/:tag
// Displays a feed of articles tagged with the given topic.
// Tag is passed verbatim to searchByTag (case-sensitive exact match).

export function ExploreTopic() {
  const { tag = "" } = useParams();

  if (!tag.trim()) {
    return (
      <CenteredMessage
        heading={exploreCopy.emptyHeading}
        body={exploreCopy.topicEmpty.replace("{tag}", tag)}
        actionHref="/"
        actionLabel={exploreCopy.backHomeLabel}
      />
    );
  }

  return <ExploreTopicContent tag={tag} />;
}

function ExploreTopicContent({ tag }: { tag: string }) {
  const query = useTopicPosts(tag);
  const totalCount = query.data?.pages[0]?.totalCount;

  const articleCountLine =
    totalCount !== undefined
      ? totalCount === 1
        ? exploreCopy.topicArticleCountOne
        : exploreCopy.topicArticleCount.replace("{count}", String(totalCount))
      : null;

  return (
    <PageShell>
      <title>{`${tag} ${exploreCopy.metaTitleSuffix}`}</title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          {/* Hero */}
          <div className="mt-8 mb-6 text-center md:mt-10 md:mb-8 lg:mt-12 lg:mb-10">
            <h1 className="text-[length:calc(36*var(--fpx))] font-bold text-ink lg:text-[length:calc(48*var(--fpx))]">
              {tag}
            </h1>
            {articleCountLine && (
              <p className="mt-2 text-body text-ink-80">{articleCountLine}</p>
            )}
          </div>

          {/* Feed */}
          <section
            className="pb-16"
            aria-label={exploreCopy.topicFeedLabel.replace("{tag}", tag)}
          >
            <ArticleFeed
              query={query}
              emptyMessage={exploreCopy.topicEmpty.replace("{tag}", tag)}
              feedLabel={exploreCopy.topicFeedLabel.replace("{tag}", tag)}
            />
          </section>
        </div>
      </main>
    </PageShell>
  );
}
