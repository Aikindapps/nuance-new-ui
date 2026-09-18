import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { AccountShell } from "../components/account/AccountShell";
import { ScrollTabStrip } from "../features/home/sections/ScrollTabStrip";
import { Tab } from "../components/ui/Tab";
import { activityCopy } from "../constants/copy";
import { FollowersSection } from "../features/activity/sections/FollowersSection";
import { FollowingSection } from "../features/activity/sections/FollowingSection";

// NIC-358 -- Activity hub foundation scaffold.
//
// Four sections (Following / Followers / Subscribers / Subscriptions) reachable
// from the account rail accordion (desktop, via AccountShell) and the mobile
// drawer. Each section renders a bounded "Coming soon" placeholder until the
// real content lands (sibling card). Desktop section switching is the rail
// accordion; phone (< lg) switches via a horizontal ScrollTabStrip.

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

  // Unknown/missing section slug → normalise to the Following section.
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

      {/* Following (NIC-354) and Followers (NIC-359 / NIC-372) are built; the
          other two sections keep the bounded "Coming soon" placeholder until
          they land. */}
      {section === "following" ? (
        <FollowingSection />
      ) : section === "followers" ? (
        <FollowersSection />
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
