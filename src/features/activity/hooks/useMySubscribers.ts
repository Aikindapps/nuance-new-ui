import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import type { UserListItem } from "../../../candid/User/User";
import type { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";

// NIC-353 -- SS8.3 Subscribers section hook.
//
// Fetches the current user's writer subscription roster via
// getWriterSubscriptionDetails(null) (null = own principal, per the facade
// signature). Filters to active events, dedupes by readerPrincipalId keeping
// the latest startTime, resolves reader profiles via getUsersByPrincipals,
// drops rows whose profile did not resolve, and returns sorted by startTimeMs
// desc.
//
// TIME UNITS: startTime/endTime are already in milliseconds (same as
// useWalletHistory / usePublicationSubscribers), so Number(bigint) is safe
// with NO divide.
//
// NIC-379 -- each row carries an `isPublication` discriminator so the section
// can render publications with the house square logo avatar and writers with
// the round photo. A resolved subscriber is a plain UserListItem with no type
// marker, so the discriminator comes from getPublicationCanisters() (the
// platform's authoritative [handle, canisterId] publication list): a row is a
// publication when its lowercased handle is in that set. Same partition the
// shipped useMyFollows / useSearchUsers hooks use.
//
// Read-only: no earnings or plan management (NIC-44).

export type SubscriberRow = {
  user: UserListItem;
  principalId: string;
  interval: SubscriptionTimeInterval;
  startTimeMs: number;
  endTimeMs: number;
  isPublication: boolean;
};

export function useMySubscribers() {
  const { principal, isAuthenticated } = useAuth();
  const actors = useActors();
  const principalText = principal?.toText() ?? null;

  return useQuery<SubscriberRow[]>({
    queryKey: ["my-subscribers", principalText],
    enabled: principalText !== null && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 min
    queryFn: async () => {
      const res = await actors.getWriterSubscriptionDetails(null);
      if (res.__kind__ === "err") {
        throw new Error(res.err || "load failed");
      }
      const events = res.ok.writerSubscriptions;

      // Keep only active; dedupe by readerPrincipalId (latest startTime wins).
      const latestByReader = new Map<string, (typeof events)[number]>();
      for (const e of events) {
        if (!e.isWriterSubscriptionActive) continue;
        const prev = latestByReader.get(e.readerPrincipalId);
        if (!prev || e.startTime > prev.startTime) {
          latestByReader.set(e.readerPrincipalId, e);
        }
      }
      const active = [...latestByReader.values()];
      if (active.length === 0) return [];

      // Resolve reader principals to profiles, and fetch the publication
      // handle set in parallel (the writer-vs-publication discriminator).
      const principals = active.map((e) => e.readerPrincipalId);
      const [users, pubCanisters] = await Promise.all([
        actors.getUsersByPrincipals(principals).catch(() => [] as UserListItem[]),
        actors
          .getPublicationCanisters()
          .catch(() => [] as Array<[string, string]>),
      ]);
      const byPrincipal = new Map(users.map((u) => [u.principal, u]));
      const pubHandleSet = new Set(pubCanisters.map(([h]) => h.toLowerCase()));

      // Map to rows; drop those whose profile did not resolve.
      const rows: SubscriberRow[] = active
        .flatMap((e) => {
          const user = byPrincipal.get(e.readerPrincipalId);
          if (!user) return [];
          return [
            {
              user,
              principalId: e.readerPrincipalId,
              interval: e.subscriptionTimeInterval,
              startTimeMs: Number(e.startTime),
              endTimeMs: Number(e.endTime),
              isPublication: pubHandleSet.has(user.handle.toLowerCase()),
            },
          ];
        })
        .sort((a, b) => b.startTimeMs - a.startTimeMs);

      return rows;
    },
  });
}
