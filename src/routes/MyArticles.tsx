import { Link, Navigate, useSearchParams } from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../services/toast";
import { useModal } from "../services/modal";
import { myArticlesCopy } from "../constants/copy";
import {
  CONFIRM_DIALOG_TITLE_ID,
  ConfirmDialog,
} from "../components/ui/ConfirmDialog";
import {
  type MyArticle,
  type MyArticleFilter,
  useMyArticles,
} from "../features/write/myArticles/hooks/useMyArticles";
import { useDeletePost } from "../features/write/myArticles/hooks/useDeletePost";
import { useUnpublishPost } from "../features/write/myArticles/hooks/useUnpublishPost";
import { MyArticleCard } from "../features/write/myArticles/MyArticleCard";

// My Articles (Figma 5.7) — the authed writer's drafts + published list, with
// All / Published / Drafts tabs (via ?tab=), reopen-to-edit, and delete.
const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";
const TABS: MyArticleFilter[] = ["all", "published", "drafts"];

export function MyArticles() {
  const { isAuthenticated, isLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const { show } = useToast();
  const modal = useModal();
  const deleteMutation = useDeletePost();
  const unpublishMutation = useUnpublishPost();

  const tabParam = params.get("tab");
  const filter: MyArticleFilter = TABS.includes(tabParam as MyArticleFilter)
    ? (tabParam as MyArticleFilter)
    : "all";
  const query = useMyArticles(filter);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const c = myArticlesCopy;

  const confirmDelete = (article: MyArticle) => {
    modal.open(
      <ConfirmDialog
        title={c.deleteConfirm.title}
        body={c.deleteConfirm.body}
        confirmLabel={c.deleteConfirm.confirm}
        cancelLabel={c.deleteConfirm.cancel}
        closeAriaLabel={c.deleteConfirm.closeAriaLabel}
        onConfirm={async () => {
          try {
            await deleteMutation.mutateAsync({
              bucketCanisterId: article.bucketCanisterId,
              postId: article.id,
            });
            show(c.deleted, "success");
          } catch (e) {
            show((e as Error).message || c.deleteFailed, "error");
            throw e; // keep the dialog open
          }
        }}
      />,
      { ariaLabelledBy: CONFIRM_DIALOG_TITLE_ID, dismissable: true },
    );
  };

  const confirmUnpublish = (article: MyArticle) => {
    modal.open(
      <ConfirmDialog
        title={c.unpublishConfirm.title}
        body={c.unpublishConfirm.body}
        confirmLabel={c.unpublishConfirm.confirm}
        cancelLabel={c.unpublishConfirm.cancel}
        closeAriaLabel={c.unpublishConfirm.closeAriaLabel}
        onConfirm={async () => {
          try {
            await unpublishMutation.mutateAsync({
              bucketCanisterId: article.bucketCanisterId,
              postId: article.id,
            });
            show(c.unpublished, "success");
          } catch (e) {
            console.error(e);
            show(c.unpublishFailed, "error");
            throw e; // keep the dialog open
          }
        }}
      />,
      { ariaLabelledBy: CONFIRM_DIALOG_TITLE_ID, dismissable: true },
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <title>{c.metadata.title}</title>
      <meta name="description" content={c.metadata.description} />
      <HeaderLoggedIn />
      <main className={`${CONTAINER} px-6 pt-12 lg:px-14 lg:pt-20`}>
        <div className="flex items-center justify-between">
          <h1 className="text-title-md font-bold text-ink lg:text-title-lg">
            {c.heading}
          </h1>
          <Link
            to="/write"
            className="text-body font-medium text-brand-purple hover:underline"
          >
            {c.newArticle}
          </Link>
        </div>

        <nav
          aria-label="Filter articles"
          className="mt-6 flex items-center gap-6 border-b border-ink-border/20"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setParams(t === "all" ? {} : { tab: t }, { replace: true })}
              className={`relative -mb-px py-3 text-body ${
                filter === t
                  ? "font-bold text-brand-purple after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-purple"
                  : "font-medium text-ink-80"
              }`}
            >
              {c.tabs[t]}
            </button>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-4 pb-24">
          {query.isPending && (
            <p className="text-body text-ink-60">{c.loading}</p>
          )}
          {query.isError && (
            <p className="text-body text-error">{c.loadError}</p>
          )}
          {query.data && query.data.length === 0 && (
            <p className="text-body text-ink-60">{c.empty[filter]}</p>
          )}
          {query.data?.map((article) => (
            <MyArticleCard
              key={article.id}
              article={article}
              deleting={
                deleteMutation.isPending &&
                deleteMutation.variables?.postId === article.id
              }
              onDelete={() => confirmDelete(article)}
              onUnpublish={() => confirmUnpublish(article)}
              unpublishing={
                unpublishMutation.isPending &&
                unpublishMutation.variables?.postId === article.id
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default MyArticles;
