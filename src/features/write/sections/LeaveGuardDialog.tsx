import Button from "@mui/material/Button";
import { Popup } from "../../../components/ui/Popup";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";

export const LEAVE_GUARD_TITLE_ID = "leave-guard-title";

// Back-button dirty guard (Mr Nick, 2026-05-22): leaving the editor with
// unsaved changes prompts to Save as draft. The close-X / backdrop = Cancel
// (stay). "Leave without saving" discards (clears the local autosave too).
export function LeaveGuardDialog({
  onSaveDraft,
  onLeave,
  onCancel,
  saving,
  saveLabel,
}: {
  onSaveDraft: () => void;
  onLeave: () => void;
  onCancel: () => void;
  saving: boolean;
  // "Save as draft" (new/draft) or "Save changes" (editing a published post).
  saveLabel: string;
}) {
  const c = writeArticleCopy.leaveGuard;
  return (
    <Popup
      titleId={LEAVE_GUARD_TITLE_ID}
      title={c.title}
      onClose={onCancel}
      closeAriaLabel={c.closeAriaLabel}
      footer={
        <>
          <Button sx={secondaryButtonSx} onClick={onLeave} disabled={saving}>
            {c.leave}
          </Button>
          <Button sx={primaryButtonSx} onClick={onSaveDraft} disabled={saving}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <p className="mt-2 text-body text-ink-80">{c.body}</p>
    </Popup>
  );
}
