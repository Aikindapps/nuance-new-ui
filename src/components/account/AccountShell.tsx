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
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { Header } from "../ui/Header";
import { HeaderLoggedIn } from "../ui/HeaderLoggedIn";
import { useMyPublicationsEntry } from "../../lib/useMyPublicationsEntry";
import { useModal } from "../../services/modal";
import {
  PublicationChooser,
  PUBLICATION_CHOOSER_TITLE_ID,
} from "../ui/PublicationChooser";
import { accountCopy } from "../../constants/copy";

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

function NavRail({ active }: { active: AccountNavItem }) {
  const navigate = useNavigate();
  const modal = useModal();
  const { show: showPubs, firstPubHandle, count } = useMyPublicationsEntry();

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

      {/* Activity — coming soon; non-link greyed row */}
      <span
        role="menuitem"
        aria-disabled="true"
        title={accountCopy.activityComingSoon}
        className={railItemClass(false, true)}
      >
        {accountCopy.navActivity}
      </span>

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
