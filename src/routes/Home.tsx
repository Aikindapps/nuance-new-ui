import { useAuth } from "../contexts/useAuth";
import { HomeLoggedOut } from "./HomeLoggedOut";
import { HomeLoggedIn, type HomeLoggedInTab } from "./HomeLoggedIn";

// Auth-aware branch per decisions #26 and #29.
//
// Anon:   `/` → HomeLoggedOut Popular; `/new` → HomeLoggedOut New;
//         `/following` → HomeLoggedOut with the Following sign-in gate (NIC-326).
// Authed: `/` → HomeLoggedIn Popular; `/following` → HomeLoggedIn Following;
//         `/new` → HomeLoggedIn New.

export function Home({ tab }: { tab: HomeLoggedInTab }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Brief window during session restore. Render nothing rather than flash
  // the wrong UI; the restored identity arrives within a single tick of the
  // first paint via IdbStorage.
  if (isLoading) return null;

  if (isAuthenticated) {
    return <HomeLoggedIn tab={tab} />;
  }

  // Anon: tab maps straight to the HomeLoggedOut variant. `/following`
  // renders the logged-out shell with the Following sign-in gate (NIC-326),
  // no longer a redirect to `/`.
  return <HomeLoggedOut variant={tab} />;
}
