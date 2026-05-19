import { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import { Popup } from "../../components/ui/Popup";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../components/ui/modalButtons";
import { registerModalCopy } from "../../constants/copy";
import { useRegister } from "./useRegister";

// RegisterModal — Figma node 1:1366 ("Nice to meet you!").
//
// Step one of the onboarding flow (decision #30): a user has authenticated
// but has no Nuance profile. The avatar selector block is omitted — avatar
// upload is deferred. The component is a pure form; the OnboardingGate
// (Phase 4) owns sequencing — `onRegistered` advances to the TopicsModal,
// `onCancel` logs the user out (decision #30: no authed-unregistered limbo).

export const REGISTER_MODAL_TITLE_ID = "register-modal-title";

type RegisterModalProps = {
  // Called after registerUser succeeds — orchestrator opens TopicsModal.
  onRegistered: () => void;
  // Called on Cancel / close-X — orchestrator logs out and closes the modal.
  onCancel: () => void;
};

type FieldProps = {
  id: string;
  label: string;
  note: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

function Field({
  id,
  label,
  note,
  placeholder,
  value,
  onChange,
  autoFocus,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-bold text-ink">
        {label} <span className="font-medium">{note}</span>{" "}
        <span className="font-medium text-brand-purple">*</span>
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-12 w-full rounded-popup border border-ink-border-10 bg-ink-border-5 px-4 text-body text-ink outline-none placeholder:italic placeholder:text-ink-60 focus:border-brand-purple"
      />
    </div>
  );
}

export function RegisterModal({ onRegistered, onCancel }: RegisterModalProps) {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const register = useRegister();

  // Handles are case-insensitive (lowercase reverse index) and stored
  // without the @ — normalize on input. Uniqueness/charset is the
  // canister's call; it returns an err variant we surface inline.
  const onHandleChange = (value: string) =>
    setHandle(value.replace(/^@+/, "").toLowerCase());

  const isValid =
    handle.trim() !== "" && displayName.trim() !== "" && termsAccepted;

  const submit = () => {
    if (!isValid || register.isPending) return;
    register.mutate({ handle, displayName }, { onSuccess: onRegistered });
  };

  return (
    <Popup
      titleId={REGISTER_MODAL_TITLE_ID}
      title={registerModalCopy.heading}
      onClose={onCancel}
      closeAriaLabel={registerModalCopy.closeAriaLabel}
      footer={
        <>
          <Button onClick={onCancel} sx={secondaryButtonSx}>
            {registerModalCopy.cancelLabel}
          </Button>
          <Button
            onClick={submit}
            disabled={!isValid || register.isPending}
            sx={primaryButtonSx}
          >
            {register.isPending
              ? registerModalCopy.submittingLabel
              : registerModalCopy.submitLabel}
          </Button>
        </>
      }
    >
      {/* Subtitle — 28px below header per Figma */}
      <p className="mt-7 text-body text-ink">{registerModalCopy.body}</p>

      {/* Inputs — 48px below subtitle, 32px gap between fields (Figma) */}
      <div className="mt-12 flex flex-col gap-8">
        <Field
          id="register-handle"
          label={registerModalCopy.handleLabel}
          note={registerModalCopy.handleLabelNote}
          placeholder={registerModalCopy.handlePlaceholder}
          value={handle}
          onChange={onHandleChange}
          autoFocus
        />
        <Field
          id="register-display-name"
          label={registerModalCopy.displayNameLabel}
          note={registerModalCopy.displayNameLabelNote}
          placeholder={registerModalCopy.displayNamePlaceholder}
          value={displayName}
          onChange={setDisplayName}
        />

        <label className="flex items-center gap-2">
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            sx={{
              p: 0,
              color: "var(--color-ink-40)",
              "&.Mui-checked": { color: "var(--color-brand-purple)" },
              "& .MuiSvgIcon-root": { fontSize: 20 },
            }}
          />
          <span className="text-body text-ink">
            {registerModalCopy.termsPrefix}
            <a
              href={registerModalCopy.termsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-purple underline"
            >
              {registerModalCopy.termsLinkText}
            </a>{" "}
            <span className="font-medium text-brand-purple">*</span>
          </span>
        </label>
      </div>

      {register.isError && (
        <p role="alert" className="mt-4 text-body text-error">
          {register.error?.message || registerModalCopy.errorFallback}
        </p>
      )}
    </Popup>
  );
}
