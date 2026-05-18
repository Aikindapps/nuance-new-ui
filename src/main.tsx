import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import { ActorsProvider } from "./contexts/ActorsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./services/modal";
import { muiTheme } from "./theme";
import { Home } from "./routes/Home";
import { WriteStub } from "./routes/WriteStub";

const router = createBrowserRouter([
  { path: "/", element: <Home tab="following" /> },
  { path: "/new", element: <Home tab="new" /> },
  { path: "/your-mix", element: <Home tab="your-mix" /> },
  { path: "/write", element: <WriteStub /> },
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
              <RouterProvider router={router} />
            </ModalProvider>
          </ActorsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
