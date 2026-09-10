import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { ManageArticlesList } from "../features/publication/sections/ManageArticlesList";
import { manageArticlesCopy } from "../constants/copy";
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

export function ManageArticles() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return (
    <AccountShell active="publications">
      <ManageArticlesInner handle={handle} />
    </AccountShell>
  );
}

function ManageArticlesInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredBlock
        heading={manageArticlesCopy.errorHeading}
        body={manageArticlesCopy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-member.
  if (!membership.isAuthenticated || (!membership.isLoading && !membership.isMember)) {
    return (
      <CenteredBlock
        heading={manageArticlesCopy.notAuthorizedHeading}
        body={manageArticlesCopy.notAuthorizedBody}
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

  // Authenticated member — 6.1 article list + publish toggle (NIC-63).
  return (
    <>
      <title>
        {manageArticlesCopy.title} {manageArticlesCopy.metaTitleSuffix}
      </title>
      <h1 className="text-[length:calc(36*var(--fpx))] font-bold text-ink">
        {manageArticlesCopy.title}
      </h1>
      <div className="mt-8">
        <ManageArticlesList handle={handle} />
      </div>
    </>
  );
}
