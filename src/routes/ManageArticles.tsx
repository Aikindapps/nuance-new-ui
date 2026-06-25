import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { CenteredMessage, PageShell } from "../components/ui/CenteredMessage";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";
import { manageArticlesCopy } from "../constants/copy";

// Normalise a handle param: strip a leading "@" and lowercase.
function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").toLowerCase();
}

export function ManageArticles() {
  const { handle: raw = "" } = useParams<{ handle: string }>();
  const handle = normalizeHandle(raw);

  return <ManageArticlesInner handle={handle} />;
}

function ManageArticlesInner({ handle }: { handle: string }) {
  const membership = usePublicationMembership(handle);

  // Canister/network error checking membership.
  if (membership.isError) {
    return (
      <CenteredMessage
        heading={manageArticlesCopy.errorHeading}
        body={manageArticlesCopy.errorBody}
      />
    );
  }

  // Logged-out, or loaded and confirmed non-member.
  if (!membership.isAuthenticated || (!membership.isLoading && !membership.isMember)) {
    return (
      <CenteredMessage
        heading={manageArticlesCopy.notAuthorizedHeading}
        body={manageArticlesCopy.notAuthorizedBody}
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

  // Authenticated member — interim placeholder (table/toggle land in a later increment).
  return (
    <PageShell>
      <title>
        {manageArticlesCopy.title} {manageArticlesCopy.metaTitleSuffix}
      </title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          <h1 className="mt-8 text-[length:calc(36*var(--fpx))] font-bold text-ink">
            {manageArticlesCopy.title}
          </h1>
          <div className="mt-8">
            <CenteredMessage
              heading={manageArticlesCopy.comingSoonHeading}
              body={manageArticlesCopy.comingSoonBody}
            />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
