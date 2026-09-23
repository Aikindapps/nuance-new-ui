import { useState } from "react";
import Button from "@mui/material/Button";
import type { TagModel } from "../../candid/PostCore/PostCore";
import { SelectableTag } from "../../components/ui/SelectableTag";
import { IconClose } from "../../components/ui/icons/IconClose";
import {
  PURPLE_GRADIENT,
  primaryButtonSx,
  secondaryButtonSx,
} from "../../components/ui/modalButtons";
import { topicsModalCopy } from "../../constants/copy";
import {
  MIN_TOPICS,
  topicsSheetCopy as sc,
} from "./topicsSheetCopy";

// Phone-only full-screen sheet for the "What Interests You?" topics
// step (Figma 2410:3371 / 2415:3087 / 2417:3151 / 2418:3215).
// Rendered by TopicsModal below the 1024px seam, inside the modal
// service's Dialog -- it owns no queries and no mutation. It is
// purely presentational; the parent owns selection + submit state.

function DoneSpinner() {
  return (
    <svg
      className="size-[calc(18*var(--fpx))] animate-spin"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="44"
        strokeDashoffset="30"
      />
    </svg>
  );
}

type TopicsSheetProps = {
  titleId: string;
  tags: TagModel[];
  tagsLoading: boolean;
  tagsError: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSkip: () => void;
  onDone: () => void;
  isSubmitting: boolean;
  submitError: boolean;
};

export function TopicsSheet({
  titleId,
  tags,
  tagsLoading,
  tagsError,
  selected,
  onToggle,
  onSkip,
  onDone,
  isSubmitting,
  submitError,
}: TopicsSheetProps) {
  const [attempted, setAttempted] = useState(false);

  const count = selected.size;
  const meetsMin = count >= MIN_TOPICS;
  const showValidation = attempted && !meetsMin;
  const doneDisabled = count === 0 || isSubmitting;
  const doneHasGlow = count > 0 && !isSubmitting;

  const handleToggle = (id: string) => {
    setAttempted(false);
    onToggle(id);
  };

  const handleDone = () => {
    if (isSubmitting) return;
    if (!meetsMin) {
      setAttempted(true);
      return;
    }
    onDone();
  };

  let helperText: string;
  let helperClass: string;
  if (showValidation) {
    helperText = sc.validationMin;
    helperClass = "text-brand-purple";
  } else if (count === 0) {
    helperText = sc.helperMin;
    helperClass = "text-ink-60";
  } else if (count === 1) {
    helperText = sc.helperCountOne;
    helperClass = "text-ink-60";
  } else {
    helperText = sc.helperCountMany.replace("{n}", String(count));
    helperClass = "text-ink-60";
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div
        className={
          "relative shrink-0 px-[calc(24*var(--fpx))] " +
          "pt-[calc(24*var(--fpx))]"
        }
      >
        <button
          type="button"
          aria-label={topicsModalCopy.closeAriaLabel}
          disabled={isSubmitting}
          onClick={onSkip}
          className={
            "absolute right-[calc(24*var(--fpx))] " +
            "top-[calc(24*var(--fpx))] flex size-8 " +
            "items-center justify-center text-brand-purple " +
            "disabled:opacity-40"
          }
        >
          <IconClose className="size-6" />
        </button>
        <h2
          id={titleId}
          className={
            "pr-[calc(40*var(--fpx))] text-title-md font-bold text-ink"
          }
        >
          {topicsModalCopy.heading}
        </h2>
        <p className="mt-[calc(12*var(--fpx))] text-body text-ink">
          {topicsModalCopy.body}
        </p>
        <p
          className={
            "mt-[calc(12*var(--fpx))] text-label " + helperClass
          }
        >
          {helperText}
        </p>
      </div>

      <div
        className={
          "mt-[calc(16*var(--fpx))] flex-1 overflow-y-auto " +
          "px-[calc(24*var(--fpx))]"
        }
      >
        {tagsLoading && (
          <p className="text-body text-ink-60">
            {topicsModalCopy.loading}
          </p>
        )}
        {tagsError && (
          <p className="text-body text-ink-60">
            {topicsModalCopy.loadError}
          </p>
        )}
        {!tagsLoading && !tagsError && tags.length === 0 && (
          <p className="text-body text-ink-60">
            {topicsModalCopy.empty}
          </p>
        )}
        {!tagsLoading && !tagsError && tags.length > 0 && (
          <div
            role="group"
            aria-label={topicsModalCopy.pickerAriaLabel}
            className="flex flex-wrap gap-4 pb-[calc(24*var(--fpx))]"
          >
            {tags.map((tag) => (
              <SelectableTag
                key={tag.id}
                label={tag.value}
                selected={selected.has(tag.id)}
                onToggle={() => handleToggle(tag.id)}
                disabled={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={
          "shrink-0 px-[calc(24*var(--fpx))] " +
          "pb-[calc(24*var(--fpx))] pt-[calc(16*var(--fpx))]"
        }
      >
        {submitError && (
          <p
            role="alert"
            className="mb-[calc(12*var(--fpx))] text-body text-error"
          >
            {topicsModalCopy.followError}
          </p>
        )}
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <Button
            onClick={onSkip}
            disabled={isSubmitting}
            sx={{
              ...secondaryButtonSx,
              "&.Mui-disabled": {
                opacity: 0.4,
                color: "var(--color-brand-purple)",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-brand-purple)",
              },
            }}
          >
            {topicsModalCopy.skipLabel}
          </Button>
          <Button
            onClick={handleDone}
            disabled={doneDisabled}
            sx={{
              ...primaryButtonSx,
              boxShadow: doneHasGlow
                ? "var(--shadow-purple-glow-medium)"
                : "none",
              "&.Mui-disabled": {
                backgroundImage: PURPLE_GRADIENT,
                color: "#ffffff",
                opacity: 0.4,
                boxShadow: "none",
              },
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <DoneSpinner />
                {sc.busyLabel}
              </span>
            ) : (
              topicsModalCopy.submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
