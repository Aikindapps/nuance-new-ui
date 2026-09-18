// NIC-261 — Account area layout shell.
//
// Renders the auth-aware top bar (same mechanism as PageShell) plus a
// two-column body inside the 1312px content band:
//   LEFT  — 320px tab-nav rail (hidden at < lg/1024).
//   RIGHT — main card (surface #ffffff, radius 8, 72px padding).
//
// At/below lg the rail is hidden; mobile section switching is via the drawer
// (MobileNavDrawer). The single responsive seam is lg = 1024px per decision.

import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { Header } from "../ui/Header";
import { HeaderLoggedIn } from "../ui/HeaderLoggedIn";
import { useMyPublicationsEntry } from "../../lib/useMyPublicationsEntry";
import { useModal } from "../../services/modal";
import {
  PublicationChooser,
  PUBLICATION_CHOOSER_TITLE_ID,
} from "../ui/PublicationChooser";
import { accountCopy, activityCopy } from "../../constants/copy";

export type AccountNavItem =
  | "profile"
  | "articles"
  | "activity"
  | "publications"
  | "wallet";

type Props = {
  /** Which rail row is currently selected (used for the Publications button). */
  active: AccountNavItem;
  children: ReactNode;
};

// ── Rail item style helpers ──────────────────────────────────────────────────

function railItemClass(isActive: boolean, disabled?: boolean): string {
  const base = [
    "flex w-full items-center gap-2",
    "rounded px-[calc(28*var(--fpx))] py-[calc(13*var(--fpx))]",
    "text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))]",
    "transition-colors",
  ].join(" ");

  if (disabled) {
    return `${base} cursor-not-allowed text-ink opacity-40 bg-surface font-medium`;
  }
  if (isActive) {
    return `${base} bg-brand-purple-5 text-brand-purple font-bold`;
  }
  return `${base} bg-surface text-ink font-medium hover:bg-brand-purple-5/50`;
}

// ── NavRail ──────────────────────────────────────────────────────────────────

// NIC-358: Activity hub sub-sections. All four render a bounded "Coming soon"
// placeholder for now; the real content lands in the sibling card.
const ACTIVITY_SECTIONS: { slug: string; label: string }[] = [
  { slug: "following", label: activityCopy.sectionFollowing },
  { slug: "followers", label: activityCopy.sectionFollowers },
  { slug: "subscribers", label: activityCopy.sectionSubscribers },
  { slug: "subscriptions", label: activityCopy.sectionSubscriptions },
];

function NavRail({ active }: { active: AccountNavItem }) {
  const navigate = useNavigate();
  const location = useLocation();
  const modal = useModal();
  const { show: showPubs, firstPubHandle, count } = useMyPublicationsEntry();

  // Auto-expand the Activity accordion when the current route is under /activity.
  const [activityExpanded, setActivityExpanded] = useState(
    location.pathname.startsWith("/activity"),
  );

  const handlePublications = () => {
    if (!firstPubHandle) return;
    if (count > 1) {
      modal.open(<PublicationChooser />, {
        ariaLabelledBy: PUBLICATION_CHOOSER_TITLE_ID,
      });
    } else {
      navigate(`/publication/${firstPubHandle}/manage/articles`);
    }
  };

  return (
    <nav
      aria-label={accountCopy.navAriaLabel}
      className="flex flex-col gap-2 rounded-card border border-ink-border/20 bg-surface p-4"
    >
      {/* My profile — active on /profile and /profile/edit (prefix match) */}
      <NavLink
        to="/profile"
        className={({ isActive }) => railItemClass(isActive)}
      >
        {accountCopy.navMyProfile}
      </NavLink>

      {/* My articles */}
      <NavLink
        to="/my-articles"
        className={({ isActive }) => railItemClass(isActive)}
      >
        {accountCopy.navMyArticles}
      </NavLink>

      {/* Activity — accordion revealing the four section sub-rows (NIC-358) */}
      <div className="flex flex-col">
        <button
          type="button"
          aria-expanded={activityExpanded}
          aria-controls="activity-subnav"
          onClick={() => setActivityExpanded((v) => !v)}
          className={`${railItemClass(active === "activity")} justify-between`}
        >
          <span>{accountCopy.navActivity}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`transition-transform ${activityExpanded ? "rotate-180" : ""}`}
          >
            {/* Chevron-down (∨); rotated 180° (∧) when expanded */}
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {activityExpanded && (
          <div
            id="activity-subnav"
            className="mt-1 flex flex-col gap-1 pl-[calc(16*var(--fpx))]"
          >
            {ACTIVITY_SECTIONS.map((section) => (
              <NavLink
                key={section.slug}
                to={`/activity/${section.slug}`}
                className={({ isActive }) => railItemClass(isActive)}
              >
                {section.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Publications — role-gated; hidden when user has no pubs */}
      {showPubs && firstPubHandle && (
        <button
          type="button"
          onClick={handlePublications}
          className={railItemClass(active === "publications")}
        >
          {accountCopy.navPublications}
        </button>
      )}

      {/* My wallet */}
      <NavLink
        to="/wallet"
        className={({ isActive }) => railItemClass(isActive)}
      >
        {accountCopy.navMyWallet}
      </NavLink>
    </nav>
  );
}

// ── AccountShell ─────────────────────────────────────────────────────────────

export function AccountShell({ active, children }: Props) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white lg:bg-[#F9F9FA]">
      {isAuthenticated ? (
        <HeaderLoggedIn />
      ) : (
        <div className="bg-brand-gradient w-full text-white">
          <Header />
        </div>
      )}

      {/* Content band: max-w 1312px, centered */}
      <div
        className={[
          "mx-auto max-w-[calc(1312*var(--fpx))]",
          "py-8",
          "lg:flex lg:items-start lg:gap-6 lg:py-8",
        ].join(" ")}
      >
        {/* Left tab-nav rail — desktop only */}
        <div className="hidden lg:block lg:w-[calc(320*var(--fpx))] lg:shrink-0">
          <NavRail active={active} />
        </div>

        {/* Main content card */}
        <main
          className={[
            "min-w-0 flex-1",
            // Mobile: flat, padded content
            "px-4 py-6",
            // Desktop: card surface with border, 72px padding
            "lg:rounded-card lg:border lg:border-ink-border/20 lg:bg-surface",
            "lg:px-[calc(72*var(--fpx))] lg:py-[calc(72*var(--fpx))]",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
