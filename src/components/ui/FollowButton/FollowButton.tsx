import { useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { useIsFollowing } from "../../../lib/useIsFollowing";
import { useMyProfile } from "../../../lib/useMyProfile";
import { useModal } from "../../../services/modal";
import { useToast } from "../../../services/toast";
import { useFollowAuthor } from "../../../features/article/hooks/useFollowAuthor";
import { useUnfollowAuthor } from "../../../features/article/hooks/useUnfollowAuthor";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../LoginModal/LoginModal";

// Cross-surface Follow/Unfollow button — Figma §4.3 (author) + §4.9
// (publication). PR #8 Phase 3a extracts this from the inert shells in
// `AuthorBlock` and `PublicationPopover`. Decision #34 contract:
//
// - Logged-out click → opens LoginModal (matches Header/CtaBanner pattern).
//   The user re-clicks Follow post-login; intent does not auto-resume.
// - Self-follow is impossible — the button renders nothing when the target
//   handle matches the caller's own handle (case-insensitive).
// - Follow / unfollow mutations carry the optimistic-flip + rollback
//   contract (see useFollowAuthor / useUnfollowAuthor).
// - Toast on success + on error (the project's first real toast consumer
//   per decision #22).
//
// Visual: gradient pill that says "Follow" when not-following; on the
// following state shows "Following" by default, swaps to "Unfollow" on
// hover (Twitter / X pattern) to communicate the click action.

type Props = {
  targetHandle: string;
  // Overrides the not-following visible text and the follow-case aria-label.
  // "Following" / "Unfollow" hover and pending states stay unchanged.
  // Omitting `label` preserves today's "Follow" behaviour so existing
  // consumers (ArticleAuthorBlock, PublicationPopover) are untouched.
  label?: string;
};

export function FollowButton({ targetHandle, label }: Props) {
  const state = useIsFollowing(targetHandle);
  const { isAuthenticated } = useAuth();
  const { data: me } = useMyProfile();
  const modal = useModal();
  const toast = useToast();
  const followMutation = useFollowAuthor();
  const unfollowMutation = useUnfollowAuthor();
  const [hovered, setHovered] = useState(false);

  if (me && me.handle.toLowerCase() === targetHandle.toLowerCase()) {
    return null;
  }

  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = state === "following";

  const followText = label ?? "Follow";
  let buttonLabel: string;
  if (isPending) {
    buttonLabel = isFollowing ? "Unfollowing…" : "Following…";
  } else if (isFollowing) {
    buttonLabel = hovered ? "Unfollow" : "Following";
  } else {
    buttonLabel = followText;
  }

  const onClick = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (isPending) return;

    if (isFollowing) {
      unfollowMutation.mutate(targetHandle, {
        onSuccess: () => toast.show(`Unfollowed @${targetHandle}`, "success"),
        onError: (err) =>
          toast.show(err.message || "Could not unfollow", "error"),
      });
    } else {
      followMutation.mutate(targetHandle, {
        onSuccess: () => toast.show(`Following @${targetHandle}`, "success"),
        onError: (err) =>
          toast.show(err.message || "Could not follow", "error"),
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={isFollowing ? `Unfollow @${targetHandle}` : `${followText} @${targetHandle}`}
      className="bg-brand-gradient-button min-w-[calc(108*var(--fpx))] shrink-0 rounded-card px-6 py-2.5 text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {buttonLabel}
    </button>
  );
}
