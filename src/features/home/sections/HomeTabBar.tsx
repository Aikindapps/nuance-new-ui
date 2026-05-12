import { Tab } from "../../../components/ui/Tab";

// Figma 1:50064 — 3-tab bar for the logged-in home. Routes map per
// decision #26: / = Following (default authed landing), /new = New (matches
// HomeLoggedOut's /new for anon), /your-mix = personalized recs stub
// (deferred to PR #5). NavLink active state drives the purple bold/underline
// styling already baked into the Tab component (from PR #1).

export function HomeTabBar() {
  return (
    <nav
      aria-label="Feed view"
      className="flex items-center border-b border-ink-border/20"
    >
      <Tab to="/your-mix" end>
        Your mix
      </Tab>
      <Tab to="/" end>
        Following
      </Tab>
      <Tab to="/new" end>
        New
      </Tab>
    </nav>
  );
}
