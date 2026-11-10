// NIC-992 -- add / remove publication members.
//
// Pure async functions (never throw) + a hook that invalidates the caches a
// successful change touches. See the Members screen for the UI.
//
// Safety notes (verified against the Publisher canister):
//  * addWriter, when its follow-up update of the person's user record fails,
//    overwrites the publication's EDITORS list with its WRITERS list. That
//    update fails when the record ALREADY lists this publication, so the
//    person's record is read first and no mutation is made in that case.
//  * removeWriter/removeEditor drop the handle from the stored handle list
//    only on an EXACT string match, so the stored-case entry is passed.
//  * Settings saves send publication.writers/editors back and the canister
//    re-adds any handle it lacks, so the cached Settings record is
//    invalidated after every successful change.

import { useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { ActorsValue } from "../../../contexts/useActors";
import { fetchPublicationSettings } from "./usePublicationSettings";
import {
  PUBLICATION_FACTORY_HANDLE,
  type PublicationMember,
  type PublicationMemberRole,
} from "./usePublicationMembers";

export type MemberRole = PublicationMemberRole;

export type AddMemberOutcome =
  | { kind: "added"; handle: string; role: MemberRole }
  | { kind: "notFound"; handle: string }
  | { kind: "alreadyEditor"; handle: string }
  | { kind: "alreadyWriter"; handle: string }
  | { kind: "failed"; handle: string };

// Trim, strip ONE leading "@", trim again.
export function normalizeMemberHandle(raw: string): string {
  let h = raw.trim();
  if (h.startsWith("@")) h = h.slice(1);
  return h.trim();
}

export async function addPublicationMember(
  actors: ActorsValue,
  publicationHandle: string,
  rawHandle: string,
  role: MemberRole,
): Promise<AddMemberOutcome & { canisterId?: string }> {
  const h = normalizeMemberHandle(rawHandle);
  if (h === "") return { kind: "failed", handle: h };
  try {
    const { publication, canisterId } = await fetchPublicationSettings(
      actors,
      publicationHandle,
    );

    const userRes = await actors.getUserByHandle(h.toLowerCase());
    if (userRes.__kind__ === "err") {
      return userRes.err === "User not found"
        ? { kind: "notFound", handle: h }
        : { kind: "failed", handle: h };
    }
    const u = userRes.ok;

    const listed = u.publicationsArray.find(
      (p) =>
        p.publicationName.toLowerCase() ===
        publication.publicationHandle.toLowerCase(),
    );
    if (listed) {
      return listed.isEditor
        ? { kind: "alreadyEditor", handle: u.handle }
        : { kind: "alreadyWriter", handle: u.handle };
    }

    const res =
      role === "editor"
        ? await actors.addEditor(canisterId, h.toLowerCase())
        : await actors.addWriter(canisterId, h.toLowerCase());
    if (res.__kind__ === "ok") {
      return { kind: "added", handle: u.handle, role, canisterId };
    }
    switch (res.err) {
      case "User not found":
        return { kind: "notFound", handle: u.handle };
      case "This handle is already an editor":
      case "Editor already exists":
        return { kind: "alreadyEditor", handle: u.handle };
      case "This handle is already a writer":
      case "Writer already exists":
        return { kind: "alreadyWriter", handle: u.handle };
      default:
        return { kind: "failed", handle: u.handle };
    }
  } catch {
    return { kind: "failed", handle: h };
  }
}

export async function removePublicationMember(
  actors: ActorsValue,
  publicationHandle: string,
  member: PublicationMember,
  currentPrincipal: string | null,
): Promise<{ ok: true; canisterId: string } | { ok: false }> {
  if (
    member.principal === currentPrincipal ||
    member.handle.toLowerCase() === PUBLICATION_FACTORY_HANDLE
  ) {
    return { ok: false };
  }
  try {
    const { publication, canisterId } = await fetchPublicationSettings(
      actors,
      publicationHandle,
    );
    const list =
      member.role === "editor" ? publication.editors : publication.writers;
    const stored =
      list.find((x) => x.toLowerCase() === member.handle.toLowerCase()) ??
      member.handle.toLowerCase();
    const res =
      member.role === "editor"
        ? await actors.removeEditor(canisterId, stored)
        : await actors.removeWriter(canisterId, stored);
    return res.__kind__ === "ok" ? { ok: true, canisterId } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function usePublicationMemberActions(publicationHandle: string) {
  const actors = useActors();
  const queryClient = useQueryClient();

  // Resolves once the refetches have landed; never throws.
  const invalidate = async (canisterId: string) => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["publication-members", canisterId],
        }),
        queryClient.invalidateQueries({
          predicate: (q) =>
            q.queryKey[0] === "publication-settings" &&
            typeof q.queryKey[1] === "string" &&
            q.queryKey[1].toLowerCase() === publicationHandle.toLowerCase(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["publication-editor-count", canisterId],
        }),
      ]);
    } catch {
      // best effort
    }
  };

  const addMember = async (
    rawHandle: string,
    role: MemberRole,
  ): Promise<AddMemberOutcome> => {
    const { canisterId, ...outcome } = await addPublicationMember(
      actors,
      publicationHandle,
      rawHandle,
      role,
    );
    if (outcome.kind === "added" && canisterId) await invalidate(canisterId);
    return outcome;
  };

  const removeMember = async (
    member: PublicationMember,
    currentPrincipal: string | null,
  ): Promise<{ ok: boolean }> => {
    const res = await removePublicationMember(
      actors,
      publicationHandle,
      member,
      currentPrincipal,
    );
    if (res.ok) await invalidate(res.canisterId);
    return { ok: res.ok };
  };

  return { addMember, removeMember };
}
