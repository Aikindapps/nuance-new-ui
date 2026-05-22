import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../../../components/ui/Avatar";
import { formatRelativeTime } from "../../../../lib/formatRelativeTime";
import { useAuth } from "../../../../contexts/useAuth";
import { useModal } from "../../../../services/modal";
import { useToast } from "../../../../services/toast";
import {
  LOGIN_MODAL_TITLE_ID,
  LoginModal,
} from "../../../../components/LoginModal/LoginModal";
import { IconComment } from "../../../../components/ui/icons/IconComment";
import { IconEdit } from "../../../../components/ui/icons/IconEdit";
import { IconFlag } from "../../../../components/ui/icons/IconFlag";
import { IconShare } from "../../../../components/ui/icons/IconShare";
import { CommentComposer } from "./CommentComposer";
import { VoteButtons } from "./VoteButtons";
import { useReportComment } from "../../hooks/useReportComment";
import type { Comment } from "../../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../../candid/User/User";

// Single comment in the article comments thread — Figma §4.5 / §4.6 / §4.7.
//
// Action set branches on ownership (review m5 + production parity):
//   - Owner (current user's handle === comment.handle): Edit + Reply + Share
//   - Other: Like + Dislike + Reply + Share + Flag
// Like/Dislike live in VoteButtons (handles cross-removal optimism); Edit
// swaps the body for an inline CommentComposer in edit mode; Flag fires a
// one-click reportComment that the canister fans out to internal moderation
// + Slack; Share copies a comment-deep-link to clipboard.
//
// Recursion guard: depth 0 = top-level, depth ≥ 1 = indented one level.
// Replies of replies render at the same indentation as their immediate
// parent (flat threading beyond depth 1) — Figma `1:18887` shows no
// further indentation for deeper chains, and infinite nesting would
// break the layout on narrow viewports.

const MAX_INDENT_DEPTH = 1;

const CENSORED_BODY = (
  <em className="text-ink-60">
    This comment was removed due to{" "}
    <a
      href="https://wiki.nuance.xyz/nuance/content-rules"
      target="_blank"
      rel="noreferrer"
      className="text-brand-purple underline hover:no-underline"
    >
      content rules
    </a>
    .
  </em>
);

type Props = {
  comment: Comment;
  userMap: Map<string, UserListItem>;
  bucketCanisterId: string;
  postId: string;
  depth?: number;
};

