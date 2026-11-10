import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "./Popup";
import { useModal } from "../../services/modal";
import { ButtonSpinner } from "./ButtonSpinner";
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
  busyLabel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  closeAriaLabel: string;
  // When set, the confirm button shows a spinner + this label while busy.
  busyLabel?: string;
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
          <Button
            sx={
              busyLabel !== undefined && busy
                ? {
                    ...secondaryButtonSx,
                    "&.Mui-disabled": {
                      color: "var(--color-brand-purple)",
                      border: "1px solid var(--color-brand-purple)",
                      opacity: 0.5,
                    },
                  }
                : secondaryButtonSx
            }
            onClick={() => modal.close()}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button sx={primaryButtonSx} onClick={confirm} disabled={busy}>
            {busyLabel !== undefined && busy ? (
              <span className="inline-flex items-center gap-[calc(8*var(--fpx))]">
                <ButtonSpinner />
                {busyLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    >
      <p className="mt-2 text-body text-ink-80">{body}</p>
    </Popup>
  );
}
