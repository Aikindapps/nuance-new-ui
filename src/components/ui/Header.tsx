import { Link } from "react-router-dom";
import { LogoNuance } from "./icons/LogoNuance";
import { IconSearch } from "./icons/IconSearch";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../../contexts/useAuth";
import { useModal } from "../../services/modal";
import { LoginModal, LOGIN_MODAL_TITLE_ID } from "../LoginModal/LoginModal";
import { headerCopy } from "../../constants/copy";
import { useHeaderSearch } from "./useHeaderSearch";

export function Header() {
  const { isAuthenticated } = useAuth();
  const modal = useModal();
  const openLogin = () =>
    modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });

  return (
    <header className="flex h-16 w-full items-center border-b border-white-20 px-4 md:h-20 md:px-8 lg:h-[calc(88*var(--fpx))] lg:px-12">
      <Link to="/" aria-label={headerCopy.homeAriaLabel} className="shrink-0 text-white">
        <LogoNuance className="h-9 w-auto lg:h-[calc(51*var(--fpx))]" />
      </Link>

      {/* Primary nav — hidden on mobile, shown md+ */}
      <nav className="ml-6 hidden items-center gap-6 font-bold text-white md:flex lg:ml-10 lg:gap-10">
        <Link to="/" className="text-body hover:underline lg:text-lg">
          {headerCopy.navDiscover}
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2 md:gap-3 lg:gap-4">
        {/* Search — icon-only on mobile, input md+ */}
        <MobileSearchIcon />
        <SearchInput className="hidden md:flex md:w-48 lg:w-[calc(320*var(--fpx))] xl:w-[calc(405*var(--fpx))]" />

        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            {/* Login — hidden on mobile */}
            <button
              type="button"
              onClick={openLogin}
              className="hidden h-10 items-center justify-center rounded-card border border-white px-4 text-body font-medium text-white transition-colors hover:bg-white-10 md:flex lg:h-12 lg:px-6"
            >
              {headerCopy.login}
            </button>

            <button
              type="button"
              onClick={openLogin}
              className="flex h-10 items-center justify-center rounded-card bg-white px-3 text-sm font-medium text-brand-purple transition-opacity hover:opacity-90 md:px-4 md:text-body lg:h-12 lg:px-6"
            >
              {headerCopy.getStarted}
            </button>
          </>
        )}

        {/* Hamburger — mobile only */}
        <button
          type="button"
          aria-label={headerCopy.openMenuAriaLabel}
          className="flex size-10 items-center justify-center text-white md:hidden"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}

function MobileSearchIcon() {
  const { onMobileIconClick } = useHeaderSearch();
  return (
    <button
      type="button"
      aria-label={headerCopy.searchAriaLabel}
      className="flex size-10 items-center justify-center text-white md:hidden"
      onClick={onMobileIconClick}
    >
      <IconSearch className="size-5" />
    </button>
  );
}

function SearchInput({ className = "" }: { className?: string }) {
  const { value, setValue, onSubmit } = useHeaderSearch();
  return (
    <form
      role="search"
      className={`h-10 items-center gap-2 rounded-card border border-white-20 bg-white-10 px-3 lg:h-12 lg:px-4 ${className}`}
      onSubmit={onSubmit}
    >
      <input
        type="search"
        placeholder={headerCopy.searchPlaceholder}
        aria-label={headerCopy.searchInputAriaLabel}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-body italic text-white placeholder:text-white-80 focus:outline-none"
      />
      <button
        type="submit"
        aria-label={headerCopy.searchSubmitAriaLabel}
        className="flex size-6 shrink-0 items-center justify-center text-white lg:size-8"
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
