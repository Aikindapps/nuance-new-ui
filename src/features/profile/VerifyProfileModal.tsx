// Verify Profile modal — opened from My Profile page when the user is not yet
// verified. Explains the Decide ID PoH flow and hands off to start().
// Chrome: the shared Popup panel (white card, title, close-X, footer buttons).

import { useState } from "react";
import Button from "@mui/material/Button";
import { Popup } from "../../components/ui/Popup";
import { useModal } from "../../services/modal";
import { useDecideIdVerification } from "./hooks/useDecideIdVerification";
import { primaryButtonSx, secondaryButtonSx } from "../../components/ui/modalButtons";
import { verifyProfileCopy } from "../../constants/copy";

// Stable DOM id wired to Modal service's aria-labelledby on open().
// Follows the PUBLICATION_CHOOSER_TITLE_ID / CONFIRM_DIALOG_TITLE_ID pattern.
export const VERIFY_PROFILE_MODAL_TITLE_ID = "verify-profile-modal-title";

export function VerifyProfileModal() {
  const modal = useModal();
  const { start } = useDecideIdVerification();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    // start() redirects the browser away on success; setLoading(false) only
    // runs if start() returns early (e.g. CLIENT_ID not configured).
    await start();
    setLoading(false);
  };

  return (
    <Popup
      titleId={verifyProfileCopy.modalTitleId}
      title={verifyProfileCopy.modalTitle}
      onClose={() => modal.close()}
      closeAriaLabel={verifyProfileCopy.modalCancel}
      footer={
        <>
          <Button sx={secondaryButtonSx} onClick={() => modal.close()} disabled={loading}>
            {verifyProfileCopy.modalCancel}
          </Button>
          <Button sx={primaryButtonSx} onClick={handleContinue} disabled={loading}>
            {verifyProfileCopy.modalCta}
          </Button>
        </>
      }
    >
      <p className="mt-4 text-body text-ink-80">{verifyProfileCopy.modalBody}</p>
      <p className="mt-2 text-body text-ink-60">{verifyProfileCopy.modalNote}</p>
    </Popup>
  );
}
