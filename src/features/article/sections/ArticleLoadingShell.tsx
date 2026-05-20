import Skeleton from "@mui/material/Skeleton";
import { Header } from "../../../components/ui/Header";
import { HeaderLoggedIn } from "../../../components/ui/HeaderLoggedIn";
import { useAuth } from "../../../contexts/useAuth";

// Loading state for the article route. Used in two places:
//   1. main.tsx wraps the lazy ReadArticle in <Suspense fallback>, so this
//      renders while the article chunk is in flight.
//   2. ReadArticle itself renders it during its `isPending` data-fetch
//      state, so the visual is identical pre-chunk-load and post-chunk-load.
// Auth-aware so the header doesn't flicker between purple and white when
// the article chunk finishes loading.

const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

export function ArticleLoadingShell() {
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
      {/* Skeleton heights expressed as design pixels so the loading shape
          tracks the eventual content size at every --fpx (PR #7 review m3).
          Numeric `height` props produce literal px; `sx={{height: ...}}`
          accepts a CSS calc string. */}
      <main className={`${CONTAINER} px-6 py-12`}>
        <Skeleton variant="text" width={240} sx={{ height: "calc(28 * var(--fpx))" }} />
        <Skeleton
          variant="text"
          width="90%"
          sx={{ height: "calc(56 * var(--fpx))" }}
          className="mt-6"
        />
        <Skeleton variant="text" width="70%" sx={{ height: "calc(56 * var(--fpx))" }} />
        <Skeleton
          variant="rectangular"
          sx={{ height: "calc(474 * var(--fpx))" }}
          className="mt-8 rounded-card"
        />
        <Skeleton
          variant="text"
          width="100%"
          sx={{ height: "calc(24 * var(--fpx))" }}
          className="mt-8"
        />
        <Skeleton variant="text" width="100%" sx={{ height: "calc(24 * var(--fpx))" }} />
        <Skeleton variant="text" width="85%" sx={{ height: "calc(24 * var(--fpx))" }} />
      </main>
    </div>
  );
}
