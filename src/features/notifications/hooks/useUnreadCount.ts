import { useNotificationsFoldout } from "./useNotifications";

// useUnreadCount — derived count of unread notifications across the foldout
// query's first page. Drives the bell-dot lit/unlit state. We deliberately
// read the foldout query (smaller page size, refetch-on-focus) so the dot
// status updates whenever the header gains focus — no separate poll.
//
// Returns 0 when not authed or while loading — the dot is hidden in either
// case, which is the desired UI: never show "you have notifications" when we
// don't actually know.

export function useUnreadCount(): number {
  const query = useNotificationsFoldout();
  if (!query.data) return 0;
  const firstPage = query.data.pages[0];
  if (!firstPage) return 0;
  return firstPage.notifications.filter((n) => !n.read).length;
}
