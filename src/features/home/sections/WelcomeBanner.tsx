import { useEffect, useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { useAuth } from "../../../contexts/useAuth";
import { useMyProfile } from "../../../lib/useMyProfile";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import { homeLoggedInCopy } from "../../../constants/copy";

// Figma 1:50060 — dark rounded popup, top-right under the header. Shows
// only briefly after login: a "Welcome back, {name}!" confirmation that
// dismisses itself after a few seconds. Visibility is gated on lastLoginAt
// (the CURRENT login — set on signIn() success, persisted to localStorage so
// a reload within the window keeps the popup); the popup only renders if
// we're within DISPLAY_MS of that timestamp. The second line shows
// previousLoginAt — the login BEFORE this one — as "Last login: X ago".
//
// Registered users see "Welcome back, {name}!"; unregistered principals
// (local dev test identities, or any brand-new II principal in prod) see
// "Welcome to Nuance!" — decision #27 covers why local dev intentionally
// lands on the unregistered path.

const DISPLAY_MS = 5000;

export function WelcomeBanner() {
  const { lastLoginAt, previousLoginAt } = useAuth();
  const profile = useMyProfile();
  const [visible, setVisible] = useState(false);

  // Visibility is effect-driven: deciding "are we still within DISPLAY_MS of
  // login" means reading the clock, which is a side effect — and the check
  // must re-run on reload, when lastLoginAt is rehydrated from localStorage.
  // The setState-in-effect lint rule is a heuristic that flags this otherwise
  // legitimate timer/clock-sync pattern; disabled on the one line below.
  useEffect(() => {
    if (!lastLoginAt) return;
    const remaining = DISPLAY_MS - (Date.now() - lastLoginAt);
    if (remaining <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock-driven; see comment above
    setVisible(true);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [lastLoginAt]);

  if (!visible) return null;

  // An authed principal with no Nuance profile is mid-onboarding — the
  // OnboardingGate's RegisterModal is that user's welcome. Suppress this
  // popup so they don't get two greetings at once (PR #6 review m5).
  if (profile.isSuccess && profile.data === null) return null;

  const name = profile.data?.displayName?.trim() || profile.data?.handle;
  const greeting = name
    ? `${homeLoggedInCopy.welcomeBackPrefix} ${name}${homeLoggedInCopy.welcomeBackSuffix}`
    : homeLoggedInCopy.welcomeNew;

  return (
    <div
      className="fixed right-4 top-[calc(80*var(--fpx))] z-50 flex w-[calc(100vw-2rem)] max-w-[calc(323*var(--fpx))] flex-col items-start justify-center gap-2 rounded-popup bg-ink px-4 py-3 text-white shadow-lg md:right-8 md:top-[calc(96*var(--fpx))] lg:right-12 lg:top-[calc(104*var(--fpx))]"
      role="status"
      aria-live="polite"
    >
      {profile.isLoading ? (
        <Skeleton
          variant="text"
          sx={{
            bgcolor: "rgba(255,255,255,0.18)",
            width: "60%",
            height: 24,
          }}
        />
      ) : (
        <p className="text-base font-medium leading-6">{greeting}</p>
      )}
      {previousLoginAt !== null && (
        <p className="text-sm leading-6">
          {homeLoggedInCopy.lastLoginLabel}: {formatRelativeTime(previousLoginAt)}
        </p>
      )}
    </div>
  );
}
