import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  GetUserNotificationsResponse,
  Notification,
} from "../../../candid/Notifications/Notifications";
import type { UserListItem } from "../../../candid/User/User";
import { useActors, type ActorsValue } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { collectPrincipals } from "../lib/collectPrincipals";

// useNotifications — paginated notifications feed for the authed caller.
//
// Two consumers, different page sizes:
//   - The foldout uses pageSize=10 and only ever renders the first page.
//   - The /notifications route uses pageSize=20 and pages via Load more.
//
// pageSize is therefore a parameter, not a constant — both consumers share the
// same cache key prefix so a mark-read on one surface mirrors the other when
// they coexist. Each consumer keeps its own cache slot via the (pageSize)
// suffix so foldout (10) and route (20) don't fight over page boundaries.
//
// Hydration: notifications carry principals, not handles. We batch-resolve
// every principal that appears in the page to UserListItem via
// getUsersByPrincipals. The userMap rides with the page so the renderer never
// has to do its own lookup. Matches the by-principal pattern from PR #8
// comments (decision #35).

const FOLDOUT_PAGE_SIZE = 10;
const ROUTE_PAGE_SIZE = 20;

export type NotificationsPage = {
  notifications: Notification[];
  userMap: Map<string, UserListItem>;
  totalCount: number;
  nextFrom: number;
};

async function fetchPage(
  actors: ActorsValue,
  from: number,
  pageSize: number,
): Promise<NotificationsPage> {
  const resp: GetUserNotificationsResponse = await actors.getUserNotifications(
    from,
    from + pageSize,
  );

  // Hydrate principals → UserListItem. Skip the call when there are zero
  // principals on the page (e.g. only FaucetClaimAvailable / VerifyProfile).
  const principals = new Set<string>();
  for (const n of resp.notifications) {
    for (const p of collectPrincipals(n.content)) principals.add(p);
  }
  const userMap = new Map<string, UserListItem>();
  if (principals.size > 0) {
    const users = await actors.getUsersByPrincipals([...principals]);
    for (const u of users) userMap.set(u.principal, u);
  }

  const totalCount = Number.parseInt(resp.totalCount, 10) || 0;
  return {
    notifications: resp.notifications,
    userMap,
    totalCount,
    nextFrom: from + pageSize,
  };
}

function useNotificationsWithSize(pageSize: number) {
  const actors = useActors();
  const { principal, isAuthenticated } = useAuth();
  const principalText = principal?.toText() ?? null;

  return useInfiniteQuery({
    queryKey: ["notifications", principalText, pageSize],
    enabled: isAuthenticated && !!principalText,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(actors, pageParam, pageSize),
    getNextPageParam: (lastPage) =>
      lastPage.nextFrom >= lastPage.totalCount ? undefined : lastPage.nextFrom,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationsFoldout() {
  return useNotificationsWithSize(FOLDOUT_PAGE_SIZE);
}

export function useNotificationsRoute() {
  return useNotificationsWithSize(ROUTE_PAGE_SIZE);
}

export { FOLDOUT_PAGE_SIZE, ROUTE_PAGE_SIZE };
