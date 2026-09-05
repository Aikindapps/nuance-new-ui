// NIC-174 — shared role-gate hook for the "Publications" nav entry.
//
// Both UserMenu (desktop) and MobileNavDrawer (mobile) consume this to gate
// the Publications item on the same condition: the authed user is a member of
// at least one publication. Reading from useMyProfile() means no additional
// backend call is required — the profile is already fetched on login.
//
// NIC-248: extended to expose the full publication list, count, and query
// status flags so callers can branch on count and show the chooser UI.

import { useMyProfile } from "./useMyProfile";
import type { PublicationObject } from "../candid/User/User";

export type PublicationEntry = {
  /** Lowercased handle used in the /publication/:handle route segment. */
  handle: string;
  /** Display name (= publicationName from the canister). */
  name: string;
  /** Whether the user is an editor (true) or writer (false) of this publication. */
  isEditor: boolean;
};

export type MyPublicationsEntry = {
  /** Whether the Publications nav item should be rendered. */
  show: boolean;
  /**
   * The lowercased handle of the user's first publication, used to build the
   * manage-articles route: `/publication/${firstPubHandle}/manage/articles`.
   * Null when the user has no publications.
   */
  firstPubHandle: string | null;
  /** All publications the user is a member of, in canister order. */
  publications: PublicationEntry[];
  /** Number of publications (= publications.length). */
  count: number;
  /** True while the profile query is in-flight. */
  isLoading: boolean;
  /** True if the profile query failed. */
  isError: boolean;
  /** Trigger a fresh profile fetch (e.g. after an error). */
  refetch: () => void;
};

export function useMyPublicationsEntry(): MyPublicationsEntry {
  const profile = useMyProfile();
  const pubs: PublicationObject[] = profile.data?.publicationsArray ?? [];

  const publications: PublicationEntry[] = pubs.map((p) => ({
    handle: p.publicationName.toLowerCase(),
    name: p.publicationName,
    isEditor: p.isEditor,
  }));

  return {
    show: pubs.length > 0,
    firstPubHandle: pubs[0]?.publicationName?.toLowerCase() ?? null,
    publications,
    count: publications.length,
    isLoading: profile.isLoading,
    isError: profile.isError,
    refetch: () => { void profile.refetch(); },
  };
}
