import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { PublicationSubscribers } from "../features/publication/sections/PublicationSubscribers";
import { publicationSubscribersCopy } from "../constants/copy";

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

export function ManageSubscribers() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return <ManageSubscribersInner handle={handle} />;
}

function ManageSubscribersInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredMessage
        heading={publicationSubscribersCopy.errorHeading}
        body={publicationSubscribersCopy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-editor.
  if (
    !membership.isAuthenticated ||
    (!membership.isLoading && !membership.isEditor)
  ) {
    return (
      <CenteredMessage
        heading={publicationSubscribersCopy.notAuthorizedHeading}
        body={publicationSubscribersCopy.notAuthorizedBody}
      />
    );
  }

  // Membership query in flight.
  if (membership.isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24" aria-busy="true">
          <Skeleton variant="text" sx={{ width: 240, height: 32 }} />
        </div>
      </PageShell>
    );
  }

  // Authenticated editor — 6.9 read-only subscriber roster (NIC-252).
  return (
    <PageShell>
      <title>
        {publicationSubscribersCopy.title}{" "}
        {publicationSubscribersCopy.metaTitleSuffix}
      </title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 lg:px-14">
          <h1 className="mt-8 text-[length:calc(36*var(--fpx))] font-bold text-ink">
            {publicationSubscribersCopy.title}
          </h1>
          <div className="mt-8 pb-24">
            <PublicationSubscribers handle={handle} />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
