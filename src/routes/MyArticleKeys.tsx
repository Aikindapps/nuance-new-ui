import { useId, useLayoutEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useMyArticles } from "../features/write/myArticles/hooks/useMyArticles";
import { KeysAndSalesPanel } from "../features/write/myArticles/KeysAndSalesPanel";
import { keysAndSalesPageCopy } from "../features/write/myArticles/keysAndSalesPageCopy";

// /my-articles/keys/:postId -- desktop-twin route (NIC-512) for the shipped
// phone bottom sheet KeysAndSalesSheet.tsx. Read-only page: minted picture,
// locked key count + price, "N of M keys sold" + progress bar. Done (or
// browser back) returns to My Articles.

type LocationState = { from?: string } | null;

export function MyArticleKeys() {
  const { isAuthenticated, isLoading } = useAuth();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listQuery = useMyArticles("all");
  const headingId = useId();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fromMyArticles = (location.state as LocationState)?.from === "my-articles";

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const listLoaded = listQuery.data !== undefined;
  const ownsMintedArticle = !!listQuery.data?.some(
    (a) => a.id === postId && a.hasNft,
  );
  if (!postId || listQuery.isError || (listLoaded && !ownsMintedArticle)) {
    return <Navigate to="/my-articles" replace />;
  }

  const handleDone = () => {
    if (fromMyArticles) {
      navigate(-1);
    } else {
      navigate("/my-articles");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <title>{keysAndSalesPageCopy.metadata.title}</title>
      <meta name="description" content={keysAndSalesPageCopy.metadata.description} />
      <HeaderLoggedIn />
      <main>
        <div className="mx-auto flex w-full max-w-[calc(666*var(--fpx))] flex-col gap-[calc(32*var(--fpx))] px-6 pb-[calc(80*var(--fpx))] pt-12 lg:px-0 lg:pt-20">
          <KeysAndSalesPanel
            headingId={headingId}
            postId={postId}
            onDone={handleDone}
            extraLoading={!listLoaded}
          />
        </div>
      </main>
    </div>
  );
}

export default MyArticleKeys;
