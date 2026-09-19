// NIC-381 §6.4 — Publication settings route.
//
// Editor-gated route (mirrors ManageSubscribers' isEditor gate).
// Wraps in AccountShell active="publications" (mirrors ManageArticles).
// Reads publication data via usePublicationSettings; renders
// PublicationDetailsForm once data is available.

import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { usePublicationSettings } from "../features/publication/hooks/usePublicationSettings";
import { PublicationDetailsForm } from "../features/publication/sections/PublicationDetailsForm";
import { publicationSettingsCopy as copy } from "../constants/copy";
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

export function PublicationSettings() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return (
    <AccountShell active="publications">
      <PublicationSettingsInner handle={handle} />
    </AccountShell>
  );
}

function PublicationSettingsInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredBlock
        heading={copy.errorHeading}
        body={copy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-editor (editor-only gate).
  if (!membership.isAuthenticated || (!membership.isLoading && !membership.isEditor)) {
    return (
      <CenteredBlock
        heading={copy.notAuthorizedHeading}
        body={copy.notAuthorizedBody}
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

  // Authenticated editor — load publication data and render form.
  return <PublicationSettingsDataInner handle={handle} />;
}

function PublicationSettingsDataInner({ handle }: { handle: string }) {
  const { publication, canisterId, isLoading, isError } =
    usePublicationSettings(handle);

  if (isError) {
    return (
      <CenteredBlock
        heading={copy.loadErrorHeading}
        body={copy.loadErrorBody}
      />
    );
  }

  if (isLoading || publication === null || canisterId === null) {
    return (
      <div className="flex justify-center py-24" aria-busy="true">
        <Skeleton variant="text" sx={{ width: 240, height: 32 }} />
      </div>
    );
  }

  return (
    <>
      <title>
        {copy.title} {copy.metaTitleSuffix}
      </title>
      <PublicationDetailsForm
        handle={handle}
        canisterId={canisterId}
        publication={publication}
      />
    </>
  );
}
