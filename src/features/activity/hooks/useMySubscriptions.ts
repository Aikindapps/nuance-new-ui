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
//
// NIC-623 -- card (Stripe) subscriptions. A card-paid event carries
// paymentMethod Fiat; its endTime is the end of the paid period (moved on each
// renewal; set to the moment it ended when Stripe ends it, a failed renewal
// included) and stripeCancelAtPeriodEnd is set once the reader cancels on
// Stripe's billing page. NOTE: an event's isWriterSubscriptionActive is the
// WRITER's wallet-plan switch (Subscription canister
// writerPrincipalIdToIsSubscriptionActive), not "this subscription is live" --
// a publication that sells by card only has it false. So card-paid events are
// kept whatever that flag says (ended ones too: the billing page is where the
// card gets updated); wallet events keep the original filter.

export type SubscriptionRow = {
  user: UserListItem;
  principalId: string;
  interval: SubscriptionTimeInterval;
  endTimeMs: number;
  isPublication: boolean;
  // NIC-623: paid by card (Stripe), and whether the reader has cancelled it on
  // Stripe (it then ends at endTimeMs instead of renewing).
  paidByCard: boolean;
  cancelsAtPeriodEnd: boolean;
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

      // Keep events of writers whose wallet plans are on (the original
      // filter) plus every card-paid event (NIC-623); dedupe by
      // writerPrincipalId (latest startTime wins).
      const latestByWriter = new Map<string, (typeof events)[number]>();
      for (const e of events) {
        const paidByCard = e.paymentMethod?.__kind__ === "Fiat";
        if (!paidByCard && !e.isWriterSubscriptionActive) continue;
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
              paidByCard: e.paymentMethod?.__kind__ === "Fiat",
              cancelsAtPeriodEnd: e.stripeCancelAtPeriodEnd === true,
            },
          ];
        })
        .sort((a, b) => b.endTimeMs - a.endTimeMs);

      return rows;
    },
  });
}
