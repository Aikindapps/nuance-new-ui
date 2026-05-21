import { useAuth } from "../../../../contexts/useAuth";
import { useModal } from "../../../../services/modal";
import { useToast } from "../../../../services/toast";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../../components/LoginModal/LoginModal";
import { useLikeComment } from "../../hooks/useLikeComment";
import { useUnlikeComment } from "../../hooks/useUnlikeComment";

// Comment like button — Figma §4.7 (`1:19461`). Like-only; Figma shows
// no downvote UI even though `Comment.downVotes` exists on the canister.
//
// Filled heart = current user has liked. Empty heart = not liked or
// not authed. Click:
//  - not authed → LoginModal
//  - authed + not liked → useLikeComment (optimistic add)
//  - authed + liked → useUnlikeComment (optimistic remove)
//
// Toast on success is verbose ("Liked" / "Unliked") so any rapid
// repeat-clicker doesn't get spammed; error toast surfaces canister err.

type Props = {
  bucketCanisterId: string;
  postId: string;
  commentId: string;
  upVotes: ReadonlyArray<string>;
};

export function LikeButton({
  bucketCanisterId,
  postId,
  commentId,
  upVotes,
}: Props) {
  const { isAuthenticated, principal } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const like = useLikeComment();
  const unlike = useUnlikeComment();

  const myPrincipal = principal?.toText();
  const iLiked = Boolean(myPrincipal && upVotes.includes(myPrincipal));
  const isPending = like.isPending || unlike.isPending;

  const onClick = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (isPending) return;

    const vars = { bucketCanisterId, postId, commentId };
    if (iLiked) {
      unlike.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not remove like.", "error"),
      });
    } else {
      like.mutate(vars, {
        onError: (err) =>
          toast.show(err.message || "Could not like comment.", "error"),
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={iLiked}
      aria-label={
        iLiked
          ? `Unlike comment (${upVotes.length} likes)`
          : `Like comment (${upVotes.length} likes)`
      }
      className="flex items-center gap-1.5 rounded-[calc(4*var(--fpx))] px-2 py-1 transition-colors hover:bg-ink-border-5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Heart filled={iLiked} className="size-4" />
      <span>{upVotes.length}</span>
    </button>
  );
}

function Heart({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: filled ? "var(--color-brand-purple)" : undefined }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
