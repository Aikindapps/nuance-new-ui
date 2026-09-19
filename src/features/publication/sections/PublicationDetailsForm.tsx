// NIC-381 §6.4 — Publication details form (text + social link fields).
//
// Mirrors ProfileEditInner in src/routes/Profile.tsx:
//   - State seeded once at mount; no re-seed effect.
//   - isDirty guard; disabled save while not dirty or while saving.
//   - Social-link passthrough: named platforms are ONLY "x" and "distrikt".
//     Any other stored URLs are round-tripped verbatim (otherLinks) so
//     linkedin / reddit / custom URLs are never silently dropped on save.
//
// Excluded from this card (NIC-382):
//   - Header image and avatar uploaders.
//
// Design ref: Figma 1:42221 / 1:42313 / 1:42309.
// Form container: 448-wide column, 24px vertical gaps, labels GT Walsheim
// 16 / Bold / black / 100% line-height.
// Inputs: radius 6 (rounded-[calc(6*var(--fpx))]), border ink-border/10.

import { useState, useCallback } from "react";
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
import { publicationSettingsCopy as copy } from "../../../constants/copy";

// The two named social platforms this form exposes as labelled inputs.
// All other detected platforms are carried through untouched (otherLinks).
const PUB_SOCIAL_PLATFORMS = ["x", "distrikt"] as const;
type PubSocialPlatform = (typeof PUB_SOCIAL_PLATFORMS)[number];

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

export function PublicationDetailsForm({ handle, canisterId, publication }: Props) {
  const { updatePublicationDetails } = useActors();
  const queryClient = useQueryClient();
  const toast = useToast();

  // ── Seed values (synchronous — component mounts only when publication is set) ──

  const seedTitle = publication.publicationTitle;
  const seedSubtitle = publication.subtitle;
  const seedDescription = publication.description;
  const seedWebsite = publication.socialLinks.website;

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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Dirty guard ─────────────────────────────────────────────────────────────

  const isDirty =
    title !== seedTitle ||
    subtitle !== seedSubtitle ||
    description !== seedDescription ||
    website !== seedWebsite ||
    JSON.stringify(namedSocial) !== JSON.stringify(seedNamedSocial());

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

      const res = await updatePublicationDetails(
        canisterId,
        description,
        title,
        publication.headerImage,   // round-tripped unchanged
        publication.categories,    // round-tripped unchanged
        publication.writers,       // round-tripped unchanged
        publication.editors,       // round-tripped unchanged
        publication.avatar,        // round-tripped unchanged
        subtitle,
        socialLinks,
        modified,
      );

      if (res.__kind__ === "err") throw new Error(res.err);

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
    updatePublicationDetails,
    queryClient,
    toast,
  ]);

  // ── Style helpers ────────────────────────────────────────────────────────────

  // Labels: GT Walsheim 16 / Bold / black / 100% line-height (Figma spec).
  const labelClass =
    "text-[length:calc(16*var(--fpx))] font-bold leading-[calc(16*var(--fpx))] text-ink";

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

  // Field wrapper: 448-wide, 24px gap between label and input (gap-[calc(6*var(--fpx))]).
  const fieldClass = "flex flex-col gap-[calc(6*var(--fpx))]";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-[calc(40*var(--fpx))]">
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
          {copy.title}
        </h1>
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

        {/* (e) NIC-382: header image + avatar rows — NOT built in this card.
              Image uploaders land in NIC-382 (split 3/3). */}

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
