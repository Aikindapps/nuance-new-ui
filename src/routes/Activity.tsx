import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { AccountShell } from "../components/account/AccountShell";
import { ScrollTabStrip } from "../features/home/sections/ScrollTabStrip";
import { Tab } from "../components/ui/Tab";
import { activityCopy } from "../constants/copy";
import { FollowersSection } from "../features/activity/sections/FollowersSection";
import { FollowingSection } from "../features/activity/sections/FollowingSection";
import { TopicsSection } from "../features/activity/sections/TopicsSection";
import { SubscribersSection } from "../features/activity/sections/SubscribersSection";
import { SubscriptionsSection } from "../features/activity/sections/SubscriptionsSection";

// NIC-358 -- Activity hub foundation scaffold.
//
// All five sections are now built:
//   following    -> FollowingSection     (NIC-354)
//   topics       -> TopicsSection        (NIC-473, D-68)
//   followers    -> FollowersSection     (NIC-359 / NIC-372)
//   subscribers  -> SubscribersSection   (NIC-353)
//   subscriptions-> SubscriptionsSection (NIC-353)
// Desktop section switching is the rail accordion; phone (< lg) switches via
// a horizontal ScrollTabStrip.
// NIC-628: the phone strip is wider than the screen, so the active tab is
// scrolled into view (sideways only) on load and on every section change --
// at rest "Subscriptions" was off the right edge. Measured again once the web
// fonts have loaded, since they change the tab widths.

const SECTIONS: { slug: string; label: string }[] = [
  { slug: "following", label: activityCopy.sectionFollowing },
  { slug: "topics", label: activityCopy.sectionTopics },
  { slug: "followers", label: activityCopy.sectionFollowers },
  { slug: "subscribers", label: activityCopy.sectionSubscribers },
  { slug: "subscriptions", label: activityCopy.sectionSubscriptions },
];

export function Activity() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { section } = useParams<{ section: string }>();
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const reveal = () => {
      const nav = stripRef.current?.querySelector("nav");
      const tab = nav?.querySelector('[aria-current="page"]');
      if (!live || !nav || !tab) return;
      const n = nav.getBoundingClientRect();
      const t = tab.getBoundingClientRect();
      if (t.left < n.left) nav.scrollLeft += t.left - n.left;
      else if (t.right > n.right) nav.scrollLeft += t.right - n.right;
    };
    reveal();
    void document.fonts?.ready.then(reveal);
    return () => {
      live = false;
    };
  }, [section, authLoading, isAuthenticated]);

  // Auth guard — same shape as FollowingManage / MyArticles.
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Unknown/missing section slug -> normalise to the Following section.
  const known = SECTIONS.some((s) => s.slug === section);
  if (!known) return <Navigate to="/activity/following" replace />;

  return (
    <AccountShell active="activity">
      <title>{activityCopy.metaTitle}</title>

      {/* Phone (< lg): horizontal tab strip — desktop uses the rail accordion. */}
      <div ref={stripRef} className="lg:hidden">
        <ScrollTabStrip ariaLabel={activityCopy.ariaLabel}>
          {SECTIONS.map((s) => (
            <Tab
              key={s.slug}
              to={`/activity/${s.slug}`}
              className="shrink-0 whitespace-nowrap"
            >
              {s.label}
            </Tab>
          ))}
        </ScrollTabStrip>
      </div>

      {/* All five sections are built (NIC-354 / NIC-473 / NIC-359 / NIC-372 /
          NIC-353). The defensive else keeps a Coming-soon fallback for any
          future slug. */}
      {section === "following" ? (
        <FollowingSection />
      ) : section === "topics" ? (
        <TopicsSection />
      ) : section === "followers" ? (
        <FollowersSection />
      ) : section === "subscribers" ? (
        <SubscribersSection />
      ) : section === "subscriptions" ? (
        <SubscriptionsSection />
      ) : (
        <div className="py-16 text-center">
          <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
            {activityCopy.comingSoonHeading}
          </p>
          <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">
            {activityCopy.comingSoonBody}
          </p>
        </div>
      )}
    </AccountShell>
  );
}

export default Activity;
