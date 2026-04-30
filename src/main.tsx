import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import { ActorsProvider } from "./contexts/ActorsContext";
import { muiTheme } from "./theme";
import { HomeLoggedOut } from "./routes/HomeLoggedOut";

const router = createBrowserRouter([
  { path: "/", element: <HomeLoggedOut variant="popular" /> },
  { path: "/new", element: <HomeLoggedOut variant="new" /> },
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
        <ActorsProvider>
          <RouterProvider router={router} />
        </ActorsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
