import { useAuth } from "../../../contexts/useAuth";
import { useMyTags } from "../../home/hooks/useMyTags";

export type TagFollowState = "unknown" | "following" | "not-following";

// Derives whether the authed caller follows a given tagId. `unknown` when not
// authed or the followed-tags list isn't ready — consumers show an outline
// star that opens LoginModal on click; `not-following` shows an outline star
// that calls the follow mutation.
export function useIsFollowingTag(tagId: string | null | undefined): TagFollowState {
  const { isAuthenticated } = useAuth();
  const { data: myTags } = useMyTags();
  if (!isAuthenticated || !tagId) return "unknown";
  if (!myTags) return "unknown";
  return myTags.some((t) => t.tagId === tagId) ? "following" : "not-following";
}
