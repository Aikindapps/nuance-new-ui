import { useNotificationsFoldout } from "./useNotifications";

// useUnreadCount — derived count of unread notifications across the foldout
// query's first page. Drives the bell-dot lit/unlit state. We deliberately
// read the foldout query (smaller page size, refetch-on-focus) so the dot
// status updates whenever the header gains focus — no separate poll.
//
// Returns 0 when not authed or while loading — the dot is hidden in either
// case, which is the desired UI: never show "you have notifications" when we
// don't actually know.
//
// Known limitation (PR #10 review m1): this counts unread within the foldout's
// first page only. With more unread than FOLDOUT_PAGE_SIZE, opening the foldout
// marks page 1 read and the dot dims even though unread items remain on later
// pages. A true unread count would need a dedicated canister endpoint the
// Notifications canister doesn't expose — out of scope for PR #10.

export function useUnreadCount(): number {
  const query = useNotificationsFoldout();
  if (!query.data) return 0;
  const firstPage = query.data.pages[0];
  if (!firstPage) return 0;
  return firstPage.notifications.filter((n) => !n.read).length;
}
