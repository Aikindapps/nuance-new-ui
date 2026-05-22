import type { ComponentType } from "react";
import { useAuth } from "../../../../contexts/useAuth";
import { useModal } from "../../../../services/modal";
import { useToast } from "../../../../services/toast";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../../components/LoginModal/LoginModal";
import { IconThumbsUp } from "../../../../components/ui/icons/IconThumbsUp";
import { IconThumbsDown } from "../../../../components/ui/icons/IconThumbsDown";
import { useLikeComment } from "../../hooks/useLikeComment";
import { useDownvoteComment } from "../../hooks/useDownvoteComment";
import { useUnvoteComment } from "../../hooks/useUnvoteComment";

// Per-comment Like + Dislike pair — Figma §4.7 (`1:19534`).
//
// The canister enforces per-caller single-slot voting: a click on Like
// while currently downvoted both adds the caller to upVotes AND removes
// them from downVotes in one round-trip (and vice versa). Optimism in
// useLikeComment / useDownvoteComment mirrors that, so a cross-vote
// click shows the count flip atomically (+1 Like / −1 Dislike).
//
// Auth gate: a logged-out click on either button opens LoginModal. The
// user re-clicks post-login — intent does not auto-resume (decision #34).
//
// State machine (current user P):
//   - P in upVotes → Like is "active", click Like = unvote, click Dislike = downvote
//   - P in downVotes → Dislike is "active", click Like = upvote (cross), click Dislike = unvote
//   - P in neither → click Like = upvote, click Dislike = downvote

type Props = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
  upVotes: ReadonlyArray<string>;
  downVotes: ReadonlyArray<string>;
};

export function VoteButtons({
  bucketCanisterId,
  postId,
  commentId,
  upVotes,
  downVotes,
}: Props) {
  const { isAuthenticated, principal } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const like = useLikeComment();
  const downvote = useDownvoteComment();
  const unvote = useUnvoteComment();

  const myPrincipal = principal?.toText();
  const iUpvoted = Boolean(myPrincipal && upVotes.includes(myPrincipal));
  const iDownvoted = Boolean(myPrincipal && downVotes.includes(myPrincipal));
  const isPending = like.isPending || downvote.isPending || unvote.isPending;

  const requireAuth = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return false;
    }
    return true;
  };

  const onLikeClick = () => {
    if (!requireAuth() || isPending) return;
    const vars = { bucketCanisterId, postId, commentId };
    if (iUpvoted) {
      unvote.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not remove vote.", "error"),
      });
    } else {
      like.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not like comment.", "error"),
      });
    }
  };

  const onDislikeClick = () => {
    if (!requireAuth() || isPending) return;
    const vars = { bucketCanisterId, postId, commentId };
    if (iDownvoted) {
      unvote.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not remove vote.", "error"),
      });
    } else {
      downvote.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not dislike comment.", "error"),
      });
    }
  };

  return (
    <>
      <VoteButton
        Icon={IconThumbsUp}
        label="Like"
        count={upVotes.length}
        active={iUpvoted}
        disabled={isPending}
        onClick={onLikeClick}
        ariaLabel={
          iUpvoted
            ? `Remove like (${upVotes.length} likes)`
            : `Like comment (${upVotes.length} likes)`
        }
      />
      <VoteButton
        Icon={IconThumbsDown}
        label="Dislike"
        count={downVotes.length}
        active={iDownvoted}
        disabled={isPending}
        onClick={onDislikeClick}
        ariaLabel={
          iDownvoted
            ? `Remove dislike (${downVotes.length} dislikes)`
            : `Dislike comment (${downVotes.length} dislikes)`
        }
      />
    </>
  );
}

function VoteButton({
  Icon,
  label,
  count,
  active,
  disabled,
  onClick,
  ariaLabel,
}: {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 rounded-[calc(4*var(--fpx))] px-2 py-1 text-brand-purple transition-colors hover:bg-ink-border-5 disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "bg-brand-purple-5" : ""
      }`}
    >
      <Icon className="size-5" />
      <span>{count > 0 ? `${label} (${count})` : label}</span>
    </button>
  );
}
