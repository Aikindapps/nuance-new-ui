import { useMyProfile } from "../../../lib/useMyProfile";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_CLAIMABLE = 50;

export type ClaimInfo = {
  hasProfile: boolean;
  /** Max claimable, in display NUA (e.g. 50). */
  maxClaimable: number;
  /** Epoch ms when the next claim unlocks; null = never claimed (claim now). */
  nextClaimAt: number | null;
  isClaimActive: boolean;
  isBlocked: boolean;
  /** DecideAI proof-of-humanity — a hard precondition for claiming Free NUA. */
  isVerified: boolean;
};

// Derives the Free-NUA claim state from the cached User profile — no extra
// query. This stays pure (no clock read): it exposes the unlock timestamp +
// eligibility flags, and the component compares `nextClaimAt` against its own
// ticking clock for the live HH:MM:SS countdown and the claimable gate.
export function useClaimInfo(): ClaimInfo {
  const { data: profile } = useMyProfile();
  const ci = profile?.claimInfo;

  if (!ci) {
    return {
      hasProfile: false,
      maxClaimable: DEFAULT_MAX_CLAIMABLE,
      nextClaimAt: null,
      isClaimActive: false,
      isBlocked: false,
      isVerified: false,
    };
  }

  const maxRaw = Number(ci.maxClaimableTokens || "0") / 1e8;
  const maxClaimable = maxRaw > 0 ? maxRaw : DEFAULT_MAX_CLAIMABLE;

  // lastClaimDate is stringified nanoseconds; /1e6 → ms. The Number precision
  // loss is sub-millisecond — irrelevant for a 7-day countdown.
  const lastMs = ci.lastClaimDate ? Number(ci.lastClaimDate) / 1e6 : null;
  const nextClaimAt = lastMs == null ? null : lastMs + WEEK_MS;

  return {
    hasProfile: true,
    maxClaimable,
    nextClaimAt,
    isClaimActive: ci.isClaimActive,
    isBlocked: ci.isUserBlocked,
    isVerified: profile?.isVerified ?? false,
  };
}
