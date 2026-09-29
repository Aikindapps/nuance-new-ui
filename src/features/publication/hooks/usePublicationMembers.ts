// NIC-562 -- publication Members roster read hook.
//
// Resolves handle -> canisterId via getPublicationCanisters() (shared query
// key with usePublicationEditorCount, so the cache is shared), then reads the
// editor/writer principals off the Publisher canister, resolves profiles and
// (best-effort) published-post counts.
//
// Live-verified data facts baked into fetchPublicationMembers:
//  1. getUsersByPrincipals returns results in REVERSE input order -- always
//     map by `principal`, never by position.
//  2. The "publication-factory" handle (displayName "management canister") is
//     the platform's own service account, auto-added as an editor on nearly
//     every publication. It is excluded from the roster AND from every count.
//  3. getUsersPostCountsByHandles needs LOWERCASE handles; a handle with no
//     counts record on file also comes back as an empty record
//     ({handle: "", ...}) even when lowercased correctly. Both cases mean
//     "no data" -- build the lookup map keyed by the returned handle
//     (lowercased) and skip empty handles.
//  4. A principal could in theory appear in both lists (none seen live) --
//     shown once, as Editor.
//  5. A principal whose profile does not resolve is dropped.

import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { ActorsValue } from "../../../contexts/useActors";

// The platform's own service account -- not a person. Case-insensitive match.
export const PUBLICATION_FACTORY_HANDLE = "publication-factory";

export type PublicationMemberRole = "editor" | "writer";

export type PublicationMember = {
  principal: string;
  handle: string;
  displayName: string;
  avatar: string;
  role: PublicationMemberRole;
  followersCount: string;
  publishedCount: number | null;
};

export async function fetchPublicationMembers(
  actors: ActorsValue,
  canisterId: string,
): Promise<PublicationMember[]> {
  const [editorIds, writerIds] = await actors.getEditorAndWriterPrincipalIds(
    canisterId,
  );

  // Union/dedupe in canister order, editor wins when a principal is in both
  // lists (fact #4). Editors first, then writers not already an editor.
  const editorSet = new Set(editorIds);
  const orderedPrincipals: { principal: string; role: PublicationMemberRole }[] =
    [
      ...editorIds.map((principal) => ({
        principal,
        role: "editor" as const,
      })),
      ...writerIds
        .filter((p) => !editorSet.has(p))
        .map((principal) => ({ principal, role: "writer" as const })),
    ];

  if (orderedPrincipals.length === 0) return [];

  // Fact #1: getUsersByPrincipals returns results in reverse input order --
  // map by principal, never by position.
  const profiles = await actors.getUsersByPrincipals(
    orderedPrincipals.map((p) => p.principal),
  );
  const profileByPrincipal = new Map(profiles.map((p) => [p.principal, p]));

  const members: PublicationMember[] = orderedPrincipals
    .map(({ principal, role }) => {
      const profile = profileByPrincipal.get(principal);
      if (!profile) return null; // fact #5: unresolved profile is dropped.
      if (profile.handle.toLowerCase() === PUBLICATION_FACTORY_HANDLE) {
        return null; // fact #2: hide the platform's own service account.
      }
      return {
        principal,
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
        role,
        followersCount: profile.followersCount,
        publishedCount: null as number | null,
      };
    })
    .filter((m): m is PublicationMember => m !== null);

  if (members.length === 0) return [];

  // Fact #3: counts need lowercase handles; an empty-handle result means "no
  // data" for that lookup (skip it, leave publishedCount null).
  const counts = await actors
    .getUsersPostCountsByHandles(members.map((m) => m.handle.toLowerCase()))
    .catch(() => null);

  if (counts) {
    const countByHandle = new Map<string, number>();
    for (const c of counts) {
      if (c.handle === "") continue;
      countByHandle.set(c.handle.toLowerCase(), Number(c.publishedCount || "0"));
    }
    for (const m of members) {
      const count = countByHandle.get(m.handle.toLowerCase());
      m.publishedCount = count ?? null;
    }
  }

  return members;
}

export function usePublicationMembers(handle: string) {
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

  const membersQuery = useQuery<PublicationMember[]>({
    queryKey: ["publication-members", canisterId],
    enabled: canisterId != null,
    staleTime: 2 * 60 * 1000,
    queryFn: () => fetchPublicationMembers(actors, canisterId!),
  });

  // A resolved handle with no canister match is an error state, same as a
  // failed canister-id read.
  const noCanisterMatch =
    handle !== "" && canisterQuery.isSuccess && canisterId == null;

  const isLoading =
    handle !== "" && (canisterQuery.isLoading ||
      (canisterId != null && membersQuery.isLoading));
  const isError =
    handle !== "" &&
    (canisterQuery.isError || noCanisterMatch ||
      (canisterId != null && membersQuery.isError));

  const refetch = () => {
    if (canisterQuery.isError || noCanisterMatch) {
      canisterQuery.refetch();
    } else {
      membersQuery.refetch();
    }
  };

  return {
    members: membersQuery.data,
    isLoading,
    isError,
    refetch,
  };
}

// Sort a member list: "role" = editors then writers, canister order within a
// role (stable); "name" = by handle, case-insensitive.
export function sortMembers(
  members: PublicationMember[],
  sort: "role" | "name",
): PublicationMember[] {
  if (sort === "name") {
    return [...members].sort((a, b) =>
      a.handle.localeCompare(b.handle, undefined, { sensitivity: "base" }),
    );
  }
  // "role": stable sort keeps canister order within each role.
  const editors = members.filter((m) => m.role === "editor");
  const writers = members.filter((m) => m.role === "writer");
  return [...editors, ...writers];
}
