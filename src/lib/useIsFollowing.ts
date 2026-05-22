import { useAuth } from "../contexts/useAuth";
import { useMyProfile } from "./useMyProfile";

// Derives the caller's follow relationship with a target handle.
//
// Tri-state: `'unknown'` means we don't have enough information yet —
// either the user isn't authenticated, the target handle isn't ready,
// or `useMyProfile` is still loading. Consumers (e.g. `<FollowButton />`)
// branch differently on `unknown` vs `not-following`: `unknown` shows a
// "Follow" button that opens `LoginModal` on click, while `not-following`
// shows a "Follow" button that calls the mutation.
//
// Handle matching is case-insensitive because Nuance's User canister keys
// the lowercase reverse hashmap on `U.trim(handle)` after lowercasing
// at registration time (project lesson 2026-04-22). And — gotcha —
// `User.followersArray` on the returned User record is the list of handles
// the user FOLLOWS (forward), not their followers (project lesson
// 2026-05-12). The Motoko field naming is misleading; `buildUser` converts
// internal principal IDs to handles before the wire so this array is
// already in the right shape to compare against `target.handle`.

export type FollowState = "unknown" | "following" | "not-following";

export function useIsFollowing(
  handle: string | null | undefined,
): FollowState {
  const { isAuthenticated } = useAuth();
  const { data: me } = useMyProfile();
  if (!isAuthenticated || !handle) return "unknown";
  if (!me) return "unknown";
  const target = handle.toLowerCase();
  const follows = me.followersArray.some(
    (h) => h.toLowerCase() === target,
  );
  return follows ? "following" : "not-following";
}
