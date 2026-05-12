import { useEffect, useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import { useAuth } from "../../../contexts/useAuth";
import { useMyProfile } from "../hooks/useMyProfile";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import { homeLoggedInCopy } from "../../../constants/copy";

// Figma 1:50060 — dark rounded popup, top-right under the header. Shows
// only briefly after login: a "Welcome back, {name}!" confirmation that
// dismisses itself after a few seconds. Implementation reads lastLoginAt
// from AuthContext (set on signIn() success, persisted to localStorage so
// a reload within the visibility window keeps the popup) and only renders
// if we're within DISPLAY_MS of that timestamp.
//
// Registered users see "Welcome back, {name}!"; unregistered principals
// (local dev test identities, or any brand-new II principal in prod) see
// "Welcome to Nuance!" — decision #27 covers why local dev intentionally
// lands on the unregistered path.

const DISPLAY_MS = 5000;

export function WelcomeBanner() {
  const { lastLoginAt } = useAuth();
  const profile = useMyProfile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastLoginAt) return;
    const remaining = DISPLAY_MS - (Date.now() - lastLoginAt);
    if (remaining <= 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [lastLoginAt]);

  if (!visible) return null;

  const name = profile.data?.displayName?.trim() || profile.data?.handle;
  const greeting = name
    ? `${homeLoggedInCopy.welcomeBackPrefix} ${name}${homeLoggedInCopy.welcomeBackSuffix}`
    : homeLoggedInCopy.welcomeNew;
  const relative = lastLoginAt ? formatRelativeTime(lastLoginAt) : "just now";

  return (
    <div
      className="fixed right-4 top-[80px] z-50 flex w-[calc(100vw-2rem)] max-w-[323px] flex-col items-start justify-center gap-2 rounded-[6px] bg-ink px-4 py-3 text-white shadow-lg md:right-8 md:top-[96px] lg:right-12 lg:top-[104px]"
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
      <p className="text-sm leading-6">{relative}</p>
    </div>
  );
}
