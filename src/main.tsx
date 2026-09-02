import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
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
import { ManageSubscriptions } from "./routes/ManageSubscriptions";
import { SearchResults, SearchRedirect } from "./routes/SearchResults";
import { ExploreTopic } from "./routes/ExploreTopic";
import { ExplorePublications } from "./routes/ExplorePublications";
import { ExploreWriters } from "./routes/ExploreWriters";
import { ExploreTopics } from "./routes/ExploreTopics";
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
// eslint-disable-next-line react-refresh/only-export-components
const FollowingManage = lazy(() => import("./routes/FollowingManage"));

// Root layout route — hosts the app-wide overlays (modal service, toasts) and
// the onboarding controller INSIDE the router so modal content rendered by the
// modal service sits within the Router context. Without this, modals that call
// router hooks (useNavigate) throw "useNavigate() may be used only in the
// context of a <Router> component" on mount, whiting out the whole app (there
// is no global error boundary). All routes render through <Outlet />.
// eslint-disable-next-line react-refresh/only-export-components
function RootLayout() {
  return (
    <ModalProvider>
      <ToastProvider>
        {/* Controller for the Create Account onboarding flow — opens the
            register/topics modals when an authed user has no profile.
            Renders nothing. */}
        <OnboardingGate />
        <Outlet />
      </ToastProvider>
    </ModalProvider>
  );
}

const appRoutes = [
  { path: "/", element: <Home tab="popular" /> },
  { path: "/following", element: <Home tab="following" /> },
  {
    path: "/following/manage",
    element: (
      <Suspense fallback={<ArticleLoadingShell />}>
        <FollowingManage />
      </Suspense>
    ),
  },
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
  // NIC-43: Explore pages. Non-lazy — reuse home-bundle components
  // (PageShell, ArticleFeed, FollowButton, Avatar); no heavy deps.
  // Must appear before /:handle so /explore/* never falls through.
  { path: "/explore/topic/:tag", element: <ExploreTopic /> },
  { path: "/explore/publications", element: <ExplorePublications /> },
  { path: "/explore/writers", element: <ExploreWriters /> },
  { path: "/explore/topics", element: <ExploreTopics /> },
  // NIC-42: Writer profile, Publication home, 404 catch-all.
  // Non-lazy — these reuse home-bundle components (ArticleFeed, Avatar,
  // FollowButton) and pull in no heavy deps, so a separate chunk buys nothing.
  // React Router v7 ranks static routes above dynamic ones, so /new, /wallet,
  // /following, /write, /my-articles, /notifications never reach /:handle.
  { path: "/:handle", element: <WriterProfile /> },
  { path: "/publication/:handle/manage/articles", element: <ManageArticles /> },
  { path: "/publication/:handle/manage/subscriptions", element: <ManageSubscriptions /> },
  { path: "/publication/:h", element: <PublicationHome /> },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter([
  { element: <RootLayout />, children: appRoutes },
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
            <RouterProvider router={router} />
          </ActorsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
