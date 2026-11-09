import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../contexts/useActors";
import { hasAnyPlan } from "../article/purchase/useSubscriptionPurchase";
import { cardTiers } from "../article/purchase/cardCheckout";

// How long the page waits for the plan read, counted from the moment the
// profile / publication data is ready.
export const SUBSCRIBE_CARD_HOLD_MS = 1500;

// The publication's canister id: same key and data shape as
// usePublicationMembers, so the cache is shared. undefined = still loading,
// null = no canister for this handle (or the read failed).
export function usePublicationCanisterId(handle: string): string | null | undefined {
  const actors = useActors();
  const q = useQuery<string | null>({
    queryKey: ["publication-canister-id", handle],
    enabled: handle !== "",
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const cans = await actors.getPublicationCanisters();
      const match = cans.find(([h]) => h.toLowerCase() === handle.toLowerCase());
      return match?.[1] ?? null;
    },
  });
  if (q.isError) return null;
  return q.isSuccess ? q.data : undefined;
}

type Args = {
  // Plan owner id: undefined = not known yet, null = none (no card).
  target: string | null | undefined;
  // The profile / publication data is there (starts the 1.5 s clock).
  dataReady: boolean;
  // The visitor may be judged (writer: auth has left "loading").
  settled: boolean;
  // Never show (writer: your own profile).
  suppressed: boolean;
};

export type SubscribeCardPhase = "hold" | "show" | "hide";

// Show / hide decision for the Subscribe card. The first outcome sticks.
export function useSubscribeCard({
  target,
  dataReady,
  settled,
  suppressed,
}: Args): SubscribeCardPhase {
  const actors = useActors();
  const planTarget = settled && !suppressed && target ? target : null;
  const plan = useQuery<boolean>({
    queryKey: ["subscribe-card-plan", planTarget],
    enabled: planTarget !== null,
    retry: false,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res = await actors.getWriterSubscriptionDetailsByPrincipalId(planTarget!);
      return (
        res.__kind__ === "ok" &&
        (hasAnyPlan(res.ok) || cardTiers(res.ok).length > 0)
      );
    },
  });

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!dataReady) return;
    const t = setTimeout(() => setTimedOut(true), SUBSCRIBE_CARD_HOLD_MS);
    return () => clearTimeout(t);
  }, [dataReady]);

  let live: "show" | "hide" | null = null;
  if (timedOut || (settled && (suppressed || target === null))) {
    live = "hide";
  }
  if (settled && !suppressed && planTarget !== null) {
    if (plan.isSuccess) live = plan.data ? "show" : "hide";
    else if (plan.isError) live = "hide";
  }

  // Latch: the first outcome stays for the life of the page.
  const [latched, setLatched] = useState<"show" | "hide" | null>(null);
  if (latched === null && live !== null) setLatched(live);

  return latched ?? live ?? "hold";
}
