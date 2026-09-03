import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";

// Live editor count for a publication (NIC-225): the premium-mint minimum must
// cover every editor (each is auto-given a key). Resolves handle -> Publisher
// canisterId, then reads getEditorAndWriterPrincipalIds and returns the editor
// count. Fail-closed: callers keep Mint disabled while editorCount is null.
export function usePublicationEditorCount(handle: string) {
  const actors = useActors();

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

  const countQuery = useQuery<number>({
    queryKey: ["publication-editor-count", canisterId],
    enabled: canisterId != null,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [editors] = await actors.getEditorAndWriterPrincipalIds(canisterId!);
      return editors.length;
    },
  });

  const isLoading =
    (handle !== "" && canisterQuery.isLoading) ||
    (canisterId != null && countQuery.isLoading);
  const isError =
    (handle !== "" && canisterQuery.isError) ||
    (canisterId != null && countQuery.isError);

  return {
    editorCount: countQuery.data ?? null,
    isLoading,
    isError,
  };
}
