import { Link, useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { PerformanceDashboard } from "../features/publication/sections/PerformanceDashboard";
import { performanceCopy } from "../constants/copy";
import { AccountShell } from "../components/account/AccountShell";

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

function CenteredBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-title-md font-bold text-ink">{heading}</h1>
      <p className="mt-2 text-body text-ink-80">{body}</p>
    </div>
  );
}

export function PublicationPerformance() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return (
    <AccountShell active="publications">
      <PublicationPerformanceInner handle={handle} />
    </AccountShell>
  );
}

function PublicationPerformanceInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredBlock
        heading={performanceCopy.errorHeading}
        body={performanceCopy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-member.
  if (!membership.isAuthenticated || (!membership.isLoading && !membership.isMember)) {
    return (
      <CenteredBlock
        heading={performanceCopy.notAuthorizedHeading}
        body={performanceCopy.notAuthorizedBody}
      />
    );
  }

  // Membership query in flight.
  if (membership.isLoading) {
    return (
      <div className="flex justify-center py-24" aria-busy="true">
        <Skeleton variant="text" sx={{ width: 240, height: 32 }} />
      </div>
    );
  }

  // Authenticated member.
  return (
    <>
      <title>
        {performanceCopy.title} {performanceCopy.metaTitleSuffix}
      </title>
      <h1 className="text-[length:calc(36*var(--fpx))] font-bold text-ink">
        {performanceCopy.title}
      </h1>
      <Link
        to={`/publication/${handle}/manage/articles`}
        className="mt-2 inline-flex items-center text-sm font-medium text-brand-purple hover:underline"
      >
        ← {performanceCopy.backToArticles}
      </Link>
      <div className="mt-8">
        <PerformanceDashboard handle={handle} />
      </div>
    </>
  );
}
