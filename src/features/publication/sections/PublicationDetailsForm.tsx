// NIC-381/NIC-382 §6.4 / NIC-370 §6.6 — Publication details + styling form.
//
// Mirrors ProfileEditInner in src/routes/Profile.tsx:
//   - State seeded once at mount; no re-seed effect.
//   - isDirty guard; disabled save while not dirty or while saving.
//   - Social-link passthrough: named platforms are ONLY "x" and "distrikt".
//     Any other stored URLs are round-tripped verbatim (otherLinks) so
//     linkedin / reddit / custom URLs are never silently dropped on save.
//   - Image upload (NIC-382): 5 MB pre-check before calling useImageUpload.
//     The shared hook has its own 10 MB cap for article images — left unchanged.
//   - Styling group (NIC-370): primaryColor picker, font select, logo uploader.
//     Saved via updatePublicationStyling (only when styling changed).
//
// Design ref: Figma 1:42221 / 1:42313 / 1:42309 / 1:42237 / 1:42240 / 1848:7904.
// Form container: 448-wide column, 24px vertical gaps, labels GT Walsheim
// 16 / Bold / black · line-height 24px (token --text-label--line-height).
// Inputs: radius 6 (rounded-[calc(6*var(--fpx))]), border ink-border/10.

import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useToast } from "../../../services/toast";
import type {
  Publication,
  SocialLinksObject,
} from "../../../candid/Publisher/declarations/Publisher.did";
import { detectSocialPlatform } from "../../article/lib/socialChannels";
import { SocialIcon } from "../../../components/ui/icons/SocialIcon";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { Avatar } from "../../../components/ui/Avatar";
import { useImageUpload } from "../../write/hooks/useImageUpload";
import { publicationSettingsCopy as copy } from "../../../constants/copy";
import { PrimaryColorPicker } from "./PrimaryColorPicker";
import { IllustrationNoImages } from "../../../components/ui/icons/IllustrationNoImages";
import { IconImage } from "../../../components/ui/icons/IconImage";

// 5 MB pre-check enforced client-side BEFORE calling useImageUpload.
// The shared useImageUpload hook has its own 10 MB cap (for article images);
// that cap is intentionally left at 10 MB.
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// The two named social platforms this form exposes as labelled inputs.
// All other detected platforms are carried through untouched (otherLinks).
const PUB_SOCIAL_PLATFORMS = ["x", "distrikt"] as const;
type PubSocialPlatform = (typeof PUB_SOCIAL_PLATFORMS)[number];

