import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import { ActorsProvider } from "./contexts/ActorsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./services/modal";
import { ToastProvider } from "./services/toast";
import { OnboardingGate } from "./features/onboarding/OnboardingGate";
import { muiTheme } from "./theme";
import { Home } from "./routes/Home";
import { WriterProfile } from "./routes/WriterProfile";
import { PublicationHome } from "./routes/PublicationHome";
import { ManageArticles } from "./routes/ManageArticles";
import { SearchResults, SearchRedirect } from "./routes/SearchResults";
import { NotFound } from "./routes/NotFound";
import { ArticleLoadingShell } from "./features/article/sections/ArticleLoadingShell";

// Article route ships as its own chunk — DOMPurify + Crimson Text + every
// article section adds ~30 kB that has no business in the home bundle.
// Suspense shows the same loading shell the route itself uses for its
// data-fetch pending state, so chunk-load and data-fetch look identical.
// The eslint-disable below is intentional: this entry file has no exports
// for Fast Refresh to bind to anyway; lazy() lives here because that's
// where the router is constructed.
// eslint-disable-next-line react-refresh/only-export-components
const ReadArticle = lazy(() => import("./routes/ReadArticle"));

// Write Article (PR #9) — lazy so all @lexical/* stays out of the home bundle.
// eslint-disable-next-line react-refresh/only-export-components
const WriteArticle = lazy(() => import("./routes/WriteArticle"));
// eslint-disable-next-line react-refresh/only-export-components
const MyArticles = lazy(() => import("./routes/MyArticles"));
// Notifications (PR #10) — lazy; the page only ever loads after a bell click.
// eslint-disable-next-line react-refresh/only-export-components
const NotificationsPage = lazy(() => import("./routes/NotificationsPage"));
// Wallet / Funds Overview (PR-1) — lazy; ICRC-1 + Sonic bindings stay out of
// the home bundle until the wallet is opened.
// eslint-disable-next-line react-refresh/only-export-components
const Wallet = lazy(() => import("./routes/Wallet"));

const router = createBrowserRouter([
  { path: "/", element: <Home tab="popular" /> },
  { path: "/following", element: <Home tab="following" /> },
  { path: "/new", element: <Home tab="new" /> },
  {
    path: "/write",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <WriteArticle />
      </Suspense>
    ),
  },
  {
    path: "/write/:postIdAndBucket",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <WriteArticle />
      </Suspense>
    ),
  },
  {
    path: "/my-articles",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <MyArticles />
      </Suspense>
    ),
  },
  {
    path: "/notifications",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <NotificationsPage />
      </Suspense>
    ),
  },
  {
    path: "/wallet",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <Wallet />
      </Suspense>
    ),
  },
  // Canonical article URL — decision #32. The 3-segment shape never
  // collides with the single-segment routes above.
  {
    path: "/:handle/:postIdAndBucket/:slug",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <ReadArticle />
      </Suspense>
    ),
  },
  // NIC-41: Search results (Phase 1). Non-lazy — reuses ArticleFeed/Tab/
  // PageShell from the home bundle; no heavy deps. Must appear before
  // /:handle so /search/articles and /search rank above the dynamic segment.
  { path: "/search/articles", element: <SearchResults /> },
  { path: "/search", element: <SearchRedirect /> },
  // NIC-42: Writer profile, Publication home, 404 catch-all.
  // Non-lazy — these reuse home-bundle components (ArticleFeed, Avatar,
  // FollowButton) and pull in no heavy deps, so a separate chunk buys nothing.
  // React Router v7 ranks static routes above dynamic ones, so /new, /wallet,
  // /following, /write, /my-articles, /notifications never reach /:handle.
  { path: "/:handle", element: <WriterProfile /> },
  { path: "/publication/:handle/manage/articles", element: <ManageArticles /> },
  { path: "/publication/:h", element: <PublicationHome /> },
  { path: "*", element: <NotFound /> },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ActorsProvider>
            <ModalProvider>
              <ToastProvider>
                {/* Controller for the Create Account onboarding flow —
                    opens the register/topics modals when an authed user
                    has no profile. Renders nothing. */}
                <OnboardingGate />
                <RouterProvider router={router} />
              </ToastProvider>
            </ModalProvider>
          </ActorsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
