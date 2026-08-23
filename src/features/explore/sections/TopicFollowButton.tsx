import { useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { useModal } from "../../../services/modal";
import { useToast } from "../../../services/toast";
import { useIsFollowingTag } from "../../article/hooks/useIsFollowingTag";
import { useFollowTag } from "../../article/hooks/useFollowTag";
import { useUnfollowTag } from "../../article/hooks/useUnfollowTag";
import { useAllTags } from "../../onboarding/useAllTags";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../components/LoginModal/LoginModal";
import { topicFollowCopy } from "../../../constants/copy";
import type { PostTagModel } from "../../../candid/PostCore/PostCore";

// NIC-191 — hero "Follow topic" button on /explore/topic/:tag (canonical 11.3,
// button 1:52110). Surfaces the topic-follow affordance that was deferred at
// NIC-43 build time (degrade #1) and is now unblocked by the shipped
// topic-follow system (NIC-157: useFollowTag / useUnfollowTag / useIsFollowingTag).
//
// The topic route only carries the tag NAME (:tag); follow keys on tagId.
// Resolve the tagId from getAllTags() (useAllTags — already cached for the
// onboarding TopicsModal) by matching the display-case value case-insensitively.
// If no tagId resolves (unknown / zero-result tag, or while the list is still
// loading) render nothing — no dead affordance, mirroring the original NIC-43
// degrade posture.
export function TopicFollowButton({ routeTag }: { routeTag: string }) {
  const { data: allTags } = useAllTags();
  const match = allTags?.find(
    (t) => t.value.toLowerCase() === routeTag.trim().toLowerCase(),
  );
  if (!match) return null;
  return (
    <TopicFollowButtonInner tag={{ tagId: match.id, tagName: match.value }} />
  );
}

// Mirrors the shipped entity-follow FollowButton (pubs/writers): a primary
// gradient pill whose label swaps Follow topic -> Following -> Unfollow (hover),
// but wired to the tag-follow hooks (keyed on tagId) instead of the author hooks.
function TopicFollowButtonInner({ tag }: { tag: PostTagModel }) {
  const state = useIsFollowingTag(tag.tagId);
  const { isAuthenticated } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const follow = useFollowTag();
  const unfollow = useUnfollowTag();
  const [hovered, setHovered] = useState(false);

  const isFollowing = state === "following";
  const isPending = follow.isPending || unfollow.isPending;

  let buttonLabel: string;
  if (isPending) {
    buttonLabel = isFollowing
      ? topicFollowCopy.heroUnfollowingPending
      : topicFollowCopy.heroFollowingPending;
  } else if (isFollowing) {
    buttonLabel = hovered
      ? topicFollowCopy.heroUnfollow
      : topicFollowCopy.heroFollowing;
  } else {
    buttonLabel = topicFollowCopy.heroFollow;
  }

  const onClick = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (isPending) return;
    if (isFollowing) {
      unfollow.mutate(tag, {
        onSuccess: () =>
          toast.show(
            topicFollowCopy.unfollowed.replace("{tag}", tag.tagName),
            "success",
          ),
        onError: (err) => {
          console.error(err);
          toast.show(
            topicFollowCopy.unfollowError.replace("{tag}", tag.tagName),
            "error",
          );
        },
      });
    } else {
      follow.mutate(tag, {
        onSuccess: () =>
          toast.show(
            topicFollowCopy.followed.replace("{tag}", tag.tagName),
            "success",
          ),
        onError: (err) => {
          console.error(err);
          toast.show(
            topicFollowCopy.followError.replace("{tag}", tag.tagName),
            "error",
          );
        },
      });
    }
  };

  return (
    <div className="mt-4 flex justify-center md:mt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={(isFollowing
          ? topicFollowCopy.unfollowAria
          : topicFollowCopy.followAria
        ).replace("{tag}", tag.tagName)}
        className="bg-brand-gradient-button min-w-[calc(108*var(--fpx))] shrink-0 rounded-card px-6 py-2.5 text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
