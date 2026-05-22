import type { Comment } from "../../../candid/PostBucket/PostBucket";

// Shared helper for the comment-mutation hooks' optimistic updates
// (useLikeComment, useDownvoteComment, useUnvoteComment, useReportComment).
//
// Comments are server-assembled into a recursive `replies` tree. To toggle
// a vote or flip a flag optimistically we walk that tree, find the
// commentId, and apply the update. The traversal always returns a new
// array — React Query reads it as a new cache value and re-renders the
// consumers. For PR #8's comment-thread sizes (tens of comments at most)
// the cost is negligible.

export type CommentUpdater = (comment: Comment) => Comment;

export function updateCommentInTree(
  comments: ReadonlyArray<Comment>,
  commentId: string,
  update: CommentUpdater,
): Comment[] {
  return comments.map((c) => {
    if (c.commentId === commentId) return update(c);
    if (c.replies.length === 0) return c;
    return { ...c, replies: updateCommentInTree(c.replies, commentId, update) };
  });
}
