import { useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { PageShell, CenteredMessage } from "../components/ui/CenteredMessage";
import { ExplorePublicationRow } from "../features/explore/sections/ExplorePublicationRow";
import { useAllPublications } from "../features/explore/hooks/useAllPublications";
import { exploreCopy } from "../constants/copy";

// NIC-43 / NIC-291 — /explore/publications
// Paginated list of ALL publications, sourced from the full publication registry
// via getPublicationCanisters (PostCore), then hydrated via getUsersByHandles.
// Replaced the earlier popular/latest post-sampling approach (useExploreDiscovery).

const INITIAL_VISIBLE = 6;
const PAGE_SIZE = 6;

export function ExplorePublications() {
  const pubsResult = useAllPublications();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const title = exploreCopy.publicationsTitle;

  if (pubsResult.isError) {
    return (
      <CenteredMessage
        heading={exploreCopy.errorHeading}
        body={exploreCopy.publicationsErrorBody}
        actionHref="/"
        actionLabel={exploreCopy.backHomeLabel}
      />
    );
  }

  const pubs = pubsResult.publications;

  if (!pubsResult.isLoading && pubs.length === 0) {
    return (
      <CenteredMessage
        heading={exploreCopy.emptyHeading}
        body={exploreCopy.publicationsEmptyBody}
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

          <section
            className="mt-8 pb-16 md:mt-10 lg:mt-12"
            aria-label={title}
          >
            {pubsResult.isLoading ? (
              <div className="flex flex-col gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    sx={{ height: 120, borderRadius: "var(--radius-card)" }}
                  />
                ))}
              </div>
            ) : (
              <>
                <ul className="flex flex-col gap-4">
                  {pubs.slice(0, visible).map((pub) => (
                    <li key={pub.handle}>
                      <ExplorePublicationRow publication={pub} />
                    </li>
                  ))}
                </ul>

                {pubs.length > visible && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
                    >
                      {exploreCopy.loadMore}
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
