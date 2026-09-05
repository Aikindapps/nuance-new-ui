import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import {
  SubscriptionTimeInterval,
  type SubscriptionEvent,
} from "../../../candid/Subscription/Subscription";

// NIC-252 §6.9 Publication Subscribers — read-only, editor-gated data hook.
//
// Resolves the route handle → publication canisterId (same resolver as the
// §6.4 price setter, useSubscriptionSettings), then reads the publication's
// subscription roster via the editor-gated getWriterSubscriptionDetails,
// keyed by the publication canister principal. Filters to active subscribers,
// dedupes by reader (latest start wins), and hydrates reader profiles.
//
// Read-only: the earnings AGGREGATES the design also shows (NUA earned total,
// per-subscriber earned total, revenue-over-time chart) are deliberately NOT
// derived here — they ride the monetization work (NIC-44). This hook exposes
// only the backend-truthful roster + counts.

export type SubscriberRow = {
  readerPrincipalId: string;
  subscriptionTimeInterval: SubscriptionTimeInterval;
  startTimeMs: number;
  displayName: string;
  handle: string;
  avatar: string;
};

export type FeeByInterval = Record<SubscriptionTimeInterval, string | undefined>;

const EMPTY_FEES: FeeByInterval = {
  [SubscriptionTimeInterval.Weekly]: undefined,
  [SubscriptionTimeInterval.Monthly]: undefined,
  [SubscriptionTimeInterval.Annually]: undefined,
  [SubscriptionTimeInterval.LifeTime]: undefined,
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function usePublicationSubscribers(handle: string) {
  const actors = useActors();

  // Step 1: resolve handle → canisterId (same resolver as useSubscriptionSettings).
  const canisterQuery = useQuery<string | null>({
    queryKey: ["publication-canister-id", handle],
    enabled: handle !== "",
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const cans = await actors.getPublicationCanisters();
      const match = cans.find(
        ([h]) => h.toLowerCase() === handle.toLowerCase(),
      );
      return match?.[1] ?? null;
    },
  });

  const canisterId = canisterQuery.data ?? null;

  // Step 2: read the publication's subscription roster (editor-gated).
  const dataQuery = useQuery({
    queryKey: ["publication-subscribers", canisterId],
    enabled: canisterId != null,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res = await actors.getWriterSubscriptionDetails(canisterId!);
      if (res.__kind__ === "err") {
        throw new Error(res.err || "load failed");
      }
      const details = res.ok;

      // Active subscribers, deduped by reader (latest startTime wins).
      const latestByReader = new Map<string, SubscriptionEvent>();
      for (const e of details.writerSubscriptions) {
        if (!e.isWriterSubscriptionActive) continue;
        const prev = latestByReader.get(e.readerPrincipalId);
        if (!prev || e.startTime > prev.startTime) {
          latestByReader.set(e.readerPrincipalId, e);
        }
      }
      const events = [...latestByReader.values()];

      // Resolve reader principals → profiles (avatar / name / @handle).
      const principals = events.map((e) => e.readerPrincipalId);
      const users = principals.length
        ? await actors.getUsersByPrincipals(principals).catch(() => [])
        : [];
      const byPrincipal = new Map(users.map((u) => [u.principal, u]));

      const subscribers: SubscriberRow[] = events
        .map((e) => {
          const u = byPrincipal.get(e.readerPrincipalId);
          return {
            readerPrincipalId: e.readerPrincipalId,
            subscriptionTimeInterval: e.subscriptionTimeInterval,
            // Mirror useWalletHistory: subscription startTime is used as ms.
            startTimeMs: Number(e.startTime),
            displayName: u?.displayName ?? "",
            handle: u?.handle ?? "",
            avatar: u?.avatar ?? "",
          };
        })
        .sort((a, b) => b.startTimeMs - a.startTimeMs);

      const feeByInterval: FeeByInterval = {
        [SubscriptionTimeInterval.Weekly]: details.weeklyFee,
        [SubscriptionTimeInterval.Monthly]: details.monthlyFee,
        [SubscriptionTimeInterval.Annually]: details.annuallyFee,
        [SubscriptionTimeInterval.LifeTime]: details.lifeTimeFee,
      };

      const now = Date.now();
      const newThisWeek = subscribers.filter(
        (s) => s.startTimeMs >= now - WEEK_MS,
      ).length;

      return {
        subscribers,
        feeByInterval,
        subscriberCount: subscribers.length,
        newThisWeek,
      };
    },
  });

  const isLoading =
    (handle !== "" && canisterQuery.isLoading) ||
    (canisterId != null && dataQuery.isLoading);
  const isError =
    (handle !== "" && canisterQuery.isError) ||
    (canisterId != null && dataQuery.isError);

  const refetch = () => {
    void canisterQuery.refetch();
    void dataQuery.refetch();
  };

  return {
    subscribers: dataQuery.data?.subscribers ?? [],
    feeByInterval: dataQuery.data?.feeByInterval ?? EMPTY_FEES,
    subscriberCount: dataQuery.data?.subscriberCount ?? 0,
    newThisWeek: dataQuery.data?.newThisWeek ?? 0,
    isLoading,
    isError,
    refetch,
  };
}
