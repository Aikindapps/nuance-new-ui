import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import { ActorsProvider } from "./contexts/ActorsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./services/modal";
import { OnboardingGate } from "./features/onboarding/OnboardingGate";
import { muiTheme } from "./theme";
import { Home } from "./routes/Home";
import { WriteStub } from "./routes/WriteStub";
import { ReadArticle } from "./routes/ReadArticle";

const router = createBrowserRouter([
  { path: "/", element: <Home tab="popular" /> },
  { path: "/following", element: <Home tab="following" /> },
  { path: "/new", element: <Home tab="new" /> },
  { path: "/write", element: <WriteStub /> },
  // Canonical article URL — decision #32. The 3-segment shape never
  // collides with the single-segment routes above.
  { path: "/:handle/:postIdAndBucket/:slug", element: <ReadArticle /> },
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
              {/* Controller for the Create Account onboarding flow — opens
                  the register/topics modals when an authed user has no
                  profile. Renders nothing. */}
              <OnboardingGate />
              <RouterProvider router={router} />
            </ModalProvider>
          </ActorsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
