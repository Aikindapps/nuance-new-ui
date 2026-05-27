import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { writeArticleCopy } from "../constants/copy";
import { parseArticleSegment } from "../lib/articleUrl";
import { WriteArticleForm } from "../features/write/WriteArticleForm";
import { useEditArticle } from "../features/write/hooks/useEditArticle";

// Write Article — Figma Page 5 (PR #9, decision #36). Two entry points:
//   /write                     — new article
//   /write/:postIdAndBucket    — edit an existing article (reopen-to-edit)
// Writer-only (authed; OnboardingGate guarantees a registered profile). Anon →
// redirect home, matching the /following gate. White-page shell, no logged-out
// variant. The editor chunk is lazy (all @lexical/* out of the home bundle).
const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <title>{writeArticleCopy.metadata.title}</title>
      <meta name="description" content={writeArticleCopy.metadata.description} />
      <HeaderLoggedIn />
      <main className={`${CONTAINER} pt-12 lg:pt-20`}>{children}</main>
    </div>
  );
}

export function WriteArticle() {
  const { isAuthenticated, isLoading } = useAuth();
  const { postIdAndBucket } = useParams();
  const parsed = postIdAndBucket ? parseArticleSegment(postIdAndBucket) : null;
  const editQuery = useEditArticle(
    parsed?.bucketCanisterId ?? "",
    parsed?.postId ?? "",
  );

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (parsed) {
    if (editQuery.isPending) {
      return (
        <Shell>
          <p className="px-6 py-12 text-body text-ink-60 lg:px-24">
            {writeArticleCopy.loadingArticle}
          </p>
        </Shell>
      );
    }
    if (editQuery.isError || editQuery.data == null) {
      return (
        <Shell>
          <p className="px-6 py-12 text-body text-ink-60 lg:px-24">
            {writeArticleCopy.loadError}
          </p>
        </Shell>
      );
    }
    return (
      <Shell>
        <WriteArticleForm key={parsed.postId} initial={editQuery.data} />
      </Shell>
    );
  }

  return (
    <Shell>
      <WriteArticleForm key="new" />
    </Shell>
  );
}

export default WriteArticle;
