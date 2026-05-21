import Skeleton from "@mui/material/Skeleton";
import { useComments } from "../hooks/useComments";

// Article comments block — Figma §4.5 (`1:19747`). Phase 4a builds the
// data hook + four branches (pending / error / empty / populated header).
// Phase 4b adds CommentBlock with recursive replies + wires the bar/meta
// count. Phase 5 adds the composer; Phase 6 the reply composer; Phase 7
// the like button.
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
        ) : query.data.totalNumberOfComments === "0" ? (
          <EmptyState />
        ) : (
          // Populated branch is a header-only placeholder in Phase 4a.
          // Phase 4b plugs CommentBlock + recursive render here.
          <header>
            <h2 className="text-title-sm font-medium text-ink">
              {query.data.totalNumberOfComments} comments
            </h2>
          </header>
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

function EmptyState() {
  return (
    <div>
      <h2 className="text-title-sm font-medium text-ink">
        No comments yet
      </h2>
      <p className="mt-2 text-body text-ink-60">
        Be the first to share your thoughts on this article.
      </p>
    </div>
  );
}
