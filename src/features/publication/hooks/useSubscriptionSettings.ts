import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type {
  WriterSubscriptionDetails,
  UpdateSubscriptionDetailsModel,
} from "../../../candid/Subscription/Subscription";

// Isolated hook for the subscription-price settings page (NIC-130 §6.4).
// Resolves handle → canisterId, reads current subscription details, and
// exposes a save mutation that calls updateSubscriptionDetails.
// Do NOT modify usePublicationMembership.ts — this hook is intentionally
// separate (different data shape, editor-only write path).

export function useSubscriptionSettings(handle: string) {
  const actors = useActors();
  const queryClient = useQueryClient();

  // Step 1: resolve handle → canisterId (same resolver as NIC-129).
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

  // Step 2: fetch writer subscription details by canisterId.
  const detailsQuery = useQuery<WriterSubscriptionDetails>({
    queryKey: ["writer-subscription-details", canisterId],
    enabled: canisterId != null,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res =
        await actors.getWriterSubscriptionDetailsByPrincipalId(canisterId!);
      if (res.__kind__ === "err") {
        throw new Error(res.err || "load failed");
      }
      return res.ok;
    },
  });

  // Step 3: save mutation.
  const save = useMutation({
    mutationFn: async (model: UpdateSubscriptionDetailsModel) => {
      const res = await actors.updateSubscriptionDetails(model);
      if (res.__kind__ === "err") {
        throw new Error(res.err || "save failed");
      }
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["writer-subscription-details", canisterId],
      });
    },
  });

  const isLoading =
    (handle !== "" && canisterQuery.isLoading) ||
    (canisterId != null && detailsQuery.isLoading);
  const isError =
    (handle !== "" && canisterQuery.isError) ||
    (canisterId != null && detailsQuery.isError);

  return {
    canisterId,
    details: detailsQuery.data ?? null,
    isLoading,
    isError,
    save,
  };
}
