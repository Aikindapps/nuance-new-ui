import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { HomeLoggedOut } from "./HomeLoggedOut";
import { HomeLoggedIn, type HomeLoggedInTab } from "./HomeLoggedIn";

// Auth-aware branch per decisions #26 and #29.
//
// Anon:   `/` → HomeLoggedOut Popular; `/new` → HomeLoggedOut New.
// Authed: `/` → HomeLoggedIn Popular; `/following` → HomeLoggedIn Following;
//         `/new` → HomeLoggedIn New.
// `/following` is auth-gated — anon visitors redirect to `/`.

export function Home({ tab }: { tab: HomeLoggedInTab }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Brief window during session restore. Render nothing rather than flash
  // the wrong UI; the restored identity arrives within a single tick of the
  // first paint via IdbStorage.
  if (isLoading) return null;

  if (tab === "following" && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated) {
    return <HomeLoggedIn tab={tab} />;
  }

  // Anon: tab maps to the HomeLoggedOut variant. `/following` never reaches
  // here (redirected above), so `tab` is "popular" or "new".
  return <HomeLoggedOut variant={tab === "new" ? "new" : "popular"} />;
}
