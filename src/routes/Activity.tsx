import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { AccountShell } from "../components/account/AccountShell";
import { ScrollTabStrip } from "../features/home/sections/ScrollTabStrip";
import { Tab } from "../components/ui/Tab";
import { activityCopy } from "../constants/copy";
import { FollowersSection } from "../features/activity/sections/FollowersSection";
import { FollowingSection } from "../features/activity/sections/FollowingSection";
import { SubscribersSection } from "../features/activity/sections/SubscribersSection";
import { SubscriptionsSection } from "../features/activity/sections/SubscriptionsSection";

// NIC-358 -- Activity hub foundation scaffold.
//
// All four sections are now built:
//   following    -> FollowingSection     (NIC-354)
//   followers    -> FollowersSection     (NIC-359 / NIC-372)
//   subscribers  -> SubscribersSection   (NIC-353)
//   subscriptions-> SubscriptionsSection (NIC-353)
// Desktop section switching is the rail accordion; phone (< lg) switches via
// a horizontal ScrollTabStrip.

const SECTIONS: { slug: string; label: string }[] = [
  { slug: "following", label: activityCopy.sectionFollowing },
  { slug: "followers", label: activityCopy.sectionFollowers },
  { slug: "subscribers", label: activityCopy.sectionSubscribers },
  { slug: "subscriptions", label: activityCopy.sectionSubscriptions },
];

export function Activity() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { section } = useParams<{ section: string }>();

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
      <div className="lg:hidden">
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

      {/* All four sections are built (NIC-354 / NIC-359 / NIC-372 / NIC-353).
          The defensive else keeps a Coming-soon fallback for any future slug. */}
      {section === "following" ? (
        <FollowingSection />
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
