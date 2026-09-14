import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@mui/material/Button";
import { useAllPublications } from "../../explore/hooks/useAllPublications";
import { ExplorePublicationRow } from "../../explore/sections/ExplorePublicationRow";
import { exploreCopy, homeSwitchCopy } from "../../../constants/copy";
import { secondaryButtonSx } from "../../../components/ui/modalButtons";

const INITIAL_VISIBLE = 6;
const PAGE_SIZE = 6;

// Skeleton placeholder shaped like an ExplorePublicationRow card.
// Uses bg-ink-border/10 + animate-pulse — NO MUI Skeleton (off-token).
function PublicationRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-ink-border/20 bg-white p-6 sm:flex-row sm:items-center md:p-8">
      {/* Avatar */}
      <div className="size-[calc(80*var(--fpx))] shrink-0 rounded-card bg-ink-border/10 md:size-[calc(100*var(--fpx))]" />
      {/* Text lines */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-6 w-40 rounded bg-ink-border/10" />
        <div className="h-4 w-64 rounded bg-ink-border/10" />
        <div className="h-4 w-48 rounded bg-ink-border/10" />
      </div>
      {/* Follow area */}
      <div className="hidden w-px shrink-0 self-stretch bg-ink-border/10 md:block" />
      <div className="flex shrink-0 flex-col gap-2">
        <div className="h-4 w-24 rounded bg-ink-border/10" />
        <div className="h-10 w-36 rounded-card bg-ink-border/10" />
      </div>
    </div>
  );
}

// Publications body for the logged-in Home Tier-1 switch (NIC-325).
// Reuses useAllPublications + ExplorePublicationRow; no sort row.
export function HomePublicationsView() {
  const { publications, isLoading, isError } = useAllPublications();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4 animate-pulse">
        {Array.from({ length: 6 }, (_, i) => (
          <PublicationRowSkeleton key={i} />
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
        <p className="mt-2 text-body">{exploreCopy.publicationsErrorBody}</p>
        <div className="mt-4">
          <Button
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={() =>
              queryClient.refetchQueries({ queryKey: ["all-publications"] })
            }
          >
            {exploreCopy.topicsRetryLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center">
        <p className="mx-auto max-w-2xl text-body text-ink-80">
          {exploreCopy.publicationsEmptyBody}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {publications.slice(0, visible).map((pub) => (
          <li key={pub.handle}>
            <ExplorePublicationRow publication={pub} />
          </li>
        ))}
      </ul>

      {publications.length > visible && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            {homeSwitchCopy.showMorePublications}
          </Button>
        </div>
      )}
    </>
  );
}
