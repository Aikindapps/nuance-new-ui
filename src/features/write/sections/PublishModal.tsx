import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "../../../components/ui/Popup";
import { useModal } from "../../../services/modal";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import { TopicPicker } from "./TopicPicker";

export const PUBLISH_MODAL_TITLE_ID = "publish-modal-title";

// Publish / Save-as-draft settings modal (Figma 5.6/5.8) — reduced to the
// topic picker for Chunk 7. The publication dropdown and the visibility /
// premium / members-only dropdowns are deferred (publications + Page 7 funds).
// Manages its own topic selection (the Modal service renders content once), and
// returns the chosen tag IDs to the caller via onConfirm, which performs the
// canister save and reports success.
export function PublishModal({
  mode,
  initialTagIds,
  onConfirm,
}: {
  mode: "draft" | "publish";
  initialTagIds: string[];
  onConfirm: (tagIds: string[]) => Promise<boolean>;
}) {
  const modal = useModal();
  const c = writeArticleCopy.publish;
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (selected.length < 1 || saving) return;
    setSaving(true);
    const ok = await onConfirm(selected);
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
      <p className="mt-2 text-body font-medium text-ink-80">{c.topicsLabel}</p>
      <div className="mt-3">
        <TopicPicker selected={selected} onChange={setSelected} />
      </div>
    </Popup>
  );
}
