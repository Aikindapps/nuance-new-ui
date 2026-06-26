import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useHeaderSearch } from "./useHeaderSearch";
import { LogoNuance } from "./icons/LogoNuance";
import { IconSearch } from "./icons/IconSearch";
import { IconBell } from "./icons/IconBell";
import { UserMenu } from "./UserMenu";
import { headerCopy } from "../../constants/copy";
import { NotificationsFoldout } from "../../features/notifications/NotificationsFoldout";
import { useUnreadCount } from "../../features/notifications/hooks/useUnreadCount";
import { MobileNavDrawer } from "./MobileNavDrawer";

// Figma 1:50116 — the logged-in Header is materially different from
// HomeLoggedOut's purple-band Header: white background, ink-border/20
// bottom border, logo on the left, centered search bar in the middle, and
// a right cluster with the Start-writing button, notification bell, and
// avatar (which UserMenu wraps so it doubles as the logout dropdown
// trigger — Figma static frames don't show the dropdown but the
// interaction is preserved from PR #3).
//
// Mobile is invented (Figma has no mobile variant): search collapses to an
// icon button; the Start-writing button hides; bell + avatar stay visible.
// NIC-66: seam moved from md:768 to lg:1024 for nav/search/right-cluster.
// Hamburger added (top-left, lg:hidden); drawer wired to navOpen state.

export function HeaderLoggedIn() {
  const bellRef = useRef<HTMLButtonElement>(null);
  const [foldoutOpen, setFoldoutOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <>
      <header className="flex h-16 w-full items-center border-b border-ink-border/20 bg-white px-4 md:h-20 md:px-8 lg:h-[calc(88*var(--fpx))] lg:px-12">
        {/* Hamburger — mobile/tablet only, FIRST child (top-left) */}
        <button
          type="button"
          aria-label={headerCopy.openMenuAriaLabel}
          aria-expanded={navOpen}
          aria-controls="mobile-nav-drawer"
          aria-haspopup="dialog"
          onClick={() => setNavOpen(true)}
          className="mr-2 flex size-10 items-center justify-center text-brand-purple lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link
          to="/"
          aria-label={headerCopy.homeAriaLabel}
          className="shrink-0 text-brand-purple"
        >
          <LogoNuance className="h-9 w-auto lg:h-[calc(51*var(--fpx))]" />
        </Link>

        <div className="flex flex-1 justify-center px-4">
          <SearchBar className="hidden w-full max-w-[calc(740*var(--fpx))] lg:flex" />
          <MobileSearchIcon />
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-4">
          <Link
            to="/write"
            className="hidden h-10 items-center justify-center rounded-card border border-brand-purple bg-white px-4 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5 lg:flex lg:h-12 lg:px-6"
          >
            {headerCopy.startWriting}
          </Link>

          {/* Mobile/tablet (<lg): bell is a Link → /notifications. No foldout —
              the 355px panel doesn't fit a phone viewport, and full-page
              navigation is the natural pattern there. */}
          <Link
            to="/notifications"
            aria-label={headerCopy.notificationsAriaLabel}
            className="relative flex size-10 items-center justify-center rounded-card text-brand-purple transition-colors hover:bg-brand-purple-5 lg:hidden"
          >
            <IconBell className="size-5" />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute right-2 top-2 size-2 rounded-full bg-notification"
              />
            )}
          </Link>

          {/* Desktop (lg+): bell toggles the anchored foldout. */}
          <div className="relative hidden lg:block">
            <button
              ref={bellRef}
              type="button"
              aria-label={headerCopy.notificationsAriaLabel}
              aria-expanded={foldoutOpen}
              aria-haspopup="true"
              onClick={() => setFoldoutOpen((o) => !o)}
              className="relative flex size-10 items-center justify-center rounded-card text-brand-purple transition-colors hover:bg-brand-purple-5 lg:size-12"
            >
              <IconBell className="size-5 lg:size-6" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-2 top-2 size-2 rounded-full bg-notification lg:right-[calc(10*var(--fpx))] lg:top-[calc(10*var(--fpx))]"
                />
              )}
            </button>
            {foldoutOpen && (
              <NotificationsFoldout
                anchorRef={bellRef}
                onClose={() => setFoldoutOpen(false)}
              />
            )}
          </div>

          {/* UserMenu — desktop only; account relocates into drawer on mobile */}
          <div className="hidden lg:flex">
            <UserMenu />
          </div>
        </div>
      </header>

      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}

function MobileSearchIcon() {
  const { onMobileIconClick } = useHeaderSearch();
  return (
    <button
      type="button"
      aria-label={headerCopy.searchAriaLabel}
      className="flex size-10 items-center justify-center text-brand-purple lg:hidden"
      onClick={onMobileIconClick}
    >
      <IconSearch className="size-5" />
    </button>
  );
}

function SearchBar({ className = "" }: { className?: string }) {
  const { value, setValue, onSubmit } = useHeaderSearch();
  return (
    <form
      role="search"
      className={`h-10 items-center gap-2 rounded-card border border-ink-border/10 bg-ink-border/5 px-3 lg:h-12 lg:px-4 ${className}`}
      onSubmit={onSubmit}
    >
      <input
        type="search"
        placeholder={headerCopy.searchPlaceholder}
        aria-label={headerCopy.searchInputAriaLabel}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-body italic text-ink-80 placeholder:text-ink-80 focus:outline-none"
      />
      <button
        type="submit"
        aria-label={headerCopy.searchSubmitAriaLabel}
        className="flex size-6 shrink-0 items-center justify-center text-brand-purple lg:size-8"
      >
        <IconSearch className="size-5 lg:size-6" />
      </button>
    </form>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
