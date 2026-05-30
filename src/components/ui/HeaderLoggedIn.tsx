import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogoNuance } from "./icons/LogoNuance";
import { IconSearch } from "./icons/IconSearch";
import { IconBell } from "./icons/IconBell";
import { UserMenu } from "./UserMenu";
import { headerCopy } from "../../constants/copy";
import { NotificationsFoldout } from "../../features/notifications/NotificationsFoldout";
import { useUnreadCount } from "../../features/notifications/hooks/useUnreadCount";

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

export function HeaderLoggedIn() {
  const bellRef = useRef<HTMLButtonElement>(null);
  const [foldoutOpen, setFoldoutOpen] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <header className="flex h-16 w-full items-center border-b border-ink-border/20 bg-white px-4 md:h-20 md:px-8 lg:h-[calc(88*var(--fpx))] lg:px-12">
      <Link
        to="/"
        aria-label={headerCopy.homeAriaLabel}
        className="shrink-0 text-brand-purple"
      >
        <LogoNuance className="h-9 w-auto lg:h-[calc(51*var(--fpx))]" />
      </Link>

      <div className="flex flex-1 justify-center px-4">
        <SearchBar className="hidden w-full max-w-[calc(740*var(--fpx))] md:flex" />
        <button
          type="button"
          aria-label={headerCopy.searchAriaLabel}
          className="flex size-10 items-center justify-center text-brand-purple md:hidden"
        >
          <IconSearch className="size-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-4">
        <Link
          to="/write"
          className="hidden h-10 items-center justify-center rounded-card border border-brand-purple bg-white px-4 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5 md:flex lg:h-12 lg:px-6"
        >
          {headerCopy.startWriting}
        </Link>

        {/* Mobile (<md): bell is a Link → /notifications. No foldout — the
            355px panel doesn't fit a phone viewport, and full-page navigation
            is the natural pattern there. */}
        <Link
          to="/notifications"
          aria-label={headerCopy.notificationsAriaLabel}
          className="relative flex size-10 items-center justify-center rounded-card text-brand-purple transition-colors hover:bg-brand-purple-5 md:hidden"
        >
          <IconBell className="size-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute right-2 top-2 size-2 rounded-full bg-notification"
            />
          )}
        </Link>

        {/* Desktop (md+): bell toggles the anchored foldout. */}
        <div className="relative hidden md:block">
          <button
            ref={bellRef}
            type="button"
            aria-label={headerCopy.notificationsAriaLabel}
            aria-expanded={foldoutOpen}
            aria-haspopup="dialog"
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

        <UserMenu />
      </div>
    </header>
  );
}

function SearchBar({ className = "" }: { className?: string }) {
  return (
    <form
      role="search"
      className={`h-10 items-center gap-2 rounded-card border border-ink-border/10 bg-ink-border/5 px-3 lg:h-12 lg:px-4 ${className}`}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="search"
        placeholder={headerCopy.searchPlaceholder}
        aria-label={headerCopy.searchInputAriaLabel}
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
