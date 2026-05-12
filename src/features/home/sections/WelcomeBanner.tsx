import Skeleton from "@mui/material/Skeleton";
import { useAuth } from "../../../contexts/useAuth";
import { useMyProfile } from "../hooks/useMyProfile";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import { homeLoggedInCopy } from "../../../constants/copy";

// Figma 1:50060 — dark rounded box, top-right under header. Two lines:
// "Welcome back, {displayName}!" + relative time since last login.
//
// Registered users (User canister has a profile at their principal) see
// "Welcome back, {name}!" Unregistered users (local dev test identities, or
// any brand-new II principal in prod) see "Welcome to Nuance!" Decision #27
// covers why local dev intentionally lands on the unregistered path.

export function WelcomeBanner() {
  const { lastLoginAt } = useAuth();
  const profileQuery = useMyProfile();

  const name = profileQuery.data?.displayName?.trim() || profileQuery.data?.handle;
  const greeting = name
    ? `${homeLoggedInCopy.welcomeBackPrefix} ${name}${homeLoggedInCopy.welcomeBackSuffix}`
    : homeLoggedInCopy.welcomeNew;
  const relative = lastLoginAt ? formatRelativeTime(lastLoginAt) : "just now";

  return (
    <div
      className="flex flex-col items-start justify-center gap-2 rounded-[6px] bg-ink px-4 py-3 text-white lg:w-[323px]"
      role="status"
      aria-live="polite"
    >
      {profileQuery.isLoading ? (
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
