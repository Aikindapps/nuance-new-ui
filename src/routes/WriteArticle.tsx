import type { ReactNode } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { writeArticleCopy } from "../constants/copy";
import { parseArticleSegment } from "../lib/articleUrl";
import { WriteArticleForm } from "../features/write/WriteArticleForm";
import { useEditArticle } from "../features/write/hooks/useEditArticle";
import {
  writeReturnFromState,
  type WriteReturn,
} from "../features/write/lib/writeReturn";
import { usePublicationMembership } from "../features/publication/hooks/usePublicationMembership";

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

// Back link on the load-error and read-only screens: My articles by default,
// or the publication's Manage Articles list when the editor came from there
// (NIC-548).
function BackLink({ back }: { back: WriteReturn }) {
  return (
    <Link to={back.to} className="mt-4 inline-block text-body font-medium text-brand-purple hover:underline">
      {back.label}
    </Link>
  );
}

export function WriteArticle() {
  const { isAuthenticated, isLoading } = useAuth();
  const { postIdAndBucket } = useParams();
  const location = useLocation();
  const back = writeReturnFromState(location.state);
  const [searchParams] = useSearchParams();
  const initialPublication = searchParams.get("publication") ?? undefined;
  const parsed = postIdAndBucket ? parseArticleSegment(postIdAndBucket) : null;
  const editQuery = useEditArticle(
    parsed?.bucketCanisterId ?? "",
    parsed?.postId ?? "",
  );
  // Only editors of the publication may edit a publication article (D-111,
  // NIC-547). Called unconditionally ("" = not a publication post, query off).
  const membership = usePublicationMembership(
    editQuery.data?.isPublication ? editQuery.data.publicationHandle : "",
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
      // No Back link on the default entry (unchanged); arriving from Manage
      // Articles offers the way back to that list (NIC-548).
      return (
        <Shell>
          <div className="px-6 py-12 lg:px-24">
            <p className="text-body text-ink-60">{writeArticleCopy.loadError}</p>
            {back.fromPublication && <BackLink back={back} />}
          </div>
        </Shell>
      );
    }
    if (editQuery.data.isNft) {
      return (
        <Shell>
          <div className="px-6 py-12 lg:px-24">
            <p className="text-body text-ink-60">{writeArticleCopy.nftNotEditable}</p>
            <BackLink back={back} />
          </div>
        </Shell>
      );
    }
    if (editQuery.data.isPublished) {
      // A published article is read-only (one state per article): it cannot be
      // edited in place. To change it, unpublish it first — it returns to an
      // editable draft (NIC-283). Defense-in-depth for a direct/bookmarked URL;
      // the My Articles list already hides Edit on published articles.
      return (
        <Shell>
          <div className="px-6 py-12 lg:px-24">
            <p className="text-body text-ink-60">{writeArticleCopy.publishedNotEditable}</p>
            <BackLink back={back} />
          </div>
        </Shell>
      );
    }
    if (editQuery.data.isPublication) {
      // A publication article is editable only by the publication's editors
      // (D-111). The writer who submitted it, or anyone else, gets a read-only
      // screen: the save would be refused by the canister anyway.
      if (membership.isLoading) {
        return (
          <Shell>
            <p className="px-6 py-12 text-body text-ink-60 lg:px-24">
              {writeArticleCopy.loadingArticle}
            </p>
          </Shell>
        );
      }
      if (membership.isError) {
        return (
          <Shell>
            <div className="px-6 py-12 lg:px-24">
              <p className="text-body text-ink-60">{writeArticleCopy.loadError}</p>
              {back.fromPublication && <BackLink back={back} />}
            </div>
          </Shell>
        );
      }
      if (!membership.isEditor) {
        return (
          <Shell>
            <div className="px-6 py-12 lg:px-24">
              <p className="text-body text-ink-60">{writeArticleCopy.publicationNotEditable}</p>
              <BackLink back={back} />
            </div>
          </Shell>
        );
      }
    }
    return (
      <Shell>
        <WriteArticleForm
          key={parsed.postId}
          initial={editQuery.data}
          initialPublication={initialPublication}
          back={back}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <WriteArticleForm
        key="new"
        initialPublication={initialPublication}
        back={back}
      />
    </Shell>
  );
}

export default WriteArticle;
