// NIC-261 — My Profile self-view (/profile).
//
// Wraps content in AccountShell (account layout with left nav rail on desktop).
// Profile header is a copy of WriterProfile's header block — per Dana's flag,
// a deliberate copy not a shared master — with two changes:
//   1. "Edit profile" Link (→ /profile/edit) replaces FollowButton.
//   2. "View public profile" Link (→ /{handle}) added below.
// Data bound to useMyProfile() (single hook, no second call).
// Article feed uses ArticleFeed + useAuthorPosts(myHandle).

import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { AccountShell } from "../components/account/AccountShell";
import { Avatar } from "../components/ui/Avatar";
import { SocialIcon } from "../components/ui/icons/SocialIcon";
import { IconVerified } from "../components/ui/icons/IconVerified";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { formatCount } from "../lib/formatCount";
import { useMyProfile } from "../lib/useMyProfile";
import { useAuthorPosts } from "../features/profile/hooks/useAuthorPosts";
import {
  detectSocialPlatform,
  normalizeUrl,
} from "../features/article/lib/socialChannels";
import { profileSelfCopy, verifyProfileCopy } from "../constants/copy";
import { useModal } from "../services/modal";
import {
  VerifyProfileModal,
  VERIFY_PROFILE_MODAL_TITLE_ID,
} from "../features/profile/VerifyProfileModal";

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileHeaderSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 lg:flex-row lg:gap-[calc(56*var(--fpx))]"
      aria-busy="true"
    >
      <Skeleton
        variant="circular"
        sx={{ width: "calc(120*var(--fpx))", height: "calc(120*var(--fpx))", flexShrink: 0 }}
      />
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" sx={{ width: 180, height: 44 }} />
        <Skeleton variant="text" sx={{ width: 280, height: 32 }} />
        <Skeleton variant="text" sx={{ width: 220, height: 24 }} />
        <Skeleton variant="text" sx={{ width: 320, height: 56 }} />
        <div className="flex gap-4">
          <Skeleton variant="rectangular" sx={{ width: 140, height: 48, borderRadius: "var(--radius-card)" }} />
          <Skeleton variant="rectangular" sx={{ width: 200, height: 48, borderRadius: "var(--radius-card)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Inner view (renders once profile is resolved) ─────────────────────────────

function ProfileSelfView() {
  const profile = useMyProfile();
  const handle = profile.data?.handle ?? "";
  const postsQuery = useAuthorPosts(handle);
  const modal = useModal();

  // Error state
  if (profile.isError) {
    return (
      <div role="alert" className="py-12 text-center">
        <p className="font-bold text-ink">{profileSelfCopy.errorHeading}</p>
        <p className="mt-2 text-body text-ink-60">{profileSelfCopy.errorBody}</p>
      </div>
    );
  }

  const user = profile.data;

  // Build social links from User.socialChannels (the self-view field).
  const socials = user
    ? user.socialChannels.map((u) => u.trim()).filter((u) => u !== "")
    : [];
  const website =
    user?.website && user.website.trim() !== "" ? user.website.trim() : null;
  const allLinks = website ? [website, ...socials] : socials;

  const followingCount = user ? user.followersArray.length : null;

  return (
    <div className="flex flex-col gap-[calc(40*var(--fpx))]">
      <title>{profileSelfCopy.metaTitle}</title>

      {/* ── Profile header ── */}
      <section aria-label="My profile">
        {profile.isLoading ? (
          <ProfileHeaderSkeleton />
        ) : (
          user && (
            <div
              className={[
                "flex flex-col gap-4",
                "lg:flex-row lg:items-start lg:gap-[calc(56*var(--fpx))]",
              ].join(" ")}
            >
              {/* Avatar */}
              <div className="shrink-0">
                <Avatar
                  src={user.avatar}
                  label={user.displayName || user.handle}
                  sizeClass="size-[calc(120*var(--fpx))]"
                  textClass="text-[length:calc(48*var(--fpx))]"
                />
              </div>

              {/* Content column */}
              <div className="flex flex-col gap-4">
                {/* @handle */}
                <h1
                  className={[
                    "text-[length:calc(36*var(--fpx))]",
                    "font-bold leading-[calc(44*var(--fpx))]",
                    "text-ink",
                  ].join(" ")}
                >
                  @{user.handle}
                </h1>

                {/* displayName + details + bio */}
                <div className="flex flex-col gap-2">
                  {user.displayName && (
                    <p
                      className={[
                        "text-[length:calc(22*var(--fpx))]",
                        "font-bold leading-[calc(32*var(--fpx))]",
                        "text-ink",
                      ].join(" ")}
                    >
                      {user.displayName}
                    </p>
                  )}

                  {/* Followers | following | social icons */}
                  <div
                    className={[
                      "flex flex-wrap items-center gap-2",
                      "text-[length:calc(16*var(--fpx))]",
                      "font-medium leading-[calc(24*var(--fpx))] text-ink-60",
                    ].join(" ")}
                  >
                    <span>
                      {formatCount(String(user.followersCount))}{" "}
                      {profileSelfCopy.followersLabel}
                    </span>
                    {followingCount !== null && (
                      <span className="text-ink-border">|</span>
                    )}
                    {followingCount !== null && (
                      <span>
                        {followingCount} {profileSelfCopy.followingLabel}
                      </span>
                    )}
                    {allLinks.length > 0 && (
                      <span className="text-ink-border">|</span>
                    )}
                    {allLinks.length > 0 && (
                      <span className="flex items-center gap-1">
                        {allLinks.map((url) => (
                          <a
                            key={url}
                            href={normalizeUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Social link"
                            className={[
                              "flex size-6 items-center justify-center",
                              "rounded-[calc(2*var(--fpx))]",
                              "transition-colors hover:bg-ink-border/10",
                            ].join(" ")}
                          >
                            <SocialIcon
                              platform={detectSocialPlatform(url)}
                              className="size-[calc(18*var(--fpx))] text-ink-60"
                            />
                          </a>
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p
                      className={[
                        "text-[length:calc(18*var(--fpx))]",
                        "font-medium leading-[calc(28*var(--fpx))]",
                        "text-ink-60",
                      ].join(" ")}
                    >
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* Controls: Edit profile + View public profile + verify/verified */}
                <div
                  className={[
                    "flex flex-col gap-3",
                    "lg:flex-row lg:items-center lg:gap-4",
                  ].join(" ")}
                >
                  <Link
                    to="/profile/edit"
                    className={[
                      "inline-flex items-center justify-center",
                      "rounded-card",
                      "px-[calc(24*var(--fpx))] py-[calc(10*var(--fpx))]",
                      "text-[length:calc(18*var(--fpx))]",
                      "font-medium leading-[calc(28*var(--fpx))] text-white",
                      "bg-brand-gradient-button",
                      "shadow-[var(--shadow-purple-glow-medium)]",
                      "transition-opacity hover:opacity-90",
                    ].join(" ")}
                  >
                    {profileSelfCopy.editProfile}
                  </Link>
                  <Link
                    to={`/${user.handle}`}
                    className={[
                      "inline-flex items-center justify-center self-start",
                      "px-[calc(24*var(--fpx))] py-[calc(12*var(--fpx))]",
                      "text-[length:calc(18*var(--fpx))]",
                      "font-medium leading-[calc(28*var(--fpx))]",
                      "text-brand-purple",
                      "hover:underline",
                    ].join(" ")}
                  >
                    {profileSelfCopy.viewPublicProfile}
                  </Link>
                  {/* Verify profile CTA — only shown when not yet verified */}
                  {!user.isVerified && (
                    <button
                      type="button"
                      onClick={() =>
                        modal.open(<VerifyProfileModal />, {
                          ariaLabelledBy: VERIFY_PROFILE_MODAL_TITLE_ID,
                        })
                      }
                      className={[
                        "inline-flex items-center justify-center self-start",
                        "rounded-card",
                        "px-[calc(24*var(--fpx))] py-[calc(10*var(--fpx))]",
                        "text-[length:calc(18*var(--fpx))]",
                        "font-medium leading-[calc(28*var(--fpx))]",
                        "text-brand-purple",
                        "border border-brand-purple",
                        "transition-colors hover:bg-brand-purple/5",
                      ].join(" ")}
                    >
                      {verifyProfileCopy.button}
                    </button>
                  )}
                  {/* Verified indicator — shown once proof-of-humanity is confirmed */}
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-1.5 self-start text-ink-60">
                      <IconVerified
                        className="size-5 text-brand-purple"
                        label={verifyProfileCopy.verifiedLabel}
                      />
                      <span
                        aria-hidden
                        className={[
                          "text-[length:calc(16*var(--fpx))]",
                          "font-medium leading-[calc(24*var(--fpx))]",
                        ].join(" ")}
                      >
                        {verifyProfileCopy.verifiedLabel}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </section>

      {/* Divider */}
      <div className="h-px bg-ink-border/10" aria-hidden="true" />

      {/* Section header */}
      <div className="flex flex-col gap-2">
        <h2
          className={[
            "text-[length:calc(24*var(--fpx))]",
            "font-bold leading-[calc(29*var(--fpx))]",
            "text-ink",
          ].join(" ")}
        >
          {profileSelfCopy.sectionHeading}
        </h2>
        <p
          className={[
            "text-[length:calc(16*var(--fpx))]",
            "font-normal leading-[calc(19*var(--fpx))]",
            "text-ink-60",
          ].join(" ")}
        >
          {profileSelfCopy.sectionSubheading}
        </p>
      </div>

      {/* Article feed */}
      <ArticleFeed
        query={postsQuery}
        emptyMessage={profileSelfCopy.emptyFeed}
        feedLabel={profileSelfCopy.sectionHeading}
      />
    </div>
  );
}

// ── Route export ─────────────────────────────────────────────────────────────

export function Profile() {
  return (
    <AccountShell active="profile">
      <ProfileSelfView />
    </AccountShell>
  );
}

// ── /profile/edit placeholder (NIC-262 is the sibling card) ──────────────────

export function ProfileEditPlaceholder() {
  return (
    <AccountShell active="profile">
      <div className="py-12 text-center">
        <p className="font-bold text-ink">
          {profileSelfCopy.editComingSoonHeading}
        </p>
        <p className="mt-2 text-body text-ink-60">
          {profileSelfCopy.editComingSoonBody}
        </p>
      </div>
    </AccountShell>
  );
}
