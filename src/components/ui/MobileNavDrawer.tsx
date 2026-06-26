// NIC-66 — mobile primary-nav drawer.
//
// Rendered by both Header (logged-out band) and HeaderLoggedIn (white band).
// Internally reads useAuth() to branch LO vs LI, so the correct variant is
// shown regardless of which header triggered the open.
//
// MUI Drawer gives us focus-trap, body-scroll-lock, ESC-close, backdrop
// scrim, and a left-anchored slide (~225 ms) for free — no new deps needed.

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import Skeleton from "@mui/material/Skeleton";
import { useAuth } from "../../contexts/useAuth";
import { useMyProfile } from "../../lib/useMyProfile";
import { useUnreadCount } from "../../features/notifications/hooks/useUnreadCount";
import { useModal } from "../../services/modal";
import { LoginModal, LOGIN_MODAL_TITLE_ID } from "../LoginModal/LoginModal";
import { Avatar } from "./Avatar";
import { IconClose } from "./icons/IconClose";
import { LogoNuance } from "./icons/LogoNuance";
import { headerCopy, navDrawerCopy } from "../../constants/copy";

type Props = {
  open: boolean;
  onClose: () => void;
};

// ---------- shared nav-row helpers ------------------------------------------

function navRowClass(isActive: boolean) {
  return [
    "relative flex min-h-[44px] w-full items-center gap-3 px-4 text-body transition-colors",
    isActive
      ? "font-bold text-brand-purple bg-brand-purple-5 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand-purple"
      : "font-medium text-ink-80 hover:text-ink",
  ].join(" ");
}

function subRowClass(isActive: boolean) {
  return [
    "relative flex min-h-[44px] w-[calc(100%-1rem)] items-center gap-3 pl-10 pr-4 text-body border-l border-ink-border/20 ml-4 transition-colors",
    isActive
      ? "font-bold text-brand-purple bg-brand-purple-5 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand-purple"
      : "font-medium text-ink-80 hover:text-ink",
  ].join(" ");
}

// ---------- logged-out variant -----------------------------------------------

