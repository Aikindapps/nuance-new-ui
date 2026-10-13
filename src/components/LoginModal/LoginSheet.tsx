import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import type { OpenIdProvider } from "@icp-sdk/auth/client";
import { IconClose } from "../ui/icons/IconClose";
import { PURPLE_GRADIENT, primaryButtonSx } from "../ui/modalButtons";
import { loginModalCopy as c } from "../../constants/copy";

// Phone-only full-screen sheet for "Join or log in" (Figma 2139:4283
// default / 2140:4290 loading / 2141:2971 error / 2142:4303 short
// screen). Rendered by LoginModal below the 1024px seam, inside the
// modal service's Dialog, which supplies the scrim, focus trap and
// Escape handling (this modal is dismissable). Purely presentational:
// LoginModal owns the sign-in call and passes the state down.
//
// Header and buttons scroll together, so a short screen can still
// reach every button. While there is more below, a soft white fade
// sits on the bottom edge; it goes away at the end of the scroll.

// "ii" = classic Internet Identity (login() without an OpenID provider).
export type LoginProvider = "ii" | OpenIdProvider;

const PROVIDERS: { key: LoginProvider; label: string }[] = [
  { key: "ii", label: c.iiLabel },
  { key: "google", label: c.googleLabel },
  { key: "apple", label: c.appleLabel },
  { key: "microsoft", label: c.microsoftLabel },
];

// The tapped button stays at full strength while it shows the spinner;
// the other three use the standard disabled (dimmed) primary style.
const busyButtonSx = {
  ...primaryButtonSx,
  "&.Mui-disabled": {
    backgroundImage: PURPLE_GRADIENT,
    color: "#ffffff",
    opacity: 1,
    boxShadow: "var(--shadow-purple-glow-medium)",
  },
};

function BusySpinner() {
  return (
    <svg
      className="size-[calc(18*var(--fpx))] animate-spin"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="44"
        strokeDashoffset="30"
      />
    </svg>
  );
}

type LoginSheetProps = {
  titleId: string;
  // The provider whose sign-in is in flight, if any.
  activeProvider: LoginProvider | null;
  // Auth is busy (a sign-in or the session check); no button can start
  // another sign-in.
  isLoading: boolean;
  // The last sign-in attempt from this sheet failed.
  showError: boolean;
  onLogin: (provider: LoginProvider) => void;
  onClose: () => void;
};

export function LoginSheet({
  titleId,
  activeProvider,
  isLoading,
  showError,
  onLogin,
  onClose,
}: LoginSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const inFlight = isLoading || activeProvider !== null;

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const update = () => {
      setMoreBelow(
        scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 1,
      );
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(content);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // A failed sign-in from a button lower down a short screen: bring the
  // message above the buttons back into view.
  useEffect(() => {
    if (showError) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [showError]);

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div
        ref={scrollRef}
        className={
          "min-h-0 flex-1 overflow-y-auto px-[calc(24*var(--fpx))] " +
          "pt-[calc(24*var(--fpx))]"
        }
      >
        <div ref={contentRef} className="pb-[calc(24*var(--fpx))]">
          {/* Close on its own row; title below it (same header as the
              Create Account sheets) */}
          <div className="flex justify-end">
            <button
              type="button"
              aria-label={c.closeAriaLabel}
              onClick={onClose}
              className="flex size-8 items-center justify-center text-brand-purple"
            >
              <IconClose className="size-6" />
            </button>
          </div>
          <h2
            id={titleId}
            className="mt-[calc(16*var(--fpx))] text-title-md font-bold text-ink"
          >
            {c.heading}
          </h2>
          <p className="mt-[calc(12*var(--fpx))] text-body text-ink">{c.body}</p>

          {/* Content column -- Figma 345 wide, column gap 16 */}
          <div className="mt-[calc(20*var(--fpx))] flex flex-col gap-4">
            {showError && (
              <p
                ref={errorRef}
                role="alert"
                className="text-label font-medium text-brand-purple"
              >
                {c.signInError}
              </p>
            )}
            {PROVIDERS.map(({ key, label }) => {
              const busy = activeProvider === key;
              return (
                <Button
                  key={key}
                  fullWidth
                  onClick={() => onLogin(key)}
                  disabled={inFlight}
                  sx={busy ? busyButtonSx : primaryButtonSx}
                >
                  {busy ? (
                    <span className="flex items-center gap-3">
                      <BusySpinner />
                      {c.connectingLabel}
                    </span>
                  ) : (
                    label
                  )}
                </Button>
              );
            })}
            <a
              href={c.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-body font-medium text-brand-purple"
            >
              {c.helpLabel}
            </a>
          </div>
        </div>
      </div>

      {moreBelow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(48*var(--fpx))]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff)",
          }}
        />
      )}
    </div>
  );
}
