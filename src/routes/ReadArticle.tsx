import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/ui/Header";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { parseArticleSegment } from "../lib/articleUrl";
import { useArticle } from "../features/article/hooks/useArticle";
import { useComments } from "../features/article/hooks/useComments";
import { usePostMeta } from "../features/article/hooks/usePostMeta";
import { useRegisterView } from "../features/article/hooks/useRegisterView";
import { Breadcrumb, type Crumb } from "../features/article/sections/Breadcrumb";
import { ArticleMasthead } from "../features/article/sections/ArticleMasthead";
import { ArticleBody } from "../features/article/sections/ArticleBody";
import { ArticleTags } from "../features/article/sections/ArticleTags";
import { AuthorBlock } from "../features/article/sections/AuthorBlock";
import { CommentsSection } from "../features/article/sections/CommentsSection";
import { ActionBar } from "../features/article/sections/ActionBar";
import { ArticleRail } from "../features/article/sections/ArticleRail";
import { RelatedArticlesFoldout } from "../features/article/sections/RelatedArticlesFoldout";
import { ArticleHead } from "../features/article/sections/ArticleHead";
import { ArticleLoadingShell } from "../features/article/sections/ArticleLoadingShell";
import { useMoreArticles } from "../features/article/hooks/useMoreArticles";
import { useRecommendedArticles } from "../features/article/hooks/useRecommendedArticles";
import { useModal } from "../services/modal";
import {
  NftPurchaseModal,
  NFT_PURCHASE_MODAL_TITLE_ID,
} from "../features/article/purchase/NftPurchaseModal";
import {
  SubscriptionPurchaseModal,
  SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID,
} from "../features/article/purchase/SubscriptionPurchaseModal";
import {
  LoginModal,
  LOGIN_MODAL_TITLE_ID,
} from "../components/LoginModal/LoginModal";
import { nftPurchaseCopy, subscriptionPurchaseCopy } from "../constants/copy";

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
  // Comment count is needed in the ActionBar Comment button label and the
  // ArticleMasthead meta row. CommentsSection ALSO calls useComments;
  // React Query dedupes on the shared query key so both subscribers
  // share the same network round-trip + cache entry.
  const comments = useComments(bucketCanisterId, postId);
  const commentCount = Number(comments.data?.totalNumberOfComments ?? 0) || 0;
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

  // Modal service + auth — must be called unconditionally (hooks rule).
  const modal = useModal();
  const { isAuthenticated } = useAuth();


  if (!parsed) {
    return (
      <Centered
        heading="Article not found"
        body="That article link looks malformed."
      />
    );
  }

  if (article.isPending) {
    return <ArticleLoadingShell />;
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

  // Breadcrumb: publication posts show "@pubHandle / @writerHandle"; standalone
  // posts show just "@writerHandle". Labels use the @handle (navigation), not
  // the display name. Links are unchanged from NIC-26.
  const writerHandle = (post.creatorHandle || post.handle).toLowerCase();
  const writerLabel = `@${author?.handle || writerHandle}`;
  const crumbs: Crumb[] = [];
  if (post.isPublication) {
    const pubHandle = post.handle.toLowerCase();
    crumbs.push({
      label: `@${publication?.handle || pubHandle}`,
      to: `/publication/${pubHandle}`,
    });
  }
  crumbs.push({ label: writerLabel, to: `/${writerHandle}` });

  // Open the subscription purchase modal (auth-guarded). Logged-out →
  // LoginModal; logged-in → SubscriptionPurchaseModal. Mirrors the NFT flow.
  const openSubscriptionPurchase = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    const subHandle = post.isPublication
      ? post.handle
      : post.creatorHandle || post.handle;
    modal.open(
      <SubscriptionPurchaseModal
        isPublication={post.isPublication}
        handle={subHandle}
        creatorPrincipal={post.creatorPrincipal}
        onClose={modal.close}
      />,
      {
        ariaLabelledBy: SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID,
        dismissable: false,
      },
    );
  };

  // Open the NFT purchase modal (auth-guarded). Logged-out → LoginModal;
  // logged-in → NftPurchaseModal. Guard: if nftCanisterId is missing the
  // button is not rendered, so this never fires for a misconfigured premium
  // post.
  const openNftPurchase = () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    // Mount the purchase modal; the modal service overlays it.
    modal.open(
      <NftPurchaseModal
        nftCanisterId={post.nftCanisterId!}
        authorHandle={writerHandle}
        onClose={modal.close}
      />,
      { ariaLabelledBy: NFT_PURCHASE_MODAL_TITLE_ID, dismissable: false },
    );
  };

  // Locked content area — split on isPremium vs isMembersOnly.
  const lockedBlock = post.isPremium ? (
    post.nftCanisterId ? (
      // Premium with a valid NFT canister — show the "Buy the NFT key" CTA.
      <div className="flex flex-col items-start gap-4">
        <p className="text-body text-ink-60">
          {nftPurchaseCopy.paywallHeading}
        </p>
        <p className="text-body text-ink-60">{nftPurchaseCopy.paywallBody}</p>
        <button
          type="button"
          onClick={openNftPurchase}
          className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white"
        >
          {nftPurchaseCopy.buyCtaLabel}
        </button>

      </div>
    ) : (
      // Premium without an NFT canister — graceful fallback (non-crashing).
      <p className="text-body text-ink-60">
        This is a premium article. The purchase flow is not yet available.
      </p>
    )
  ) : (
    // Members-only: subscription purchase CTA (NIC-129 §3.5/§3.6).
    <div className="flex flex-col items-start gap-4">
      <p className="text-body text-ink-60">
        {subscriptionPurchaseCopy.paywallHeading}
      </p>
      <p className="text-body text-ink-60">
        {subscriptionPurchaseCopy.paywallBody}
      </p>
      <button
        type="button"
        onClick={openSubscriptionPurchase}
        className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white"
      >
        {subscriptionPurchaseCopy.subscribeCtaLabel}
      </button>
    </div>
  );

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
          commentCount={commentCount}
        />

        <div className="mt-8 px-6 lg:mt-[calc(50*var(--fpx))] lg:px-24">
          {locked ? lockedBlock : <ArticleBody html={post.content} />}
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

        <div className="mt-8 lg:mt-[calc(50*var(--fpx))]">
          <CommentsSection
            bucketCanisterId={post.bucketCanisterId}
            postId={post.postId}
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
        title={article.data?.post.title ?? ""}
        commentCount={commentCount}
        postId={postId}
        bucketCanisterId={bucketCanisterId}
      />
      <RelatedArticlesFoldout articles={recommended.data} />
    </ArticleShell>
  );
}

export default ReadArticle;
