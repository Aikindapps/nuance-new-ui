import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "./Popup";
import { useModal } from "../../services/modal";
import { primaryButtonSx, secondaryButtonSx } from "./modalButtons";

export const CONFIRM_DIALOG_TITLE_ID = "confirm-dialog-title";

// Generic confirm dialog over the Modal service. `onConfirm` runs async; the
// dialog shows a busy state and closes itself on success. If onConfirm throws,
// the dialog stays open (the consumer toasts the error).
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  closeAriaLabel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  closeAriaLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const modal = useModal();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      modal.close();
    } catch {
      // consumer toasts; keep the dialog open
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popup
      titleId={CONFIRM_DIALOG_TITLE_ID}
      title={title}
      onClose={() => modal.close()}
      closeAriaLabel={closeAriaLabel}
      footer={
        <>
          <Button sx={secondaryButtonSx} onClick={() => modal.close()} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button sx={primaryButtonSx} onClick={confirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="mt-2 text-body text-ink-80">{body}</p>
    </Popup>
  );
}
