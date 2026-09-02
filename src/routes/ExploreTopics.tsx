import { useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { PageShell, CenteredMessage } from "../components/ui/CenteredMessage";
import { TopicFollowPill } from "../features/article/sections/TopicFollowPill";
import { useAllTags } from "../features/onboarding/useAllTags";
import { exploreCopy } from "../constants/copy";

// NIC-139 — /explore/topics
// All-topics Explore index. Renders a flex-wrap grid of topic pills from
// getAllTags(); each pill deep-links to /explore/topic/:tag (lowercased —
// searchByTag index keys are lowercase, the NIC-92 casing fix). Not
// personalized, so the title/body are identical logged-in and logged-out;
// only the PageShell header differs by auth.

const INITIAL_VISIBLE = 48;
const PAGE_SIZE = 48;

export function ExploreTopics() {
  const tags = useAllTags();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const title = exploreCopy.topicsTitle;

  if (tags.isError) {
    return (
      <CenteredMessage
        heading={exploreCopy.topicsErrorHeading}
        body={exploreCopy.topicsErrorBody}
        actionLabel={exploreCopy.topicsRetryLabel}
        onAction={() => tags.refetch()}
        role="alert"
      />
    );
  }

  const allTags = tags.data ?? [];

  if (!tags.isLoading && allTags.length === 0) {
    return (
      <CenteredMessage
        heading={exploreCopy.topicsEmptyHeading}
        body={exploreCopy.topicsEmptyBody}
        actionHref="/"
        actionLabel={exploreCopy.backHomeLabel}
      />
    );
  }

  return (
    <PageShell>
      <title>{`${title} ${exploreCopy.metaTitleSuffix}`}</title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          <h1 className="mt-8 text-center text-[length:calc(36*var(--fpx))] font-bold text-ink md:mt-10 lg:mt-12">
            {title}
          </h1>

          <section className="mt-8 pb-16 md:mt-10 lg:mt-12" aria-label={title}>
            {tags.isLoading ? (
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
            ) : (
              <>
                <ul className="flex flex-wrap gap-4">
                  {allTags.slice(0, visible).map((tag) => (
                    <li key={tag.id}>
                      <TopicFollowPill tag={{ tagId: tag.id, tagName: tag.value }} />
                    </li>
                  ))}
                </ul>

                {allTags.length > visible && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
                    >
                      {exploreCopy.topicsLoadMore}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}
