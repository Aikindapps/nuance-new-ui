// NIC-261 -- My Profile self-view (/profile).
//
// Wraps content in AccountShell (account layout with left nav rail on desktop).
// Profile header is a copy of WriterProfile's header block -- per Dana's flag,
// a deliberate copy not a shared master -- with two changes:
//   1. "Edit profile" Link (-> /profile/edit) replaces FollowButton.
//   2. "View public profile" Link (-> /{handle}) added below.
// Data bound to useMyProfile() (single hook, no second call).
// Article feed uses ArticleFeed + useAuthorPosts(myHandle).
//
// NIC-262 -- /profile/edit form (ProfileEdit) replaces ProfileEditPlaceholder.
// Single Bio field (bound to the user's bio, 160-char cap; D-127 renamed it
// from Tagline). No reader font on a personal profile (D-112) -- fonts belong
// to publications. Avatar >5 MB pre-checked before useImageUpload (5 MB limit
// here; the shared 10 MB cap in useImageUpload serves article images elsewhere
// and is left untouched).

import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Skeleton from "@mui/material/Skeleton";
import { AccountShell } from "../components/account/AccountShell";
import { Avatar } from "../components/ui/Avatar";
import { SocialIcon } from "../components/ui/icons/SocialIcon";
import { IconVerified } from "../components/ui/icons/IconVerified";
import { ArticleFeed } from "../features/home/sections/ArticleFeed";
import { formatCount } from "../lib/formatCount";
import { useMyProfile } from "../lib/useMyProfile";
import { useAuthorPosts } from "../features/profile/hooks/useAuthorPosts";
import { useImageUpload } from "../features/write/hooks/useImageUpload";
import { useActors } from "../contexts/useActors";
import type { User } from "../candid/User/User";
import {
  detectSocialPlatform,
  normalizeUrl,
} from "../features/article/lib/socialChannels";
import {
  profileSelfCopy,
  verifyProfileCopy,
  imageUploadCopy,
} from "../constants/copy";
import { useModal } from "../services/modal";
import { useToast } from "../services/toast";
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

// -- /profile/edit -- NIC-262 -------------------------------------------------

// 5 MB avatar cap -- enforced client-side BEFORE calling useImageUpload.
// The shared useImageUpload hook has its own 10 MB cap (for article images);
// that cap is intentionally left at 10 MB.
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

// Bio field cap matches the User canister's hard limit (updateUserDetails
// rejects a bio over 160).
const BIO_MAX = 160;

// Social-link platform ordering used to map socialChannels[] to named inputs.
// detectSocialPlatform already covers these domains; the order is for seeding.
const SOCIAL_PLATFORMS = ["google", "linkedin", "reddit", "facebook"] as const;
type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number];

const isNamedPlatform = (p: string): p is SocialPlatformKey =>
  (SOCIAL_PLATFORMS as readonly string[]).includes(p);

function seedSocialInputs(rawChannels: string[]): Record<SocialPlatformKey, string> {
  const state: Record<SocialPlatformKey, string> = {
    google: "",
    linkedin: "",
    reddit: "",
    facebook: "",
  };
  for (const url of rawChannels) {
    const platform = detectSocialPlatform(url.trim());
    if (platform !== "other" && platform in state) {
      state[platform as SocialPlatformKey] = url.trim();
    }
  }
  return state;
}

function buildSocialChannelsUrls(
  social: Record<SocialPlatformKey, string>,
  otherLinks: string[],
): string[] {
  const keyed = SOCIAL_PLATFORMS.map((p) => social[p].trim()).filter((u) => u !== "");
  return [...keyed, ...otherLinks];
}

// -- ProfileEditInner -- receives User data as props (mounted after data loads) --
//
// State is seeded once at mount from the User record passed as props. No
// re-seed effect -- the outer gate (ProfileEditView) only mounts this
// component when the User record is available, so the initial state is always
// fully populated.

type ProfileEditInnerProps = {
  user: User;
};

