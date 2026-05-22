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
import { WriteStub } from "./routes/WriteStub";
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

const router = createBrowserRouter([
  { path: "/", element: <Home tab="popular" /> },
  { path: "/following", element: <Home tab="following" /> },
  { path: "/new", element: <Home tab="new" /> },
  { path: "/write", element: <WriteStub /> },
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
