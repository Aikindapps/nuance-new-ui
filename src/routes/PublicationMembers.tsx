// NIC-562 -- Publication Members route (display only).
//
// Mirrors PublicationSettings' editor gate exactly: AccountShell
// active="publications"; membership error -> CenteredBlock error; signed out
// or loaded non-editor -> CenteredBlock "Access restricted"; membership
// loading -> MembersRoster in its loading state (no flash between the gate
// and the data); editor -> usePublicationMembers(handle) + the caller's own
// principal -> MembersRoster.

import { useParams } from "react-router-dom";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { usePublicationMembers } from "../features/publication/hooks/usePublicationMembers";
import { MembersRoster } from "../features/publication/sections/MembersRoster";
import { publicationMembersCopy as copy } from "../constants/copy";
import { AccountShell } from "../components/account/AccountShell";
import { useAuth } from "../contexts/useAuth";

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

export function PublicationMembers() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return (
    <AccountShell active="publications">
      <PublicationMembersInner handle={handle} />
    </AccountShell>
  );
}

function PublicationMembersInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredBlock heading={copy.errorHeading} body={copy.errorBody} />
    );
  }

  // Logged-out, or loaded and confirmed non-editor (editor-only gate).
  if (
    !membership.isAuthenticated ||
    (!membership.isLoading && !membership.isEditor)
  ) {
    return (
      <CenteredBlock
        heading={copy.notAuthorizedHeading}
        body={copy.notAuthorizedBody}
      />
    );
  }

  // Membership query in flight -- show MembersRoster in its loading state so
  // there is no flash between the gate and the data.
  if (membership.isLoading) {
    return (
      <MembersRoster
        members={undefined}
        isLoading
        isError={false}
        onRetry={() => {}}
        currentPrincipal={null}
      />
    );
  }

  // Authenticated editor -- load the roster and render it.
  return <PublicationMembersDataInner handle={handle} />;
}

function PublicationMembersDataInner({ handle }: { handle: string }) {
  const { members, isLoading, isError, refetch } = usePublicationMembers(handle);
  const { principal } = useAuth();

  return (
    <>
      <title>
        {copy.title} {copy.metaTitleSuffix}
      </title>
      <MembersRoster
        members={members}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        currentPrincipal={principal?.toText() ?? null}
      />
    </>
  );
}
