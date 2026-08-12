import { useAuth } from "../../../contexts/useAuth";
import { useModal } from "../../../services/modal";
import { useToast } from "../../../services/toast";
import { useIsFollowingTag } from "../hooks/useIsFollowingTag";
import { useFollowTag } from "../hooks/useFollowTag";
import { useUnfollowTag } from "../hooks/useUnfollowTag";
import { IconStar } from "../../../components/ui/icons/IconStar";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../components/LoginModal/LoginModal";
import { topicFollowCopy } from "../../../constants/copy";
import type { PostTagModel } from "../../../candid/PostCore/PostCore";

// §4.8 (un)follow-tag pill (NIC-157). Two independent tap targets:
// (1) star BUTTON — follow/unfollow toggle.
// (2) label LINK — navigates to /explore/topic/:tag (NIC-43).
// The two are gap-2 siblings so hit areas never overlap.
export function TopicFollowPill({ tag }: { tag: PostTagModel }) {
  const state = useIsFollowingTag(tag.tagId);
  const { isAuthenticated } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const follow = useFollowTag();
  const unfollow = useUnfollowTag();

  const isFollowing = state === "following";
  const isPending = follow.isPending || unfollow.isPending;

  const onStarClick = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (isPending) return;
    if (isFollowing) {
      unfollow.mutate(tag, {
        onSuccess: () =>
          toast.show(topicFollowCopy.unfollowed.replace("{tag}", tag.tagName), "success"),
        onError: (err) => {
          console.error(err);
          toast.show(topicFollowCopy.unfollowError.replace("{tag}", tag.tagName), "error");
        },
      });
    } else {
      follow.mutate(tag, {
        onSuccess: () =>
          toast.show(topicFollowCopy.followed.replace("{tag}", tag.tagName), "success"),
        onError: (err) => {
          console.error(err);
          toast.show(topicFollowCopy.followError.replace("{tag}", tag.tagName), "error");
        },
      });
    }
  };

  return (
    <div className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-purple-10 pl-6 pr-4">
      <a
        href={`/explore/topic/${encodeURIComponent(tag.tagName)}`}
        className={`min-w-0 max-w-[calc(260*var(--fpx))] truncate rounded-sm text-body font-medium text-brand-purple transition-colors hover:underline lg:text-lg${isPending ? " opacity-60" : ""}`}
      >
        {tag.tagName}
      </a>
      <button
        type="button"
        onClick={onStarClick}
        disabled={isPending}
        title={isFollowing ? topicFollowCopy.unfollowTooltip : topicFollowCopy.followTooltip}
        aria-pressed={isFollowing}
        aria-label={(isFollowing ? topicFollowCopy.unfollowAria : topicFollowCopy.followAria).replace(
          "{tag}",
          tag.tagName,
        )}
        className="grid size-4 shrink-0 place-items-center rounded-full text-brand-purple transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-100"
      >
        {isPending ? (
          <>
            <svg
              className="size-4 animate-spin"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.25"
              />
              <path
                d="M8 2a6 6 0 0 1 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">{topicFollowCopy.updating}</span>
          </>
        ) : (
          <IconStar filled={isFollowing} className="size-4" />
        )}
      </button>
    </div>
  );
}
