import { useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { PageShell, CenteredMessage } from "../components/ui/CenteredMessage";
import { ExploreWriterCard } from "../features/explore/sections/ExploreWriterCard";
import { useAllWriters } from "../features/explore/hooks/useAllWriters";
import { exploreCopy } from "../constants/copy";

// NIC-292 — /explore/writers
// Lists ALL writers from the full handle registry (publications excluded).
// Replaced the earlier popular/latest post-sampling approach (useExploreDiscovery).

const INITIAL_VISIBLE = 12;
const PAGE_SIZE = 12;

export function ExploreWriters() {
  const writersResult = useAllWriters();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const title = exploreCopy.writersTitle;

  if (writersResult.isError) {
    return (
      <CenteredMessage
        heading={exploreCopy.errorHeading}
        body={exploreCopy.writersErrorBody}
        actionHref="/"
        actionLabel={exploreCopy.backHomeLabel}
      />
    );
  }

  const writers = writersResult.writers;

  if (!writersResult.isLoading && writers.length === 0) {
    return (
      <CenteredMessage
        heading={exploreCopy.emptyHeading}
        body={exploreCopy.writersEmptyBody}
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
            {writersResult.isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    sx={{ height: 340, borderRadius: "var(--radius-card)" }}
                  />
                ))}
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {writers.slice(0, visible).map((author) => (
                    <li key={author.handle}>
                      <ExploreWriterCard author={author} />
                    </li>
                  ))}
                </ul>

                {writers.length > visible && (
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
