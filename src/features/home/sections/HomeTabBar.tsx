import { Tab } from "../../../components/ui/Tab";

// 3-tab bar for the logged-in home. Routes per decision #29:
// / = Popular (default authed landing, shared with the anon home),
// /following = Following (auth-gated), /new = New (matches the anon /new).
// Figma 1:50064 is the source tab bar; labels diverge from it — "Popular"
// replaces "Your mix" per #29 (recommendations deferred out of scope).
// NavLink active state drives the purple bold/underline styling baked into
// the Tab component (from PR #1).

export function HomeTabBar() {
  return (
    <nav
      aria-label="Feed view"
      className="flex items-center border-b border-ink-border/20"
    >
      <Tab to="/" end>
        Popular
      </Tab>
      <Tab to="/following" end>
        Following
      </Tab>
      <Tab to="/new" end>
        New
      </Tab>
    </nav>
  );
}
