import { useEffect, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { useMyProfile } from "../lib/useMyProfile";
import { notificationsCopy } from "../constants/copy";
import type { UserListItem } from "../candid/User/User";
import { NotificationItem } from "../features/notifications/NotificationItem";
import { NotificationsEmpty } from "../features/notifications/NotificationsEmpty";
import { useMarkRead } from "../features/notifications/hooks/useMarkRead";
import { useNotificationsRoute } from "../features/notifications/hooks/useNotifications";
import { useUnreadSnapshot } from "../features/notifications/hooks/useUnreadSnapshot";

// /notifications — full-page surface for the bell. Figma silent on this view;
// mobile bell click lands here (Phase 4) and a "View all" link from the
// foldout lands desktop visitors here too.
//
// Mark-read semantics: on first successful page load, every visible unread
// across all loaded pages is bulk-marked-read in a single canister call.
// Subsequent "Load more" pages mark their own newly-loaded unread items the
// same way — the ref-guarded effect re-runs as pages append.

const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

export function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const profile = useMyProfile();
  const query = useNotificationsRoute();
  const markRead = useMarkRead();

  const allNotifications =
    query.data?.pages.flatMap((p) => p.notifications) ?? [];
  // Freeze the unread accent per id across pagination; the mark-read effect
  // below clears `read` optimistically but the styling persists (PR #10 M2/A).
  const unreadSnapshot = useUnreadSnapshot(allNotifications);
  // Each page carries only its own principals; merge once per data change
  // rather than on every render.
  const userMap = useMemo(
    () => mergeUserMaps(query.data?.pages ?? []),
    [query.data?.pages],
  );

  // Track which notification ids we've already marked so we don't bulk-mark
  // the same id more than once across pagination.
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!query.data) return;
    const toMark: string[] = [];
    for (const page of query.data.pages) {
      for (const n of page.notifications) {
        if (!n.read && !markedRef.current.has(n.id)) {
          markedRef.current.add(n.id);
          toMark.push(n.id);
        }
      }
    }
    if (toMark.length > 0) markRead.mutate(toMark);
  }, [query.data, markRead]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const c = notificationsCopy;
  const myHandle = profile.data?.handle ?? null;
  const showEmpty = query.isSuccess && allNotifications.length === 0;

  return (
    <div className="min-h-screen bg-ink-border/5">
      <title>{c.routeMetaTitle}</title>
      <meta name="description" content={c.routeMetaDescription} />
      <HeaderLoggedIn />
      <main className={`${CONTAINER} px-6 pt-12 lg:px-14 lg:pt-20`}>
        <h1 className="text-title-md font-bold text-ink-80 lg:text-title-lg">
          {c.routeHeading}
        </h1>

        <div className="mt-6 pb-24">
          {query.isPending && (
            <p className="px-4 py-8 text-body text-ink-60">{c.loading}</p>
          )}
          {query.isError && (
            <p className="px-4 py-8 text-body text-error">{c.loadingError}</p>
          )}
          {showEmpty && <NotificationsEmpty variant="route" />}

          {allNotifications.length > 0 && (
            <ul className="overflow-hidden rounded-card border border-ink-border/10 bg-white">
              {allNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  userMap={userMap}
                  myHandle={myHandle}
                  unread={unreadSnapshot.has(n.id)}
                  variant="route"
                />
              ))}
            </ul>
          )}

          {query.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
                className="rounded-card border border-brand-purple px-6 py-3 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5 disabled:opacity-50"
              >
                {query.isFetchingNextPage ? c.loading : c.loadMore}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Each page carries its own userMap (only the principals that appeared on
// that page). The route flattens across all pages, so the renderer needs a
// merged map. Duplicates resolve to the most recent page's entry — fine
// because UserListItem is canonical per principal.
function mergeUserMaps(pages: { userMap: Map<string, UserListItem> }[]) {
  const merged = new Map<string, UserListItem>();
  for (const page of pages) {
    for (const [k, v] of page.userMap) merged.set(k, v);
  }
  return merged;
}

export default NotificationsPage;
