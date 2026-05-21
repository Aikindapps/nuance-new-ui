import { Avatar } from "../../../../components/ui/Avatar";
import { formatRelativeTime } from "../../../../lib/formatRelativeTime";
import type { Comment } from "../../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../../candid/User/User";

// Single comment in the article comments thread — Figma §4.5 / §4.6.
//
// PR #8 Phase 4b ships the visual + recursive structure. Like and Reply
// buttons are inert shells here:
//   - Phase 6 wires Reply (opens an inline CommentComposer in reply mode).
//   - Phase 7 wires Like (the LikeButton component, optimistic upVote).
//
// Recursion guard: depth 0 = top-level, depth ≥ 1 = indented one level.
// Replies of replies render at the same indentation as their immediate
// parent (flat threading beyond depth 1) — Figma `1:18887` shows no
// further indentation for deeper chains, and infinite nesting would
// break the layout on narrow viewports.

const MAX_INDENT_DEPTH = 1;

type Props = {
  comment: Comment;
  userMap: Map<string, UserListItem>;
  depth?: number;
};

export function CommentBlock({ comment, userMap, depth = 0 }: Props) {
  const user = userMap.get(comment.handle.toLowerCase());
  const displayName = user?.displayName || comment.handle;
  const avatarSrc = user?.avatar || comment.avatar;
  const isVerified = user?.isVerified ?? comment.isVerified;

  const createdMs = parseInt(comment.createdAt.trim(), 10);
  const timestamp = Number.isFinite(createdMs)
    ? formatRelativeTime(createdMs)
    : "";

  const upVoteCount = comment.upVotes.length;
  const indentClass = depth > 0 ? "lg:pl-14" : "";

  return (
    <article
      className={`${indentClass} flex flex-col gap-3`}
      aria-label={`Comment by @${comment.handle}`}
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
            <span className="text-ink-60">@{comment.handle}</span>
            {isVerified && <span className="text-brand-purple">✓</span>}
            {timestamp && (
              <>
                <span className="text-ink-40">·</span>
                <span className="text-ink-60">{timestamp}</span>
              </>
            )}
            {comment.editedAt && (
              <span className="text-ink-60">(edited)</span>
            )}
          </div>
          <p className="whitespace-pre-wrap break-words text-body text-ink">
            {comment.content}
          </p>
          <div className="mt-1 flex items-center gap-4 text-label text-ink-60">
            <button
              type="button"
              aria-disabled
              title="Coming soon"
              aria-label={`Like comment (${upVoteCount} likes)`}
              className="flex items-center gap-1.5 rounded-[calc(4*var(--fpx))] px-2 py-1 transition-colors hover:bg-ink-border-5 disabled:cursor-not-allowed"
            >
              <span aria-hidden>♥</span>
              <span>{upVoteCount}</span>
            </button>
            <button
              type="button"
              aria-disabled
              title="Coming soon"
              className="rounded-[calc(4*var(--fpx))] px-2 py-1 transition-colors hover:bg-ink-border-5 disabled:cursor-not-allowed"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 flex flex-col gap-6">
          {comment.replies.map((reply) => (
            <CommentBlock
              key={reply.commentId}
              comment={reply}
              userMap={userMap}
              depth={Math.min(depth + 1, MAX_INDENT_DEPTH)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
