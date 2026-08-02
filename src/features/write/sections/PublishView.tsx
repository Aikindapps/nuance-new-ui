import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import type { PublicationObject } from "../../../candid/User/User";
import { TopicPicker } from "./TopicPicker";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { IconChevronLeft } from "../../../components/ui/icons/IconChevronLeft";

export const PUBLISH_VIEW_TITLE_ID = "publish-view-title";

// §6.2 Publish / Save-as-draft view (Figma nodes 1:41875 / 1:41888 / 1:41907).
// Full-surface overlay (fixed inset-0, bg-white) rendered over the still-
// mounted Lexical editor — editor state is preserved; onBack returns to the
// editor with no canister call. Replaces the old PublishModal (de-modal rework
// per UAT defect NIC-71).
export function PublishView({
  mode,
  initialTagIds,
  publications,
  initialPublicationHandle,
  onBack,
  onConfirm,
  coverPresent,
  onMintPremium,
}: {
  mode: "draft" | "publish";
  initialTagIds: string[];
  publications: PublicationObject[];
  initialPublicationHandle: string | null;
  onBack: () => void;
  onConfirm: (tagIds: string[], publicationHandle: string | null) => Promise<boolean>;
  coverPresent?: boolean;
  onMintPremium?: (tagIds: string[], publicationHandle: string) => void;
}) {
  const c = writeArticleCopy.publish;
  const cp = writeArticleCopy.premium;
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [pubHandle, setPubHandle] = useState<string | null>(initialPublicationHandle);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const selectedPub = publications.find((p) => p.publicationName === pubHandle);
  const premiumEligible =
    mode === "publish" &&
    pubHandle !== null &&
    selectedPub?.isEditor === true &&
    coverPresent === true &&
    onMintPremium != null;

  // Ref wrapping the publish-to field + foldout panel for outside-click close.
  const publishToRef = useRef<HTMLDivElement>(null);
  const listId = "publish-to-listbox";

  // Escape: close foldout first; if already closed, call onBack (close the view).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (open) {
          setOpen(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onBack]);

  // Close foldout on outside mousedown (mirror NotificationsFoldout pattern).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (publishToRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const confirm = async () => {
    if (selected.length < 1 || saving) return;
    setSaving(true);
    const ok = await onConfirm(selected, pubHandle);
    setSaving(false);
    if (ok) onBack();
  };

  const displayLabel = pubHandle ?? c.personalOption;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={PUBLISH_VIEW_TITLE_ID}
      className="fixed inset-0 z-50 overflow-y-auto bg-white"
    >
      {/* Centered 666px column */}
      <div className="mx-auto flex w-full max-w-[calc(666*var(--fpx))] flex-col gap-[calc(32*var(--fpx))] px-6 pb-[calc(80*var(--fpx))] pt-12 lg:px-0 lg:pt-20">

        {/* Title */}
        <h1
          id={PUBLISH_VIEW_TITLE_ID}
          className="text-lg font-bold text-ink"
        >
          {mode === "publish" ? c.titlePublish : c.titleDraft}
        </h1>

        {/* Publish-to dropdown — hidden for personal-only users (NIC-72) */}
        {publications.length > 0 && (
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label className="text-label font-bold text-ink">
              {c.publishToLabel}
            </label>
            {/* Relative wrapper for the foldout */}
            <div className="relative" ref={publishToRef}>
              <button
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => setOpen((o) => !o)}
                className={[
                  "flex h-[calc(48*var(--fpx))] w-full items-center justify-between rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] text-body text-ink-80",
                  open
                    ? "border-2 border-brand-purple bg-brand-purple-5"
                    : "border-2 border-ink-border-10 bg-ink-border-5",
                ].join(" ")}
              >
                <span>{displayLabel}</span>
                <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0 text-ink-80" />
              </button>

              {/* Dark foldout panel (Figma 1:41888 — applied to Publish-to field) */}
              {open && (
                <ul
                  id={listId}
                  role="listbox"
                  className="absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-full rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]"
                >
                  {/* "My profile" option */}
                  <li role="option" aria-selected={pubHandle === null}>
                    <button
                      type="button"
                      onClick={() => { setPubHandle(null); setOpen(false); }}
                      className={[
                        "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                        pubHandle === null
                          ? "bg-brand-purple-fluor-80 font-medium"
                          : "hover:bg-brand-purple-fluor-80",
                      ].join(" ")}
                    >
                      {c.personalOption}
                    </button>
                  </li>
                  {publications.map((pub) => (
                    <li
                      key={pub.publicationName}
                      role="option"
                      aria-selected={pubHandle === pub.publicationName}
                    >
                      <button
                        type="button"
                        onClick={() => { setPubHandle(pub.publicationName); setOpen(false); }}
                        className={[
                          "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                          pubHandle === pub.publicationName
                            ? "bg-brand-purple-fluor-80 font-medium"
                            : "hover:bg-brand-purple-fluor-80",
                        ].join(" ")}
                      >
                        {pub.publicationName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Select category (disabled / gated F-cat / NIC-57) — shown only when a publication is selected (NIC-72) */}
        {pubHandle !== null && (
          <div className="flex flex-col gap-[calc(6*var(--fpx))]">
            <label className="text-label font-bold text-ink">
              {c.categoryLabel}
            </label>
            <div
              role="combobox"
              aria-disabled="true"
              aria-expanded="false"
              aria-label={c.categoryLabel}
              className="flex h-[calc(48*var(--fpx))] w-full cursor-not-allowed select-none items-center justify-between rounded-[calc(6*var(--fpx))] border-2 border-ink-border-10 bg-ink-border-5 px-[calc(16*var(--fpx))] text-body text-ink-60 opacity-50"
            >
              <span>{c.categoryPlaceholder}</span>
              <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0" />
            </div>
            <p className="text-[length:calc(14*var(--fpx))] text-ink-60 mt-[calc(4*var(--fpx))]">
              {c.categoryComingSoon}
            </p>
          </div>
        )}

        {/* Divider — hidden for personal-only users (NIC-72) */}
        {publications.length > 0 && (
          <hr className="w-full border-t border-ink-border/20" />
        )}

        {/* Topics block */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <span className="text-label font-bold text-ink">{c.topicsLabel}</span>
          <p className="text-[length:calc(14*var(--fpx))] text-ink-60 mt-[calc(8*var(--fpx))]">{c.topicsDescription}</p>
          <TopicPicker selected={selected} onChange={setSelected} />
        </div>

        {/* Buttons row */}
        <div className="flex w-full flex-col gap-[calc(12*var(--fpx))] lg:flex-row lg:items-center lg:justify-between">
          <Button
            sx={{ ...secondaryButtonSx, width: { xs: "100%", lg: "auto" } }}
            startIcon={<IconChevronLeft className="size-[calc(24*var(--fpx))]" />}
            onClick={onBack}
          >
            {c.backToArticle}
          </Button>
          <div className="flex flex-col gap-[calc(8*var(--fpx))] lg:flex-row lg:items-center">
            {premiumEligible && (
              <Button
                sx={{ ...secondaryButtonSx, width: { xs: "100%", lg: "auto" } }}
                disabled={selected.length < 1 || saving}
                onClick={() => {
                  if (selected.length >= 1 && pubHandle !== null) {
                    onMintPremium!(selected, pubHandle);
                  }
                }}
              >
                {cp.mintCta}
              </Button>
            )}
            <Button
              sx={{ ...primaryButtonSx, width: { xs: "100%", lg: "auto" } }}
              disabled={selected.length < 1 || saving}
              onClick={confirm}
            >
              {mode === "publish" ? c.publishButton : c.saveDraftButton}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
