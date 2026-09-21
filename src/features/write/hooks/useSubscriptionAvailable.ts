import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";

// Whether the publish target has the subscription feature switched on:
// the signed-in writer's own principal when pubHandle is null, else the
// publication canister (resolved through getPublicationCanisters, the same
// lookup as useSubscriptionSettings). Mirrors the PostCore.save gate that
// rejects isMembersOnly:true with "Subscription option is not available!"
// unless Subscription.isWriterActivatedSubscription(owner) is true.
// Returns undefined while resolving (or on error) so the caller can stay
// permissive until the answer is known.
export function useSubscriptionAvailable(
  pubHandle: string | null,
): boolean | undefined {
  const actors = useActors();
  const { principal } = useAuth();
  const own = principal?.toText() ?? null;
  const query = useQuery<boolean>({
    queryKey: ["subscription-available", pubHandle, own],
    enabled: pubHandle !== null || own !== null,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      let target: string | null = own;
      if (pubHandle !== null) {
        const cans = await actors.getPublicationCanisters();
        const lower = pubHandle.toLowerCase();
        const match = cans.find(([h]) => h.toLowerCase() === lower);
        target = match?.[1] ?? null;
      }
      if (!target) return false;
      return actors.isWriterActivatedSubscription(target);
    },
  });
  return query.data;
}
