import { Tab } from "../../../components/ui/Tab";
import { ScrollTabStrip } from "./ScrollTabStrip";

// 3-tab bar for the home sort row. Popular (/), Following (/following),
// New (/new). Rendered under Articles on both the logged-in and logged-out
// home (NIC-326); logged-out, the Following route shows a sign-in gate.
export function HomeTabBar() {
  return (
    <ScrollTabStrip ariaLabel="Feed view">
      <Tab to="/" end className="shrink-0 whitespace-nowrap">
        Popular
      </Tab>
      <Tab to="/following" end className="shrink-0 whitespace-nowrap">
        Following
      </Tab>
      <Tab to="/new" end className="shrink-0 whitespace-nowrap">
        New
      </Tab>
    </ScrollTabStrip>
  );
}
