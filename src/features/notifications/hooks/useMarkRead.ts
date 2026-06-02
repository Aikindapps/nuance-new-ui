import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import type { NotificationsPage } from "./useNotifications";

// useMarkRead — bulk mark notifications as read.
//
// Trigger semantic (PR #10): "on open" — the foldout calls this with every
// visible unread id when it opens; the /notifications route calls it on
// mount. The canister method returns void (fire-and-forget); on failure we
// roll back the optimistic flip but do not toast — a transient mark-read
// failure is not user-actionable.
//
// Cache contract:
// - Walks every ["notifications", principalText, *] query and flips
//   `read=true` on any matching id across every cached page. This keeps the
//   foldout (pageSize=10) and route (pageSize=20) caches in sync even though
//   they have independent cache slots.
// - On error: restore the previous data for every query the mutation touched.

type CacheSnapshot = Array<{
  queryKey: readonly unknown[];
  data: InfiniteData<NotificationsPage> | undefined;
}>;

export function useMarkRead() {
  const { markNotificationsAsRead } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { snapshot: CacheSnapshot }>({
    mutationFn: async (ids) => {
      if (ids.length === 0) return;
      await markNotificationsAsRead(ids);
    },
    onMutate: async (ids) => {
      const principalText = principal?.toText() ?? null;
      if (!principalText || ids.length === 0) {
        return { snapshot: [] };
      }
      // Cancel any in-flight refetch first. getUserNotifications is a
      // non-certified `query`, and refetchOnWindowFocus commonly fires exactly
      // as the foldout opens — without this, a fetch resolving after the
      // optimistic flip would clobber it with stale read=false (rows flip back
      // to unread, bell dot re-lights).
      await queryClient.cancelQueries({
        queryKey: ["notifications", principalText],
      });
      const idSet = new Set(ids);
      // Touch every ["notifications", principalText, *] query — there can be
      // up to two (foldout + route).
      const matches = queryClient.getQueriesData<InfiniteData<NotificationsPage>>({
        queryKey: ["notifications", principalText],
      });
      const snapshot: CacheSnapshot = matches.map(([queryKey, data]) => ({
        queryKey,
        data,
      }));

      for (const [queryKey, data] of matches) {
        if (!data) continue;
        const nextPages = data.pages.map((page) => ({
          ...page,
          notifications: page.notifications.map((n) =>
            idSet.has(n.id) && !n.read ? { ...n, read: true } : n,
          ),
        }));
        queryClient.setQueryData<InfiniteData<NotificationsPage>>(queryKey, {
          ...data,
          pages: nextPages,
        });
      }
      return { snapshot };
    },
    onError: (_err, _ids, context) => {
      if (!context) return;
      for (const { queryKey, data } of context.snapshot) {
        queryClient.setQueryData(queryKey, data);
      }
    },
  });
}