function LoggedOutPanel({ onClose }: { onClose: () => void }) {
  const modal = useModal();
  const openLogin = () => {
    onClose();
    modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
  };

  return (
    <>
      {/* Close row */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <Link to="/" onClick={onClose} aria-label={headerCopy.homeAriaLabel} className="text-brand-purple">
          <LogoNuance className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          autoFocus
          aria-label={navDrawerCopy.closeMenuAriaLabel}
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-sm text-ink-80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
        >
          <IconClose className="size-6" />
        </button>
      </div>

      <div className="border-t border-ink-border/20" />

      {/* Scrollable nav */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-2">
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) => navRowClass(isActive)}
        >
          {navDrawerCopy.navDiscover}
        </NavLink>
        <a
          href={navDrawerCopy.aboutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={navRowClass(false)}
        >
          {navDrawerCopy.navAboutNuance}
        </a>
      </nav>

      {/* Bottom pinned CTAs */}
      <div className="shrink-0 border-t border-ink-border/20 p-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={openLogin}
          className="flex min-h-[44px] w-full items-center justify-center rounded-card border border-brand-purple bg-white px-4 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
        >
          {navDrawerCopy.login}
        </button>
        <button
          type="button"
          onClick={openLogin}
          className="flex min-h-[44px] w-full items-center justify-center rounded-card bg-brand-purple px-4 text-body font-medium text-white transition-opacity hover:opacity-90"
        >
          {navDrawerCopy.getStarted}
        </button>
      </div>
    </>
  );
}

// ---------- logged-in variant ------------------------------------------------

function LoggedInPanel({ onClose }: { onClose: () => void }) {
  const { principal, logout } = useAuth();
  const profile = useMyProfile();
  const unreadCount = useUnreadCount();
  const [homeExpanded, setHomeExpanded] = useState(true);

  const displayName = profile.data?.displayName || profile.data?.handle || principal?.toText() || "";
  const handle = profile.data?.handle || "";
  const avatar = profile.data?.avatar || "";

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
    } catch {
      // logout failure is non-blocking
    }
  };

  return (
    <>
      {/* Close row — ✕ only (no logo per LI spec) */}
      <div className="flex shrink-0 items-center justify-end px-4 py-3">
        <button
          type="button"
          autoFocus
          aria-label={navDrawerCopy.closeMenuAriaLabel}
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-sm text-ink-80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
        >
          <IconClose className="size-6" />
        </button>
      </div>

      {/* Account section */}
      {profile.isLoading ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="min-w-0 flex-1">
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={80} />
          </div>
        </div>
      ) : handle ? (
        <Link
          to={`/${handle}`}
          onClick={onClose}
          className="flex min-h-[44px] items-center gap-3 px-4 py-3 hover:bg-brand-purple-5"
        >
          <Avatar src={avatar} label={displayName} sizeClass="size-12" textClass="text-body" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-bold text-ink">{displayName}</p>
            {handle && <p className="truncate text-body text-ink-60">@{handle}</p>}
          </div>
        </Link>
      ) : (
        <div className="flex min-h-[44px] items-center gap-3 px-4 py-3">
          <Avatar src={avatar} label={displayName} sizeClass="size-12" textClass="text-body" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-bold text-ink">{displayName}</p>
          </div>
        </div>
      )}

      <div className="border-t border-ink-border/20" />

      {/* Scrollable nav */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-2">
        {/* Home — expandable disclosure */}
        <button
          type="button"
          aria-expanded={homeExpanded}
          aria-controls="home-subnav"
          onClick={() => setHomeExpanded((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-between px-4 text-body font-medium text-ink-80 hover:text-ink"
        >
          <span>{navDrawerCopy.navHome}</span>
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
            className={`transition-transform ${homeExpanded ? "rotate-90" : ""}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {homeExpanded && (
          <div id="home-subnav">
            <NavLink
              to="/"
              end
              onClick={onClose}
              className={({ isActive }) => subRowClass(isActive)}
            >
              {navDrawerCopy.navPopular}
            </NavLink>
            <NavLink
              to="/following"
              onClick={onClose}
              className={({ isActive }) => subRowClass(isActive)}
            >
              {navDrawerCopy.navFollowing}
            </NavLink>
            <NavLink
              to="/new"
              onClick={onClose}
              className={({ isActive }) => subRowClass(isActive)}
            >
              {navDrawerCopy.navNew}
            </NavLink>
          </div>
        )}

        <NavLink
          to="/my-articles"
          onClick={onClose}
          className={({ isActive }) => navRowClass(isActive)}
        >
          {navDrawerCopy.myArticles}
        </NavLink>

        <NavLink
          to="/notifications"
          onClick={onClose}
          className={({ isActive }) => navRowClass(isActive)}
        >
          <span className="flex-1">{navDrawerCopy.notifications}</span>
          {unreadCount > 0 && (
            <span aria-hidden className="size-2 rounded-full bg-notification" />
          )}
        </NavLink>

        <NavLink
          to="/wallet"
          onClick={onClose}
          className={({ isActive }) => navRowClass(isActive)}
        >
          {navDrawerCopy.navWallet}
        </NavLink>
      </nav>

      <div className="border-t border-ink-border/20" />

      {/* Bottom pinned region */}
      <div className="shrink-0 flex flex-col">
        <Link
          to="/write"
          onClick={onClose}
          className="flex min-h-[44px] w-full items-center justify-center border-b border-ink-border/20 px-4 text-body font-medium text-brand-purple hover:bg-brand-purple-5"
        >
          {navDrawerCopy.startWriting}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center px-4 text-body font-medium text-ink-80 hover:text-ink"
        >
          {navDrawerCopy.logout}
        </button>
      </div>
    </>
  );
}

// ---------- main export ------------------------------------------------------

export function MobileNavDrawer({ open, onClose }: Props) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Close on route change (satisfies exhaustive-deps: location is the dep).
  useEffect(() => {
    if (open) onClose();
    // We intentionally omit onClose from deps: it's () => setNavOpen(false),
    // a new function identity each render — it's setNavOpen (the state setter)
    // that's stable. Including onClose would re-run on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          id: "mobile-nav-drawer",
          sx: {
            width: 320,
            backgroundColor: "#ffffff",
            padding: 0,
          },
        },
        backdrop: {
          sx: { backgroundColor: "rgba(32,33,35,0.6)" },
        },
      }}
    >
      <div className="flex h-full flex-col">
        {isAuthenticated ? (
          <LoggedInPanel onClose={onClose} />
        ) : (
          <LoggedOutPanel onClose={onClose} />
        )}
      </div>
    </Drawer>
  );
}