function ProfileEditInner({ user }: ProfileEditInnerProps) {
  const { updateUserDetails } = useActors();
  const uploadImage = useImageUpload();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialHandle = user.handle;

  // Seed bio -- join newlines with a space so it's single-line.
  const seedBio = user.bio.split("\n").join(" ");
  const seedAvatar = user.avatar;
  const seedDisplayName = user.displayName;
  const seedWebsite = user.website;
  const seedSocial = seedSocialInputs(user.socialChannels);

  // Form state -- seeded once at mount from the User record.
  const [displayName, setDisplayName] = useState(seedDisplayName);
  const [bio, setBio] = useState(seedBio);
  const [avatarUrl, setAvatarUrl] = useState(seedAvatar);
  const [website, setWebsite] = useState(seedWebsite);
  const [social, setSocial] = useState<Record<SocialPlatformKey, string>>(seedSocial);
  // Links without a named input here (X/Twitter, Distrikt, Mastodon, custom
  // URLs, and any extra url for a platform that already has one) are NOT
  // exposed as editable inputs -- they are carried through verbatim on every
  // save so the user doesn't silently lose them. Seeded synchronously from the
  // User record: a url is "named" (and so excluded here) only if its platform
  // is one of SOCIAL_PLATFORMS AND it is exactly the url shown in that named
  // input -- any other stored url (including an earlier duplicate for a named
  // platform) falls through to here.
  const [otherLinks] = useState<string[]>(() =>
    user.socialChannels
      .map((u) => u.trim())
      .filter((u) => {
        if (u === "") return false;
        const platform = detectSocialPlatform(u);
        return !(isNamedPlatform(platform) && seedSocial[platform] === u);
      }),
  );

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarTooLarge, setAvatarTooLarge] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // -- Dirty tracking -------------------------------------------------------

  const isDirty =
    displayName !== seedDisplayName ||
    bio !== seedBio ||
    avatarUrl !== seedAvatar ||
    website !== seedWebsite ||
    JSON.stringify(social) !== JSON.stringify(seedSocial);

  // -- Avatar file select handler -------------------------------------------

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!e.target.files) return;
      // Reset so the same file can be re-selected after removal.
      e.target.value = "";
      if (!file) return;

      // 5 MB pre-check -- before useImageUpload (which serves article images at 10 MB).
      if (file.size > AVATAR_MAX_BYTES) {
        setAvatarTooLarge(true);
        return;
      }
      setAvatarTooLarge(false);
      setAvatarUploading(true);
      try {
        const url = await uploadImage(file);
        setAvatarUrl(url);
      } catch (err) {
        console.error("[avatar upload]", err);
        toast.show(imageUploadCopy.uploadFailed, "error");
      } finally {
        setAvatarUploading(false);
      }
    },
    [uploadImage, toast],
  );

  // -- Save handler ---------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (bio.length > BIO_MAX) return;
    setSaving(true);
    setSaveError(null);
    try {
      const socialChannelsUrls = buildSocialChannelsUrls(social, otherLinks);
      // An untouched Bio field sends the stored bio back exactly as it was, so
      // a save that only changed another field never flattens a legacy
      // multi-line bio.
      const bioToSave = bio === seedBio ? user.bio : bio;
      const detailsRes = await updateUserDetails(
        bioToSave,
        avatarUrl,
        displayName,
        website,
        socialChannelsUrls,
      );
      if (detailsRes.__kind__ === "err") throw new Error(detailsRes.err);
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.show("Profile saved", "success");
      navigate("/profile");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      setSaveError(msg);
      toast.show(msg, "error");
    } finally {
      setSaving(false);
    }
  }, [
    bio,
    seedBio,
    user.bio,
    avatarUrl,
    displayName,
    website,
    social,
    otherLinks,
    updateUserDetails,
    queryClient,
    toast,
    navigate,
  ]);

  // -- Field helpers --------------------------------------------------------

  const bioInvalid = bio.length > BIO_MAX;

  const inputClass = [
    "w-full rounded-[calc(8*var(--fpx))]",
    "border border-ink-border/20",
    "px-[calc(16*var(--fpx))] h-[calc(48*var(--fpx))]",
    "text-[length:calc(16*var(--fpx))] leading-[calc(19*var(--fpx))] text-ink",
    "bg-white outline-none",
    // Empty-field placeholder at Black/60% (NIC-583).
    "placeholder:text-ink-60",
    "focus:border-brand-purple",
    "transition-colors",
  ].join(" ");

  const labelClass =
    "text-[length:calc(16*var(--fpx))] font-medium leading-[calc(19*var(--fpx))] text-ink/80";

  const dividerClass = "h-px bg-ink-border/10";

  const sectionHeadingClass =
    "text-[length:calc(18*var(--fpx))] font-bold leading-[calc(22*var(--fpx))] text-ink";

  // -- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-col gap-[calc(40*var(--fpx))]">
      {/* Back link + page title */}
      <div className="flex flex-col gap-2">
        <Link
          to="/profile"
          className={[
            "text-[length:calc(16*var(--fpx))] font-medium leading-[calc(19*var(--fpx))]",
            "text-brand-purple hover:underline self-start",
          ].join(" ")}
        >
          &lsaquo; My profile
        </Link>
        <h1 className="text-[length:calc(24*var(--fpx))] font-bold leading-[calc(29*var(--fpx))] text-ink">
          Edit profile
        </h1>
      </div>

      {/* -- Divider -- */}
      <div className={dividerClass} aria-hidden="true" />

      {/* -- Profile photo -- */}
      <section aria-labelledby="edit-section-photo">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p id="edit-section-photo" className={sectionHeadingClass}>
              Profile photo
            </p>
            <p className="text-[length:calc(16*var(--fpx))] font-normal leading-[calc(19*var(--fpx))] text-ink/60">
              This appears on your profile and articles
            </p>
          </div>
          <div className="flex flex-row items-center gap-4">
            <Avatar
              src={avatarUrl}
              label={displayName || initialHandle}
              sizeClass="size-[calc(120*var(--fpx))]"
              textClass="text-[length:calc(48*var(--fpx))]"
            />
            <button
              type="button"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "inline-flex items-center justify-center",
                "rounded-[calc(8*var(--fpx))]",
                "px-[calc(24*var(--fpx))] h-[calc(48*var(--fpx))]",
                "text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))]",
                "text-brand-purple border border-brand-purple bg-white",
                "transition-opacity hover:opacity-80 disabled:opacity-50",
              ].join(" ")}
            >
              {avatarUploading ? "Uploading..." : "Change photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl("");
                  setAvatarTooLarge(false);
                }}
                className={[
                  "inline-flex items-center justify-center",
                  "px-[calc(24*var(--fpx))] h-[calc(48*var(--fpx))]",
                  "text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))]",
                  "text-brand-purple hover:underline",
                ].join(" ")}
              >
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileSelect}
              aria-label="Select profile photo"
            />
          </div>
          {/* Avatar too-large error (Figma frame 1565:3021) */}
          {avatarTooLarge && (
            <p className="text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/80">
              Image must be under 5 MB
            </p>
          )}
        </div>
      </section>

      {/* -- Divider -- */}
      <div className={dividerClass} aria-hidden="true" />

      {/* -- Basic details -- */}
      <section aria-labelledby="edit-section-basic">
        <div className="flex flex-col gap-4">
          <p id="edit-section-basic" className={sectionHeadingClass}>
            Basic details
          </p>

          {/* Display name */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              htmlFor="edit-display-name"
              className={labelClass}
            >
              Display name
            </label>
            <input
              id="edit-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          {/* Handle -- read-only */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              htmlFor="edit-handle"
              className={labelClass}
            >
              Handle
            </label>
            <div
              className={[
                "flex flex-row items-center",
                "w-full rounded-[calc(8*var(--fpx))]",
                "border border-ink-border/20",
                "px-[calc(16*var(--fpx))] h-[calc(48*var(--fpx))]",
                "bg-white",
              ].join(" ")}
            >
              <span className="text-[length:calc(16*var(--fpx))] text-ink/60 mr-0.5">
                @
              </span>
              <span
                id="edit-handle"
                className="text-[length:calc(16*var(--fpx))] leading-[calc(19*var(--fpx))] text-ink"
              >
                {initialHandle}
              </span>
            </div>
            <p className="text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/60">
              nuance.xyz/@{initialHandle}
            </p>
          </div>

          {/* Bio -- single field bound to the user's bio (D-127, renamed from
              Tagline). 160-char backend cap. */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label
              htmlFor="edit-bio"
              className={labelClass}
            >
              Bio
            </label>
            <input
              id="edit-bio"
              type="text"
              value={bio}
              maxLength={BIO_MAX}
              onChange={(e) => setBio(e.target.value)}
              className={[
                inputClass,
                bioInvalid ? "border-red-500 focus:border-red-500" : "",
              ].join(" ")}
              autoComplete="off"
            />
            <p
              className={[
                "text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))]",
                bioInvalid ? "text-red-500" : "text-ink/60",
              ].join(" ")}
            >
              {bio.length} / {BIO_MAX}
            </p>
          </div>
        </div>
      </section>

      {/* -- Divider -- */}
      <div className={dividerClass} aria-hidden="true" />

      {/* -- Social links -- */}
      <section aria-labelledby="edit-section-social">
        <div className="flex flex-col gap-4">
          <p id="edit-section-social" className={sectionHeadingClass}>
            Social links
          </p>

          {/* Website (stored in user.website, sent as websiteUrl arg) */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label htmlFor="edit-website" className={labelClass}>
              Website
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <input
                id="edit-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
              />
            </div>
          </div>

          {/* Google */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label htmlFor="edit-social-google" className={labelClass}>
              Google
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
                <SocialIcon platform="google" className="size-4" />
              </span>
              <input
                id="edit-social-google"
                type="url"
                value={social.google}
                onChange={(e) =>
                  setSocial((s) => ({ ...s, google: e.target.value }))
                }
                placeholder="https://..."
                className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label htmlFor="edit-social-linkedin" className={labelClass}>
              LinkedIn
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
                <SocialIcon platform="linkedin" className="size-4" />
              </span>
              <input
                id="edit-social-linkedin"
                type="url"
                value={social.linkedin}
                onChange={(e) =>
                  setSocial((s) => ({ ...s, linkedin: e.target.value }))
                }
                placeholder="https://..."
                className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
              />
            </div>
          </div>

          {/* Reddit */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label htmlFor="edit-social-reddit" className={labelClass}>
              Reddit
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
                <SocialIcon platform="reddit" className="size-4" />
              </span>
              <input
                id="edit-social-reddit"
                type="url"
                value={social.reddit}
                onChange={(e) =>
                  setSocial((s) => ({ ...s, reddit: e.target.value }))
                }
                placeholder="https://..."
                className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
              />
            </div>
          </div>

          {/* Facebook */}
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label htmlFor="edit-social-facebook" className={labelClass}>
              Facebook
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
                <SocialIcon platform="facebook" className="size-4" />
              </span>
              <input
                id="edit-social-facebook"
                type="url"
                value={social.facebook}
                onChange={(e) =>
                  setSocial((s) => ({ ...s, facebook: e.target.value }))
                }
                placeholder="https://..."
                className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* -- Divider -- */}
      <div className={dividerClass} aria-hidden="true" />

      {/* -- Save / Cancel -- */}
      <div className="flex flex-row items-center gap-4">
        <button
          type="button"
          disabled={saving || bioInvalid || (!isDirty && !saving)}
          onClick={handleSave}
          className={[
            "inline-flex items-center justify-center",
            "rounded-[calc(8*var(--fpx))]",
            "px-[calc(24*var(--fpx))] h-[calc(48*var(--fpx))]",
            "text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-white",
            "bg-brand-gradient-button",
            "shadow-[var(--shadow-purple-glow-medium)]",
            "transition-opacity hover:opacity-90 disabled:opacity-50",
          ].join(" ")}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <Link
          to="/profile"
          className={[
            "inline-flex items-center justify-center",
            "px-[calc(24*var(--fpx))] h-[calc(48*var(--fpx))]",
            "text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))]",
            "text-brand-purple hover:underline",
          ].join(" ")}
        >
          Cancel
        </Link>
      </div>

      {/* Inline error (supplements toast) */}
      {saveError && (
        <p role="alert" className="text-[length:calc(14*var(--fpx))] text-red-500">
          {saveError}
        </p>
      )}
    </div>
  );
}

// -- ProfileEdit -- gate: wait for User record before mounting inner form ------

function ProfileEditView() {
  const profile = useMyProfile();

  if (profile.isError) {
    return (
      <div role="alert" className="py-12 text-center">
        <p className="font-bold text-ink">{profileSelfCopy.errorHeading}</p>
        <p className="mt-2 text-body text-ink-60">{profileSelfCopy.errorBody}</p>
      </div>
    );
  }

  if (profile.isLoading || !profile.data) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton variant="text" sx={{ width: 120, height: 20 }} />
        <Skeleton variant="text" sx={{ width: 180, height: 30 }} />
        <Skeleton variant="rectangular" sx={{ width: "100%", height: 120, borderRadius: 2 }} />
        <Skeleton variant="rectangular" sx={{ width: "100%", height: 200, borderRadius: 2 }} />
      </div>
    );
  }

  return <ProfileEditInner user={profile.data} />;
}

export function ProfileEdit() {
  return (
    <AccountShell active="profile">
      <ProfileEditView />
    </AccountShell>
  );
}

// -- Kept for backwards compat -- main.tsx import updated to ProfileEdit -------
export function ProfileEditPlaceholder() {
  return <ProfileEdit />;
}
