import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "../../../components/ui/Popup";
import { useModal } from "../../../services/modal";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import type { PublicationObject } from "../../../candid/User/User";
import { TopicPicker } from "./TopicPicker";

export const PUBLISH_MODAL_TITLE_ID = "publish-modal-title";

// Publish / Save-as-draft settings modal (Figma 6.2 node 1:41875) — manages
// the "Publish to" destination (personal or a publication the user belongs to)
// and the topic picker. The category field is rendered as a disabled
// "coming soon" affordance (gated F-cat / NIC-57 — no canister getter exists).
// Returns chosen tag IDs + publication handle (null = personal) to onConfirm,
// which performs the canister save.
export function PublishModal({
  mode,
  initialTagIds,
  publications,
  initialPublicationHandle,
  onConfirm,
}: {
  mode: "draft" | "publish";
  initialTagIds: string[];
  publications: PublicationObject[];
  initialPublicationHandle: string | null;
  onConfirm: (tagIds: string[], publicationHandle: string | null) => Promise<boolean>;
}) {
  const modal = useModal();
  const c = writeArticleCopy.publish;
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [pubHandle, setPubHandle] = useState<string | null>(initialPublicationHandle);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (selected.length < 1 || saving) return;
    setSaving(true);
    const ok = await onConfirm(selected, pubHandle);
    setSaving(false);
    if (ok) modal.close();
  };

  return (
    <Popup
      titleId={PUBLISH_MODAL_TITLE_ID}
      title={mode === "publish" ? c.titlePublish : c.titleDraft}
      onClose={() => modal.close()}
      closeAriaLabel={c.closeAriaLabel}
      footer={
        <>
          <Button sx={secondaryButtonSx} onClick={() => modal.close()}>
            {c.cancel}
          </Button>
          <Button
            sx={primaryButtonSx}
            disabled={selected.length < 1 || saving}
            onClick={confirm}
          >
            {mode === "publish" ? c.publishButton : c.saveDraftButton}
          </Button>
        </>
      }
    >
      {/* ── Publish to ─────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <label
          htmlFor="publish-to-select"
          className="block text-body font-medium text-ink-80"
        >
          {c.publishToLabel}
        </label>
        <div className="relative mt-2">
          <select
            id="publish-to-select"
            value={pubHandle ?? ""}
            onChange={(e) =>
              setPubHandle(e.target.value === "" ? null : e.target.value)
            }
            className="w-full appearance-none rounded-card border border-ink-border/10 bg-ink-border/5 py-[calc(10*var(--fpx))] pl-[calc(14*var(--fpx))] pr-[calc(40*var(--fpx))] text-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          >
            <option value="">{c.personalOption}</option>
            {publications.map((pub) => (
              <option key={pub.publicationName} value={pub.publicationName}>
                {pub.publicationName}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-[calc(14*var(--fpx))] flex items-center text-ink-60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Select category (disabled / gated F-cat / NIC-57) ──────────────── */}
      <div className="mt-4">
        <label
          htmlFor="category-select-disabled"
          className="block text-body font-medium text-ink-80"
        >
          {c.categoryLabel}
        </label>
        <div className="relative mt-2">
          <div
            id="category-select-disabled"
            aria-disabled="true"
            role="combobox"
            aria-expanded="false"
            aria-label={c.categoryLabel}
            className="flex w-full cursor-not-allowed items-center justify-between rounded-card border border-ink-border/10 bg-ink-border/5 py-[calc(10*var(--fpx))] pl-[calc(14*var(--fpx))] pr-[calc(14*var(--fpx))] text-body text-ink-60 opacity-50 select-none"
          >
            <span>{c.categoryPlaceholder}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-60">{c.categoryComingSoon}</p>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <hr className="mt-4 border-ink-border/10" />

      {/* ── Topics ─────────────────────────────────────────────────────────── */}
      <p className="mt-4 text-body font-medium text-ink-80">{c.topicsLabel}</p>
      <div className="mt-3">
        <TopicPicker selected={selected} onChange={setSelected} />
      </div>
    </Popup>
  );
}