// Font options — mirrors Profile.tsx; values are the canister's accepted fontType strings.
const FONT_OPTIONS = [
  { value: "GT Walsheim", label: "GT Walsheim" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lato", label: "Lato" },
  { value: "Libre Baskerville", label: "Libre Baskerville" },
  { value: "Playfair Display", label: "Playfair Display" },
] as const;

type Props = {
  handle: string;
  canisterId: string;
  publication: Publication;
};

// Chevron icon — reused for the read-only handle "dropdown" appearance.
function ChevronIcon() {
  return (
    <svg
      width="14"
      height="8"
      viewBox="0 0 14 8"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L7 7L13 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Empty-image dropzone — shared by header image and logo fields.
// Design: Figma 1:42239 / NUR / Add image State=Default.
type EmptyDropzoneProps = {
  onClick: () => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
  uploading: boolean;
  ariaLabel: string;
};

function EmptyImageDropzone({
  onClick,
  onDrop,
  uploading,
  ariaLabel,
}: EmptyDropzoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={[
        "flex flex-row items-center",
        "w-full h-[calc(119*var(--fpx))]",
        "rounded-[calc(16*var(--fpx))]",
        "bg-ink-border/5 border-2 border-ink-border/10",
        "gap-[calc(22*var(--fpx))]",
        "pt-[calc(16*var(--fpx))] pr-[calc(48*var(--fpx))]",
        "pb-[calc(16*var(--fpx))] pl-[calc(24*var(--fpx))]",
        "cursor-pointer",
      ].join(" ")}
      aria-label={ariaLabel}
    >
      <span className="shrink-0 text-ink-border" aria-hidden>
        <IllustrationNoImages className="w-[calc(108.75*var(--fpx))] h-[calc(87*var(--fpx))]" />
      </span>
      <span className="text-[length:calc(16*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-ink/60">
        {uploading ? (
          copy.uploading
        ) : (
          <>
            {copy.dropPrompt}{" "}
            <span className="text-brand-purple underline">{copy.chooseFile}</span>
          </>
        )}
      </span>
    </button>
  );
}

export function PublicationDetailsForm({ handle, canisterId, publication }: Props) {
  const { updatePublicationDetails, updatePublicationStyling } = useActors();
  const uploadImage = useImageUpload();
  const queryClient = useQueryClient();
  const toast = useToast();

  // ── Seed values (synchronous — component mounts only when publication is set) ──

  const seedTitle = publication.publicationTitle;
  const seedSubtitle = publication.subtitle;
  const seedDescription = publication.description;
  const seedWebsite = publication.socialLinks.website;
  const seedHeaderImage = publication.headerImage;
  const seedAvatar = publication.avatar;

  // Styling seeds (NIC-370).
  const seedFontType = publication.styling.fontType;
  const seedPrimaryColor = publication.styling.primaryColor;
  const seedLogo = publication.styling.logo;

  // Seed named platform inputs from socialChannels.
  const seedNamedSocial = (): Record<PubSocialPlatform, string> => {
    const result: Record<PubSocialPlatform, string> = { x: "", distrikt: "" };
    for (const url of publication.socialLinks.socialChannels) {
      const platform = detectSocialPlatform(url);
      if (platform === "x" || platform === "distrikt") {
        result[platform] = url;
      }
    }
    return result;
  };

  // otherLinks: channels whose detected platform is NOT in PUB_SOCIAL_PLATFORMS.
  // These are round-tripped verbatim so we never silently drop linkedin/reddit/etc.
  const seedOtherLinks = publication.socialLinks.socialChannels.filter((url) => {
    const platform = detectSocialPlatform(url);
    return !(PUB_SOCIAL_PLATFORMS as readonly string[]).includes(platform);
  });

  // ── Form state ──────────────────────────────────────────────────────────────

  const [title, setTitle] = useState(seedTitle);
  const [subtitle, setSubtitle] = useState(seedSubtitle);
  const [description, setDescription] = useState(seedDescription);
  const [website, setWebsite] = useState(seedWebsite);
  const [namedSocial, setNamedSocial] = useState<Record<PubSocialPlatform, string>>(
    seedNamedSocial,
  );
  // otherLinks is intentionally not stateful — it never changes in this form.
  const [otherLinks] = useState<string[]>(seedOtherLinks);

  // ── Image state (NIC-382) ───────────────────────────────────────────────────

  const [headerImage, setHeaderImage] = useState(seedHeaderImage);
  const [headerImageFileName, setHeaderImageFileName] = useState("");
  const [headerImageUploading, setHeaderImageUploading] = useState(false);
  const [headerImageTooLarge, setHeaderImageTooLarge] = useState(false);

  const [avatar, setAvatar] = useState(seedAvatar);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarTooLarge, setAvatarTooLarge] = useState(false);

  // Hidden file input refs — one per image field.
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Styling state (NIC-370) ─────────────────────────────────────────────────

  const [fontType, setFontType] = useState(seedFontType);
  const [primaryColor, setPrimaryColor] = useState(seedPrimaryColor);
  const [logo, setLogo] = useState(seedLogo);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoTooLarge, setLogoTooLarge] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Dirty guard ─────────────────────────────────────────────────────────────

  const detailsDirty =
    title !== seedTitle ||
    subtitle !== seedSubtitle ||
    description !== seedDescription ||
    website !== seedWebsite ||
    JSON.stringify(namedSocial) !== JSON.stringify(seedNamedSocial()) ||
    headerImage !== seedHeaderImage ||
    avatar !== seedAvatar;

  const stylingDirty =
    fontType !== seedFontType ||
    primaryColor !== seedPrimaryColor ||
    logo !== seedLogo;

  const isDirty = detailsDirty || stylingDirty;

  // ── Image upload handlers ────────────────────────────────────────────────────

  const handleHeaderImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so the same file can be re-selected after deletion.
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setHeaderImageTooLarge(true);
        return;
      }
      setHeaderImageTooLarge(false);
      setHeaderImageUploading(true);
      try {
        const url = await uploadImage(file);
        setHeaderImage(url);
        setHeaderImageFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setHeaderImageUploading(false);
      }
    },
    [uploadImage, toast],
  );

  const handleHeaderImageDrop = useCallback(
    async (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setHeaderImageTooLarge(true);
        return;
      }
      setHeaderImageTooLarge(false);
      setHeaderImageUploading(true);
      try {
        const url = await uploadImage(file);
        setHeaderImage(url);
        setHeaderImageFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setHeaderImageUploading(false);
      }
    },
    [uploadImage, toast],
  );

  const handleAvatarSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so the same file can be re-selected after deletion.
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setAvatarTooLarge(true);
        return;
      }
      setAvatarTooLarge(false);
      setAvatarUploading(true);
      try {
        const url = await uploadImage(file);
        setAvatar(url);
        setAvatarFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setAvatarUploading(false);
      }
    },
    [uploadImage, toast],
  );

  const handleAvatarDrop = useCallback(
    async (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setAvatarTooLarge(true);
        return;
      }
      setAvatarTooLarge(false);
      setAvatarUploading(true);
      try {
        const url = await uploadImage(file);
        setAvatar(url);
        setAvatarFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setAvatarUploading(false);
      }
    },
    [uploadImage, toast],
  );

  // Logo upload handlers — mirror header image exactly (NIC-370).
  const handleLogoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setLogoTooLarge(true);
        return;
      }
      setLogoTooLarge(false);
      setLogoUploading(true);
      try {
        const url = await uploadImage(file);
        setLogo(url);
        setLogoFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setLogoUploading(false);
      }
    },
    [uploadImage, toast],
  );

  const handleLogoDrop = useCallback(
    async (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > IMAGE_MAX_BYTES) {
        setLogoTooLarge(true);
        return;
      }
      setLogoTooLarge(false);
      setLogoUploading(true);
      try {
        const url = await uploadImage(file);
        setLogo(url);
        setLogoFileName(file.name);
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : copy.imageUploadError,
          "error",
        );
      } finally {
        setLogoUploading(false);
      }
    },
    [uploadImage, toast],
  );

  // ── Save handler ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Build socialChannels: named non-empty entries first, then other links.
      const namedEntries = (Object.entries(namedSocial) as [PubSocialPlatform, string][])
        .filter(([, url]) => url.trim() !== "")
        .map(([, url]) => url);
      const socialChannels = [...namedEntries, ...otherLinks];
      const socialLinks: SocialLinksObject = { website, socialChannels };

      const modified = new Date().getTime().toString();

      if (detailsDirty) {
        const res = await updatePublicationDetails(
          canisterId,
          description,
          title,
          headerImage,              // editable (NIC-382)
          publication.categories,   // round-tripped unchanged
          publication.writers,      // round-tripped unchanged
          publication.editors,      // round-tripped unchanged
          avatar,                   // editable (NIC-382)
          subtitle,
          socialLinks,
          modified,
        );
        if (res.__kind__ === "err") throw new Error(res.err);
      }

      if (stylingDirty) {
        const res2 = await updatePublicationStyling(
          canisterId,
          fontType,
          primaryColor,
          logo,
        );
        if (res2.__kind__ === "err") throw new Error(res2.err);
      }

      await queryClient.invalidateQueries({ queryKey: ["publication-settings", handle] });
      toast.show(copy.toastSaved, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.toastError;
      setSaveError(msg);
      toast.show(copy.toastError, "error");
    } finally {
      setSaving(false);
    }
  }, [
    title,
    subtitle,
    description,
    website,
    namedSocial,
    otherLinks,
    canisterId,
    publication,
    handle,
    headerImage,
    avatar,
    fontType,
    primaryColor,
    logo,
    detailsDirty,
    stylingDirty,
    updatePublicationDetails,
    updatePublicationStyling,
    queryClient,
    toast,
  ]);

  // ── Style helpers ────────────────────────────────────────────────────────────

  // Labels: GT Walsheim 16 / Bold / black · line-height 24px
  // (design-system token --text-label--line-height: calc(24 * var(--fpx))).
  const labelClass =
    "text-[length:calc(16*var(--fpx))] font-bold leading-[calc(24*var(--fpx))] text-ink";

  // Input: 448w, radius 6, border ink-border/10, bg ink/5, 48h.
  const inputClass = [
    "w-full rounded-[calc(6*var(--fpx))]",
    "border border-ink-border/10",
    "px-[calc(16*var(--fpx))] h-[calc(48*var(--fpx))]",
    "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink",
    "bg-ink/5 outline-none",
    "focus:border-brand-purple",
    "transition-colors",
  ].join(" ");

  // Field wrapper: 448-wide, 6px gap between label and input (gap-[calc(6*var(--fpx))]).
  const fieldClass = "flex flex-col gap-[calc(6*var(--fpx))]";

  // Tertiary button: text-brand-purple, hover underline, medium weight.
  // Matches ProfileEditInner's "Remove" treatment (src/routes/Profile.tsx).
  const tertiaryClass =
    "font-medium text-[length:calc(14*var(--fpx))] leading-[calc(20*var(--fpx))] text-brand-purple hover:underline disabled:opacity-50 shrink-0";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-[calc(24*var(--fpx))]">
      {/* Back link + page heading */}
      <div className="flex flex-col gap-2">
        <Link
          to={`/publication/${handle}/manage/articles`}
          className={[
            "text-[length:calc(16*var(--fpx))] font-medium leading-[calc(19*var(--fpx))]",
            "text-brand-purple hover:underline self-start",
          ].join(" ")}
        >
          &lsaquo; {copy.backToArticles}
        </Link>
        <h1 className="text-[length:calc(24*var(--fpx))] font-bold leading-[calc(32*var(--fpx))] text-ink">
          {copy.heading}
        </h1>
        <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink/60">
          {copy.intro}
        </p>
      </div>

      {/* Form — 448px column, 24px gap between field groups */}
      <div className="flex flex-col gap-[calc(24*var(--fpx))] w-[calc(448*var(--fpx))] max-w-full">

        {/* (a) Handle — read-only, styled like a dropdown box */}
        <div className={fieldClass}>
          <label className={labelClass}>{copy.handleHint}</label>
          <div
            className={[
              "flex flex-row items-center justify-between",
              "w-full rounded-[calc(6*var(--fpx))]",
              "border border-ink-border/10",
              "px-[calc(16*var(--fpx))] h-[calc(48*var(--fpx))]",
              "bg-ink/5",
            ].join(" ")}
            aria-readonly="true"
          >
            <span className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink">
              @{handle}{" "}
              <span className="text-ink/60">(fixed)</span>
            </span>
            <span className="text-ink/40" aria-hidden="true">
              <ChevronIcon />
            </span>
          </div>
        </div>

        {/* (b) Publication title */}
        <div className={fieldClass}>
          <label htmlFor="pub-title" className={labelClass}>
            {copy.labelTitle}
          </label>
          <input
            id="pub-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        {/* (c) Subtitle */}
        <div className={fieldClass}>
          <label htmlFor="pub-subtitle" className={labelClass}>
            {copy.labelSubtitle}
          </label>
          <input
            id="pub-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        {/* (d) Description — multiline textarea */}
        <div className={fieldClass}>
          <label htmlFor="pub-description" className={labelClass}>
            {copy.labelDescription}
          </label>
          <textarea
            id="pub-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={[
              "w-full rounded-[calc(6*var(--fpx))]",
              "border border-ink-border/10",
              "px-[calc(16*var(--fpx))] py-[calc(10*var(--fpx))]",
              "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink",
              "bg-ink/5 outline-none resize-none",
              "focus:border-brand-purple",
              "transition-colors",
            ].join(" ")}
          />
        </div>

        {/* (e) Header image — NIC-382 §6.4 (Figma 1:42237 / Frame 815 / 1:42313) */}
        {/* Design: 448×(149|226) column gap 6; dropzone 448×119 radius 16 */}
        <div className={fieldClass}>
          <label className={labelClass}>{copy.labelHeaderImage}</label>
          {headerImage ? (
            /* Filled state: full-width image preview + filename row */
            <>
              <img
                src={headerImage}
                alt=""
                aria-hidden
                className={[
                  "w-full h-[calc(150*var(--fpx))] object-cover",
                  "rounded-[calc(10*var(--fpx))]",
                ].join(" ")}
              />
              {/* Filename + Change / Delete row — Frame 818: gap 6 pad 4/0/4/0 */}
              <div className="flex flex-row items-center gap-[calc(6*var(--fpx))] py-[calc(4*var(--fpx))]">
                <span className="flex-1 truncate text-[length:calc(14*var(--fpx))] leading-[calc(20*var(--fpx))] text-ink/80">
                  {headerImageFileName || copy.currentImage}
                </span>
                <button
                  type="button"
                  disabled={headerImageUploading}
                  onClick={() => headerImageInputRef.current?.click()}
                  className={tertiaryClass}
                >
                  {copy.changeImage}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderImage("");
                    setHeaderImageFileName("");
                    setHeaderImageTooLarge(false);
                  }}
                  className={tertiaryClass}
                >
                  {copy.deleteImage}
                </button>
              </div>
            </>
          ) : (
            /* Empty state: NoImages dropzone (NIC-370 reconcile) */
            <EmptyImageDropzone
              onClick={() => headerImageInputRef.current?.click()}
              onDrop={handleHeaderImageDrop}
              uploading={headerImageUploading}
              ariaLabel={copy.labelHeaderImage}
            />
          )}
          {/* Hidden file input */}
          <input
            ref={headerImageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleHeaderImageSelect}
            aria-label={copy.labelHeaderImage}
          />
          {/* 5 MB too-large error */}
          {headerImageTooLarge && (
            <p className="text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/80">
              {copy.imageTooLarge}
            </p>
          )}
        </div>

        {/* (e2) Avatar — NIC-382 §6.4 (Figma 1:42240 / Frame 816 / 1:42313) */}
        {/* Design: 448×149 column gap 6; circle dropzone 119×119 rounded-full */}
        {/* NOTE: avatar empty state stays as the circular single-icon glyph — unchanged. */}
        <div className={fieldClass}>
          <label className={labelClass}>{copy.labelAvatar}</label>
          {avatar ? (
            /* Filled state: circular avatar thumbnail + filename row — Frame 817: gap 16 */
            <div className="flex flex-row items-center gap-[calc(16*var(--fpx))]">
              <Avatar
                src={avatar}
                label={title || handle}
                sizeClass="size-[calc(119*var(--fpx))] shrink-0"
                textClass="text-[length:calc(40*var(--fpx))]"
                rounded="full"
              />
              <div className="flex flex-col gap-[calc(6*var(--fpx))] min-w-0 flex-1">
                <span className="truncate text-[length:calc(14*var(--fpx))] leading-[calc(20*var(--fpx))] text-ink/80">
                  {avatarFileName || copy.currentImage}
                </span>
                <div className="flex flex-row items-center gap-[calc(6*var(--fpx))]">
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    className={tertiaryClass}
                  >
                    {copy.changeImage}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar("");
                      setAvatarFileName("");
                      setAvatarTooLarge(false);
                    }}
                    className={tertiaryClass}
                  >
                    {copy.deleteImage}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state: circular Add-image button — 119×119 rounded-full (unchanged) */
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleAvatarDrop}
              className={[
                "flex items-center justify-center",
                "size-[calc(119*var(--fpx))]",
                "rounded-full",
                "bg-ink/[0.02] border-2 border-ink/10",
                "cursor-pointer",
              ].join(" ")}
              aria-label={copy.labelAvatar}
            >
              <span className="text-ink/40" aria-hidden>
                <IconImage className="size-[calc(38*var(--fpx))]" />
              </span>
            </button>
          )}
          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarSelect}
            aria-label={copy.labelAvatar}
          />
          {/* 5 MB too-large error */}
          {avatarTooLarge && (
            <p className="text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/80">
              {copy.imageTooLarge}
            </p>
          )}
        </div>

        {/* (e3) Styling group — NIC-370 §6.6 (Figma 1:42221 Styling frame) */}
        {/* Design: 448×453 column gap 24 pt-16 fill #FFFFFF */}
        <div className="flex flex-col gap-[calc(24*var(--fpx))] pt-[calc(16*var(--fpx))]">
          <span className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink">
            Styling
          </span>

          {/* Primary colour */}
          <div className={fieldClass}>
            <label className={labelClass}>{copy.labelPrimaryColor}</label>
            <PrimaryColorPicker value={primaryColor} onChange={setPrimaryColor} />
          </div>

          {/* Publication font */}
          <div className={fieldClass}>
            <label htmlFor="pub-font" className={labelClass}>{copy.labelFont}</label>
            <div className="relative">
              <select
                id="pub-font"
                value={fontType}
                onChange={(e) => setFontType(e.target.value)}
                className={[
                  "w-full appearance-none rounded-[calc(6*var(--fpx))]",
                  "border border-ink-border/10",
                  "px-[calc(16*var(--fpx))] h-[calc(48*var(--fpx))] pr-[calc(40*var(--fpx))]",
                  "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink",
                  "bg-ink/5 outline-none focus:border-brand-purple transition-colors",
                ].join(" ")}
              >
                <option value="">{copy.fontPlaceholder}</option>
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink"
              >
                <IconChevronDown className="size-[calc(14*var(--fpx))]" />
              </span>
            </div>
          </div>

          {/* Publication logo */}
          <div className={fieldClass}>
            <label className={labelClass}>{copy.labelLogo}</label>
            {logo ? (
              <>
                <img
                  src={logo}
                  alt=""
                  aria-hidden
                  className={[
                    "w-full h-[calc(150*var(--fpx))] object-contain",
                    "rounded-[calc(10*var(--fpx))]",
                  ].join(" ")}
                />
                <div className="flex flex-row items-center gap-[calc(6*var(--fpx))] py-[calc(4*var(--fpx))]">
                  <span className="flex-1 truncate text-[length:calc(14*var(--fpx))] leading-[calc(20*var(--fpx))] text-ink/80">
                    {logoFileName || copy.currentImage}
                  </span>
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className={tertiaryClass}
                  >
                    {copy.changeImage}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogo("");
                      setLogoFileName("");
                      setLogoTooLarge(false);
                    }}
                    className={tertiaryClass}
                  >
                    {copy.deleteImage}
                  </button>
                </div>
              </>
            ) : (
              <EmptyImageDropzone
                onClick={() => logoInputRef.current?.click()}
                onDrop={handleLogoDrop}
                uploading={logoUploading}
                ariaLabel={copy.labelLogo}
              />
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoSelect}
              aria-label={copy.labelLogo}
            />
            {logoTooLarge && (
              <p className="text-[length:calc(14*var(--fpx))] font-normal leading-[calc(17*var(--fpx))] text-ink/80">
                {copy.imageTooLarge}
              </p>
            )}
          </div>
        </div>

        {/* (f) Social links */}

        {/* Website */}
        <div className={fieldClass}>
          <label htmlFor="pub-website" className={labelClass}>
            {copy.labelWebsite}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
              <SocialIcon platform="other" className="size-4" />
            </span>
            <input
              id="pub-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={copy.urlPlaceholder}
              className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
            />
          </div>
        </div>

        {/* Link to X */}
        <div className={fieldClass}>
          <label htmlFor="pub-social-x" className={labelClass}>
            {copy.labelX}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
              <SocialIcon platform="x" className="size-4" />
            </span>
            <input
              id="pub-social-x"
              type="url"
              value={namedSocial.x}
              onChange={(e) =>
                setNamedSocial((s) => ({ ...s, x: e.target.value }))
              }
              placeholder={copy.urlPlaceholder}
              className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
            />
          </div>
        </div>

        {/* Link to Distrikt */}
        <div className={fieldClass}>
          <label htmlFor="pub-social-distrikt" className={labelClass}>
            {copy.labelDistrikt}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[calc(16*var(--fpx))] top-1/2 -translate-y-1/2 text-ink/60">
              <SocialIcon platform="distrikt" className="size-4" />
            </span>
            <input
              id="pub-social-distrikt"
              type="url"
              value={namedSocial.distrikt}
              onChange={(e) =>
                setNamedSocial((s) => ({ ...s, distrikt: e.target.value }))
              }
              placeholder={copy.urlPlaceholder}
              className={[inputClass, "pl-[calc(40*var(--fpx))]"].join(" ")}
            />
          </div>
        </div>

        {/* (g) Save row — Figma 1:42309 */}
        <div className="flex flex-row items-center gap-[calc(12*var(--fpx))]">
          <button
            type="button"
            disabled={saving || (!isDirty && !saving)}
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
            {saving ? copy.saving : copy.save}
          </button>
          <Link
            to={`/publication/${handle}`}
            className={[
              "inline-flex items-center justify-center",
              "rounded-[calc(8*var(--fpx))]",
              "px-[calc(24*var(--fpx))] h-[calc(48*var(--fpx))]",
              "text-[length:calc(18*var(--fpx))] font-medium leading-[calc(28*var(--fpx))]",
              "text-brand-purple border border-brand-purple bg-white",
              "transition-opacity hover:opacity-80",
            ].join(" ")}
          >
            {copy.goToPublication}
          </Link>
        </div>

        {/* Inline save error (supplements toast) */}
        {saveError && (
          <p
            role="alert"
            className="text-[length:calc(14*var(--fpx))] text-red-500"
          >
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
