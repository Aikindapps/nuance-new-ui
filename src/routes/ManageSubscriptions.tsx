import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { SubscriptionSettings } from "../features/publication/sections/SubscriptionSettings";
import { manageSubscriptionsCopy } from "../constants/copy";

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

export function ManageSubscriptions() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return <ManageSubscriptionsInner handle={handle} />;
}

function ManageSubscriptionsInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredMessage
        heading={manageSubscriptionsCopy.errorHeading}
        body={manageSubscriptionsCopy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-editor.
  if (!membership.isAuthenticated || (!membership.isLoading && !membership.isEditor)) {
    return (
      <CenteredMessage
        heading={manageSubscriptionsCopy.notAuthorizedHeading}
        body={manageSubscriptionsCopy.notAuthorizedBody}
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

  // Authenticated editor — subscription price management (NIC-130 §6.4).
  return (
    <PageShell>
      <title>
        {manageSubscriptionsCopy.title} {manageSubscriptionsCopy.metaTitleSuffix}
      </title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 lg:px-14">
          <h1 className="mt-8 text-[length:calc(36*var(--fpx))] font-bold text-ink">
            {manageSubscriptionsCopy.title}
          </h1>
          <div className="mt-8 pb-24">
            <SubscriptionSettings handle={handle} />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