export function CommentBlock({
  comment,
  userMap,
  bucketCanisterId,
  postId,
  depth = 0,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { isAuthenticated, principal } = useAuth();
  const modal = useModal();
  const toast = useToast();
  const report = useReportComment();

  // Comments come back from the canister with `comment.handle` and
  // `comment.avatar` blanked — `creator` (principal text) is the only
  // reliable identifier. Lookup the User record by principal.
  const user = userMap.get(comment.creator);
  const displayName = user?.displayName || user?.handle || "(unknown user)";
  const userHandle = user?.handle ?? "";
  const avatarSrc = user?.avatar ?? "";
  const isVerified = user?.isVerified ?? false;
  // Ownership via principal (msg.caller-filled, stable).
  const myPrincipalText = principal?.toText();
  const isOwner =
    !!myPrincipalText && myPrincipalText === comment.creator;

  const createdMs = parseInt(comment.createdAt.trim(), 10);
  const timestamp = Number.isFinite(createdMs)
    ? formatRelativeTime(createdMs)
    : "";

  const indentClass = depth > 0 ? "lg:pl-14" : "";

  const onShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?comment=${comment.commentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.show("Link copied to clipboard.", "success");
    } catch {
      // Clipboard unavailable (insecure context / permission denied).
      toast.show("Could not copy link.", "error");
    }
  };

  const onFlag = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    if (comment.isCensored) {
      toast.show("This comment has already been reported.", "success");
      return;
    }
    if (report.isPending) return;
    report.mutate(
      { bucketCanisterId, postId, commentId: comment.commentId },
      {
        onSuccess: () => toast.show("Comment reported.", "success"),
        onError: (err) =>
          toast.show(err.message || "Could not report comment.", "error"),
      },
    );
  };

  return (
    <article
      id={`comment-${comment.commentId}`}
      className={`${indentClass} scroll-mt-24 lg:scroll-mt-32 flex flex-col gap-3`}
      aria-label={userHandle ? `Comment by @${userHandle}` : "Comment"}
    >
      <div className="flex items-start gap-3 lg:gap-4">
        <Avatar
          src={avatarSrc}
          label={displayName}
          sizeClass="size-10 lg:size-12 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-label">
            <span className="font-medium text-ink">{displayName}</span>
            {userHandle && (
              <Link
                to={`/${userHandle.toLowerCase()}`}
                className="text-brand-purple underline underline-offset-2 hover:no-underline"
              >
                @{userHandle}
              </Link>
            )}
            {isVerified && <span className="text-brand-purple">✓</span>}
            {timestamp && (
              <>
                <span className="text-ink-40">·</span>
                <span className="text-ink-60">{timestamp}</span>
              </>
            )}
            {comment.editedAt && <span className="text-ink-60">(edited)</span>}
          </div>

          {editOpen ? (
            <CommentComposer
              bucketCanisterId={bucketCanisterId}
              postId={postId}
              editCommentId={comment.commentId}
              initialDraft={comment.content}
              onCancel={() => setEditOpen(false)}
              autoFocus
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-body text-ink">
                {comment.isCensored ? CENSORED_BODY : comment.content}
              </p>
              {!comment.isCensored && (
                <div className="mt-1 flex flex-wrap items-center gap-1 text-label">
                  {isOwner ? (
                    <InlineButton
                      label="Edit"
                      onClick={() => setEditOpen(true)}
                      Icon={IconEdit}
                    />
                  ) : (
                    <VoteButtons
                      bucketCanisterId={bucketCanisterId}
                      postId={postId}
                      commentId={comment.commentId}
                      upVotes={comment.upVotes}
                      downVotes={comment.downVotes}
                    />
                  )}
                  <InlineButton
                    label={replyOpen ? "Cancel reply" : "Reply"}
                    onClick={() => setReplyOpen((v) => !v)}
                    ariaExpanded={replyOpen}
                    Icon={IconComment}
                  />
                  <InlineButton
                    label="Share"
                    onClick={onShare}
                    Icon={IconShare}
                  />
                  {!isOwner && (
                    <InlineButton
                      ariaLabel="Report comment"
                      onClick={onFlag}
                      Icon={IconFlag}
                      iconOnly
                      muted
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {replyOpen && (
        <div className={depth === 0 ? "lg:pl-14" : ""}>
          <CommentComposer
            bucketCanisterId={bucketCanisterId}
            postId={postId}
            replyToCommentId={comment.commentId}
            replyToHandle={comment.handle}
            onCancel={() => setReplyOpen(false)}
            autoFocus
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-2 flex flex-col gap-6">
          {comment.replies.map((reply) => (
            <CommentBlock
              key={reply.commentId}
              comment={reply}
              userMap={userMap}
              bucketCanisterId={bucketCanisterId}
              postId={postId}
              depth={Math.min(depth + 1, MAX_INDENT_DEPTH)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

type InlineButtonProps = {
  label?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  onClick: () => void;
  Icon: ComponentType<{ className?: string }>;
  iconOnly?: boolean;
  muted?: boolean;
};

function InlineButton({
  label,
  ariaLabel,
  ariaExpanded,
  onClick,
  Icon,
  iconOnly = false,
  muted = false,
}: InlineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel || label}
      className={`flex items-center gap-1.5 rounded-[calc(4*var(--fpx))] px-2 py-1 transition-colors hover:bg-ink-border-5 ${
        muted ? "text-ink-40" : "text-brand-purple"
      }`}
    >
      <Icon className="size-5" />
      {!iconOnly && label && <span>{label}</span>}
    </button>
  );
}
