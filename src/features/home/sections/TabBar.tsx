import { Tab } from "../../../components/ui/Tab";

export function TabBar() {
  return (
    <nav
      aria-label="Article sort"
      className="flex items-center border-b border-ink-border/20"
    >
      <Tab to="/" end>
        Popular
      </Tab>
      <Tab to="/new">New</Tab>
    </nav>
  );
}
