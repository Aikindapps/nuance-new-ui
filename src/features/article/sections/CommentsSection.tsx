import Skeleton from "@mui/material/Skeleton";
import { useComments } from "../hooks/useComments";
import { CommentBlock } from "./comments/CommentBlock";
import { CommentComposer } from "./comments/CommentComposer";

// Article comments block — Figma §4.5 (`1:19747`). Phase 5 adds the
// top-level composer above the list (visible in both empty and populated
// states). Phase 6 wires the per-comment reply composer; Phase 7 the
// like button.
//
// Mounted inside the article column so the comments align with the body
// column width (~932px design pixels). Below the AuthorBlock, above the
// rails — matches Figma `1:18798` frame ordering.

type Props = {
  bucketCanisterId: string;
  postId: string;
};

export function CommentsSection({ bucketCanisterId, postId }: Props) {
  const query = useComments(bucketCanisterId, postId);

  return (
    <section
      aria-label="Comments"
      className="px-6 lg:px-14"
    >
      <div className="border-t border-ink-border/10 pt-8 lg:pt-[calc(50*var(--fpx))]">
        {query.isPending ? (
          <LoadingShell />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="text-title-sm font-medium text-ink">
              {query.data.totalNumberOfComments === "0"
                ? "No comments yet"
                : `${query.data.totalNumberOfComments} comments`}
            </h2>
            <CommentComposer
              bucketCanisterId={bucketCanisterId}
              postId={postId}
            />
            {query.data.comments.length > 0 && (
              <div className="mt-2 flex flex-col gap-8">
                {query.data.comments.map((comment) => (
                  <CommentBlock
                    key={comment.commentId}
                    comment={comment}
                    userMap={query.data.userMap}
                    bucketCanisterId={bucketCanisterId}
                    postId={postId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LoadingShell() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" width={160} sx={{ height: "calc(28 * var(--fpx))" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="circular" sx={{ width: "calc(48 * var(--fpx))", height: "calc(48 * var(--fpx))" }} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-card border border-ink-border/20 bg-ink-border-5 p-6 text-center">
      <p className="text-body text-ink-80">
        Couldn’t load the comments.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-body font-medium text-brand-purple underline hover:no-underline"
      >
        Try again
      </button>
    </div>
  );
}

