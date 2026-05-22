import { useState } from "react";
import { useAuth } from "../../../../contexts/useAuth";
import { useModal } from "../../../../services/modal";
import { useToast } from "../../../../services/toast";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../../components/LoginModal/LoginModal";
import { useSaveComment } from "../../hooks/useSaveComment";

// Article comment composer — Figma §4.5 (top-level mode, this phase) +
// §4.6 (reply mode, Phase 6).
//
// Auth gate: textarea is focusable and typeable for anyone, but submit
// click on a logged-out principal opens LoginModal (matches Header/CtaBanner
// pattern). The user re-clicks Post post-login — intent does not
// auto-resume in PR #8 (decision #34).
//
// Validation: 1-2000 char range. Trim before submit. Char count appears
// when content is present; turns warning-coloured near the limit.
//
// Submit semantics: invalidate-only (no optimistic insert) — the canister
// assigns commentId, so an optimistic guess would race. The hook calls
// setQueryData with the server-truth thread on success + invalidates so
// the userMap re-hydrates for the new commenter.

const MAX_LEN = 2000;
const WARN_AT = 1900;

type Props = {
  bucketCanisterId: string;
  postId: string;
  // When set, the composer is in reply mode (Phase 6). Header copy + the
  // model's replyToCommentId differ.
  replyToCommentId?: string;
  replyToHandle?: string;
  // When set, the composer is in edit mode (review m5). Pre-fills with
  // `initialDraft`; submit calls saveComment with this commentId so the
  // canister updates in place. `replyToCommentId` MUST be omitted when
  // editing — the two modes are mutually exclusive.
  editCommentId?: string;
  initialDraft?: string;
  onCancel?: () => void; // also fires on successful submit when set
  autoFocus?: boolean;
};

export function CommentComposer({
  bucketCanisterId,
  postId,
  replyToCommentId,
  replyToHandle,
  editCommentId,
  initialDraft = "",
  onCancel,
  autoFocus = false,
}: Props) {
  const { isAuthenticated } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const saveComment = useSaveComment();

  const [draft, setDraft] = useState(initialDraft);
  const isEdit = Boolean(editCommentId);
  const isReply = !isEdit && Boolean(replyToCommentId);
  const trimmed = draft.trim();
  const length = draft.length;
  const overLimit = length > MAX_LEN;
  const isUnchanged = isEdit && trimmed === initialDraft.trim();
  const canSubmit =
    trimmed.length > 0 &&
    !overLimit &&
    !saveComment.isPending &&
    !isUnchanged;

  const submit = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (!canSubmit) return;

    saveComment.mutate(
      {
        bucketCanisterId,
        postId,
        content: trimmed,
        replyToCommentId: isEdit ? undefined : replyToCommentId,
        commentId: editCommentId,
      },
      {
        onSuccess: () => {
          if (!isEdit) setDraft("");
          toast.show(
            isEdit
              ? "Comment saved."
              : isReply
                ? "Reply posted."
                : "Comment posted.",
            "success",
          );
          onCancel?.();
        },
        onError: (err) => {
          toast.show(
            err.message ||
              (isEdit
                ? "Could not save changes."
                : isReply
                  ? "Could not post reply."
                  : "Could not post comment."),
            "error",
          );
        },
      },
    );
  };

  const placeholder = isEdit
    ? "Edit your comment…"
    : isReply
      ? `Reply to @${replyToHandle ?? ""}…`
      : "Share your thoughts on this article…";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      {(isReply || isEdit) && (
        <div className="flex items-center justify-between text-label text-ink-60">
          <span>
            {isEdit ? (
              "Editing comment"
            ) : (
              <>
                Replying to{" "}
                <span className="font-medium text-ink-80">
                  @{replyToHandle}
                </span>
              </>
            )}
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-brand-purple underline hover:no-underline"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        rows={3}
        autoFocus={autoFocus}
        aria-label={isReply ? "Write a reply" : "Write a comment"}
        className="min-h-[calc(92*var(--fpx))] w-full resize-y rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink placeholder:text-ink-60 focus:border-brand-purple focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <span
          aria-live="polite"
          className={`text-label ${overLimit ? "text-error" : length >= WARN_AT ? "text-ink-80" : "text-ink-60"}`}
        >
          {length > 0 ? `${length} / ${MAX_LEN}` : " "}
        </span>
        <button
          type="submit"
          disabled={!canSubmit && isAuthenticated}
          className="bg-brand-gradient-button rounded-card px-6 py-2.5 text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveComment.isPending
            ? isEdit
              ? "Saving…"
              : "Posting…"
            : isEdit
              ? "Save"
              : isReply
                ? "Post reply"
                : "Post comment"}
        </button>
      </div>
    </form>
  );
}
