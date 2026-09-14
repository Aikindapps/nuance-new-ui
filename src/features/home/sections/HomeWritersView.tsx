import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@mui/material/Button";
import { useAllWriters } from "../../explore/hooks/useAllWriters";
import { ExploreWriterCard } from "../../explore/sections/ExploreWriterCard";
import { exploreCopy, homeSwitchCopy } from "../../../constants/copy";
import { secondaryButtonSx } from "../../../components/ui/modalButtons";

const INITIAL_VISIBLE = 20;
const PAGE_SIZE = 20;

// Skeleton placeholder shaped like an ExploreWriterCard.
// Uses bg-ink-border/10 + animate-pulse — NO MUI Skeleton (off-token).
function WriterCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-ink-border/20 bg-white p-6 md:p-7 lg:p-8">
      {/* Avatar circle */}
      <div className="size-[calc(96*var(--fpx))] rounded-full bg-ink-border/10 lg:size-[calc(120*var(--fpx))]" />
      {/* Handle line */}
      <div className="h-5 w-28 rounded bg-ink-border/10" />
      {/* Followers line */}
      <div className="h-4 w-20 rounded bg-ink-border/10" />
      {/* Bio lines */}
      <div className="h-4 w-full rounded bg-ink-border/10" />
      <div className="h-4 w-3/4 rounded bg-ink-border/10" />
      {/* Follow button */}
      <div className="h-10 w-28 rounded-card bg-ink-border/10" />
    </div>
  );
}

// Writers body for the logged-in Home Tier-1 switch (NIC-325).
// Reuses useAllWriters + ExploreWriterCard; no sort row.
// Desktop column count: 5 columns at lg (1440px) — matches the frame spec
// default (task says use grid-cols-5 at lg unless DESIGN CONTEXT differs;
// DESIGN CONTEXT was unavailable so the spec default of 5 is used).
export function HomeWritersView() {
  const { writers, isLoading, isError } = useAllWriters();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const queryClient = useQueryClient();

  const gridClass =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6";

  if (isLoading) {
    return (
      <div aria-busy="true" className={`${gridClass} animate-pulse`}>
        {Array.from({ length: 10 }, (_, i) => (
          <WriterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-card border border-ink-60/30 bg-ink-60/5 p-6 text-ink-80"
      >
        <p className="font-bold text-ink">{exploreCopy.errorHeading}</p>
        <p className="mt-2 text-body">{exploreCopy.writersErrorBody}</p>
        <div className="mt-4">
          <Button
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={() =>
              queryClient.refetchQueries({ queryKey: ["all-writers"] })
            }
          >
            {exploreCopy.topicsRetryLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (writers.length === 0) {
    return (
      <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center">
        <p className="mx-auto max-w-2xl text-body text-ink-80">
          {exploreCopy.writersEmptyBody}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className={gridClass}>
        {writers.slice(0, visible).map((author) => (
          <li key={author.handle}>
            <ExploreWriterCard author={author} />
          </li>
        ))}
      </ul>

      {writers.length > visible && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            {homeSwitchCopy.showMoreWriters}
          </Button>
        </div>
      )}
    </>
  );
}
