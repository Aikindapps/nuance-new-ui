import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";

// Publication membership check (NIC-40).
//
// Calls isEditorPublic + isWriterPublic in parallel — both are anon-safe
// PostCore queries that accept an explicit principal so they are
// caller-independent. The query is enabled only when the user is
// authenticated and a principal is available.

export type PublicationMembership = {
  isEditor: boolean;
  isWriter: boolean;
};

export function usePublicationMembership(handle: string) {
  const actors = useActors();
  const { principal, isAuthenticated } = useAuth();

  const enabled = handle !== "" && isAuthenticated && principal != null;

  const query = useQuery<PublicationMembership>({
    queryKey: ["publication-membership", handle, principal?.toText() ?? ""],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [isEditor, isWriter] = await Promise.all([
        actors.isEditorPublic(handle, principal!),
        actors.isWriterPublic(handle, principal!),
      ]);
      return { isEditor, isWriter };
    },
  });

  const isEditor = query.data?.isEditor ?? false;
  const isWriter = query.data?.isWriter ?? false;
  const isMember = isEditor || isWriter;
  const isLoading = enabled ? query.isLoading : false;
  const isError = enabled ? query.isError : false;

  return { isEditor, isWriter, isMember, isLoading, isError, isAuthenticated };
}
