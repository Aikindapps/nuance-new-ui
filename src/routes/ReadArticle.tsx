import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Header } from "../components/ui/Header";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { parseArticleSegment } from "../lib/articleUrl";
import { useArticle } from "../features/article/hooks/useArticle";
import { usePostMeta } from "../features/article/hooks/usePostMeta";
import { useRegisterView } from "../features/article/hooks/useRegisterView";
import { Breadcrumb, type Crumb } from "../features/article/sections/Breadcrumb";
import { ArticleMasthead } from "../features/article/sections/ArticleMasthead";
import { ArticleBody } from "../features/article/sections/ArticleBody";
import { ArticleTags } from "../features/article/sections/ArticleTags";
import { AuthorBlock } from "../features/article/sections/AuthorBlock";
import { ActionBar } from "../features/article/sections/ActionBar";
import { ArticleRail } from "../features/article/sections/ArticleRail";
import { RelatedArticlesFoldout } from "../features/article/sections/RelatedArticlesFoldout";
import { ArticleHead } from "../features/article/sections/ArticleHead";
import { useMoreArticles } from "../features/article/hooks/useMoreArticles";
import { useRecommendedArticles } from "../features/article/hooks/useRecommendedArticles";

// Read Article — Page 3, sections 3.2 + 3.3 (PR #7, decisions #31/#32).
//
// Phase 2: page shell + auth-aware header + breadcrumb. Header follows the
// project's existing auth split — anon readers get the purple-band Header,
// signed-in readers get the white HeaderLoggedIn (same conditional as the
// Home route). The masthead, body renderer and rails land in Phases 3+.

const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

// Page frame — auth-aware header on a white page. Wraps every route state so
// the header is always present (loading / error / not-found included).
function ArticleShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? (
        <HeaderLoggedIn />
      ) : (
        <div className="bg-brand-gradient w-full text-white">
          <Header />
        </div>
      )}
      {children}
    </div>
  );
}

function Centered({ heading, body }: { heading: string; body: string }) {
  return (
    <ArticleShell>
      <main className={`${CONTAINER} px-6 py-24 text-center`}>
        <h1 className="text-title-md font-bold text-ink">{heading}</h1>
        <p className="text-body mt-2 text-ink-80">{body}</p>
      </main>
    </ArticleShell>
  );
}

export function ReadArticle() {
  const { postIdAndBucket } = useParams();
  const parsed = postIdAndBucket
    ? parseArticleSegment(postIdAndBucket)
    : null;

  const postId = parsed?.postId ?? "";
  const bucketCanisterId = parsed?.bucketCanisterId ?? "";

  const article = useArticle(bucketCanisterId, postId);
  const meta = usePostMeta(postId);
  useRegisterView(parsed && article.data ? postId : null);

  // Rail hooks must run unconditionally — the author handle is "" until the
  // article resolves, which keeps useMoreArticles disabled until then.
  const railAuthorHandle = article.data?.post
    ? (
        article.data.post.creatorHandle || article.data.post.handle
      ).toLowerCase()
    : "";
  const moreArticles = useMoreArticles(postId, railAuthorHandle);
  const recommended = useRecommendedArticles(postId);

  if (!parsed) {
    return (
      <Centered
        heading="Article not found"
        body="That article link looks malformed."
      />
    );
  }

  if (article.isPending) {
    return (
      <ArticleShell>
        <main className={`${CONTAINER} px-6 py-12`}>
          <Skeleton variant="text" width={240} height={28} />
          <Skeleton variant="text" width="90%" height={56} className="mt-6" />
          <Skeleton variant="text" width="70%" height={56} />
          <Skeleton
            variant="rectangular"
            height={474}
            className="mt-8 rounded-card"
          />
          <Skeleton variant="text" width="100%" height={24} className="mt-8" />
          <Skeleton variant="text" width="100%" height={24} />
          <Skeleton variant="text" width="85%" height={24} />
        </main>
      </ArticleShell>
    );
  }

  if (article.isError) {
    return (
      <Centered
        heading="Something went wrong"
        body="This article could not be loaded. Please try again."
      />
    );
  }

  if (article.data === null) {
    return (
      <Centered
        heading="Article not found"
        body="This article does not exist or is no longer available."
      />
    );
  }

  const { post, author, publication } = article.data;
  const locked =
    (post.isPremium || post.isMembersOnly) && post.content.trim() === "";

  // Breadcrumb: Overview / {publication or author} / {category}. The middle
  // crumb links to the publication/author page (route not built yet — a
  // dead link for now, consistent with the home cards' author links).
  const crumbs: Crumb[] = [{ label: "Overview", to: "/" }];
  if (post.handle) {
    crumbs.push({
      label:
        publication?.displayName || author?.displayName || post.handle,
      to: `/${post.handle.toLowerCase()}`,
    });
  }
  if (post.category) crumbs.push({ label: post.category });

  return (
    <ArticleShell>
      <ArticleHead
        post={post}
        author={author}
        publication={publication}
        meta={meta.data ?? null}
      />
      {/* Figma 1:6091: Page content sits 80px below the 88px header. */}
      <main className={`${CONTAINER} pt-12 lg:pt-20`}>
        <Breadcrumb crumbs={crumbs} />
        <ArticleMasthead
          post={post}
          author={author}
          publication={publication}
          meta={meta.data ?? null}
        />

        <div className="mt-8 px-6 lg:mt-[calc(50*var(--fpx))] lg:px-24">
          {locked ? (
            <p className="text-body text-ink-60">
              {post.isMembersOnly
                ? "This is a members-only article."
                : "This is a premium article."}{" "}
              The purchase flow is not yet available.
            </p>
          ) : (
            <ArticleBody html={post.content} />
          )}
        </div>

        <div className="mt-8 lg:mt-[calc(50*var(--fpx))]">
          <ArticleTags tags={meta.data?.tags ?? []} />
        </div>

        <div className="mt-8 lg:mt-[calc(50*var(--fpx))]">
          <AuthorBlock
            author={author}
            followingCount={article.data.authorFollowingCount}
          />
        </div>
      </main>

      <div className="mt-8 lg:mt-[calc(50*var(--fpx))]">
        <ArticleRail
          heading={`More from @${railAuthorHandle}`}
          articles={moreArticles.data}
          isLoading={moreArticles.isLoading}
        />
        <ArticleRail
          heading="Recommended other reads"
          articles={recommended.data}
          isLoading={recommended.isLoading}
        />
      </div>

      {/* Clearance so the fixed ActionBar never covers the last rail. */}
      <div aria-hidden className="h-28" />

      <ActionBar
        claps={Number(meta.data?.claps ?? 0) || 0}
        views={Number(meta.data?.views ?? 0) || 0}
      />
      <RelatedArticlesFoldout articles={recommended.data} />
    </ArticleShell>
  );
}
