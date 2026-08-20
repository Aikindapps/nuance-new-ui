// NIC-174 — shared role-gate hook for the "Publications" nav entry.
//
// Both UserMenu (desktop) and MobileNavDrawer (mobile) consume this to gate
// the Publications item on the same condition: the authed user is a member of
// at least one publication. Reading from useMyProfile() means no additional
// backend call is required — the profile is already fetched on login.

import { useMyProfile } from "./useMyProfile";
import type { PublicationObject } from "../candid/User/User";

export type MyPublicationsEntry = {
  /** Whether the Publications nav item should be rendered. */
  show: boolean;
  /**
   * The lowercased handle of the user's first publication, used to build the
   * manage-articles route: `/publication/${firstPubHandle}/manage/articles`.
   * Null when the user has no publications.
   */
  firstPubHandle: string | null;
};

export function useMyPublicationsEntry(): MyPublicationsEntry {
  const profile = useMyProfile();
  const pubs: PublicationObject[] = profile.data?.publicationsArray ?? [];

  return {
    show: pubs.length > 0,
    firstPubHandle: pubs[0]?.publicationName?.toLowerCase() ?? null,
  };
}
