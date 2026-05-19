import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "../../components/ui/Popup";
import { SelectableTag } from "../../components/ui/SelectableTag";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../components/ui/modalButtons";
import { topicsModalCopy } from "../../constants/copy";
import { useAllTags } from "./useAllTags";
import { useFollowTags } from "./useFollowTags";

// TopicsModal — Figma node 1:1519 ("What Interests You?").
//
// Step two of the onboarding flow (decision #30). Registration has already
// succeeded by the time this opens, so topics are optional: "Maybe later",
// the close-X, and "Done" with nothing selected all finish onboarding the
// same way. The OnboardingGate (Phase 4) closes the modal via `onComplete`.

export const TOPICS_MODAL_TITLE_ID = "topics-modal-title";

type TopicsModalProps = {
  // Onboarding finished — orchestrator closes the modal. Called after a
  // successful followTags ("Done"), or immediately on skip / empty "Done".
  onComplete: () => void;
};

export function TopicsModal({ onComplete }: TopicsModalProps) {
  const tags = useAllTags();
  const followTags = useFollowTags();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const done = () => {
    if (followTags.isPending) return;
    // Nothing picked — same outcome as "Maybe later".
    if (selected.size === 0) {
      onComplete();
      return;
    }
    followTags.mutate([...selected], { onSuccess: onComplete });
  };

  return (
    <Popup
      titleId={TOPICS_MODAL_TITLE_ID}
      title={topicsModalCopy.heading}
      onClose={onComplete}
      closeAriaLabel={topicsModalCopy.closeAriaLabel}
      footer={
        <>
          <Button onClick={onComplete} sx={secondaryButtonSx}>
            {topicsModalCopy.skipLabel}
          </Button>
          <Button
            onClick={done}
            disabled={followTags.isPending}
            sx={primaryButtonSx}
          >
            {followTags.isPending
              ? topicsModalCopy.submittingLabel
              : topicsModalCopy.submitLabel}
          </Button>
        </>
      }
    >
      {/* Subtitle — 28px below header per Figma */}
      <p className="mt-7 text-body text-ink">{topicsModalCopy.body}</p>

      {/* Tag picker — 48px below subtitle, 16px wrap gap (Figma). Scrolls
          if the platform returns more tags than the popup body fits. The
          cap is viewport-relative on mobile so a long tag list never
          pushes the footer off a short screen (decision #13). */}
      <div className="mt-12 max-h-[45dvh] overflow-y-auto md:max-h-[432px]">
        {tags.isLoading && (
          <p className="text-body text-ink-60">{topicsModalCopy.loading}</p>
        )}
        {tags.isError && (
          <p className="text-body text-ink-60">{topicsModalCopy.loadError}</p>
        )}
        {tags.isSuccess && tags.data.length === 0 && (
          <p className="text-body text-ink-60">{topicsModalCopy.empty}</p>
        )}
        {tags.isSuccess && tags.data.length > 0 && (
          <div
            role="group"
            aria-label={topicsModalCopy.pickerAriaLabel}
            className="flex flex-wrap gap-4"
          >
            {tags.data.map((tag) => (
              <SelectableTag
                key={tag.id}
                label={tag.value}
                selected={selected.has(tag.id)}
                onToggle={() => toggle(tag.id)}
              />
            ))}
          </div>
        )}
      </div>

      {followTags.isError && (
        <p role="alert" className="mt-4 text-body text-error">
          {topicsModalCopy.followError}
        </p>
      )}
    </Popup>
  );
}
