import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { UserListItem } from "../../../candid/User/User";
import type { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";

// NIC-353 -- SS8.3 Subscriptions section hook.
//
// Fetches the current user's reader subscription roster via
// getReaderSubscriptionDetails(). Filters to active events, dedupes by
// writerPrincipalId keeping the latest startTime, resolves writer profiles via
// getUsersByPrincipals, drops rows whose profile did not resolve, and returns
// sorted by endTimeMs desc (renewal date).
//
// NIC-379 -- each row carries an `isPublication` discriminator so the section
// can render publications with the house square logo avatar and writers with
// the round photo. A subscribed entity resolves to a plain UserListItem with
// no type marker, so the discriminator comes from getPublicationCanisters()
// (the platform's authoritative [handle, canisterId] publication list): a row
// is a publication when its lowercased handle is in that set. Same partition
// the shipped useMyFollows / useSearchUsers hooks use.
//
// TIME UNITS: endTime is already in milliseconds -- Number(bigint) with NO
// divide, per useWalletHistory / usePublicationSubscribers precedent.
//
// Read-only: no billing management (NIC-44).

export type SubscriptionRow = {
  user: UserListItem;
  principalId: string;
  interval: SubscriptionTimeInterval;
  endTimeMs: number;
  isPublication: boolean;
};

export function useMySubscriptions() {
  const { principal, isAuthenticated } = useAuth();
  const actors = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<SubscriptionRow[]>({
    queryKey: ["my-subscriptions", principalText],
    enabled: principalText !== null && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 min
    queryFn: async () => {
      const res = await actors.getReaderSubscriptionDetails();
      if (res.__kind__ === "err") {
        throw new Error(res.err || "load failed");
      }
      const events = res.ok.readerSubscriptions;

      // Keep only active; dedupe by writerPrincipalId (latest startTime wins).
      const latestByWriter = new Map<string, (typeof events)[number]>();
      for (const e of events) {
        if (!e.isWriterSubscriptionActive) continue;
        const prev = latestByWriter.get(e.writerPrincipalId);
        if (!prev || e.startTime > prev.startTime) {
          latestByWriter.set(e.writerPrincipalId, e);
        }
      }
      const active = [...latestByWriter.values()];
      if (active.length === 0) return [];

      // Resolve writer principals to profiles, and fetch the publication
      // handle set in parallel (the writer-vs-publication discriminator).
      const principals = active.map((e) => e.writerPrincipalId);
      const [users, pubCanisters] = await Promise.all([
        actors.getUsersByPrincipals(principals).catch(() => [] as UserListItem[]),
        actors
          .getPublicationCanisters()
          .catch(() => [] as Array<[string, string]>),
      ]);
      const byPrincipal = new Map(users.map((u) => [u.principal, u]));
      const pubHandleSet = new Set(pubCanisters.map(([h]) => h.toLowerCase()));

      // Map to rows; drop those whose profile did not resolve.
      const rows: SubscriptionRow[] = active
        .flatMap((e) => {
          const user = byPrincipal.get(e.writerPrincipalId);
          if (!user) return [];
          return [
            {
              user,
              principalId: e.writerPrincipalId,
              interval: e.subscriptionTimeInterval,
              endTimeMs: Number(e.endTime),
              isPublication: pubHandleSet.has(user.handle.toLowerCase()),
            },
          ];
        })
        .sort((a, b) => b.endTimeMs - a.endTimeMs);

      return rows;
    },
  });
}
