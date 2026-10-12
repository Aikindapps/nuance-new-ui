import { useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import { IconClose } from "../../components/ui/icons/IconClose";
import {
  PURPLE_GRADIENT,
  primaryButtonSx,
  secondaryButtonSx,
} from "../../components/ui/modalButtons";
import { registerModalCopy, imageUploadCopy } from "../../constants/copy";
import { AvatarPlaceholderGlyph } from "./AvatarPicker";
import { registerSheetCopy as sc } from "./registerSheetCopy";

// Phone-only full-screen sheet for the Create Account "Register"
// step (Figma 2090:2885 empty / 2091:2900 filled / 2092:2919 error /
// 2093:2934 loading). Rendered by RegisterModal below the 1024px
// seam, inside the modal service's non-dismissable Dialog -- it owns
// no scrim, focus trap or Escape handling, no form state, no
// validation and no mutation. It is purely presentational: the
// parent passes values, error messages and callbacks.
//
// Layout: header + form scroll together (so a short screen or an
// open keyboard can still reach every field); the footer is pinned.
// After a Create account tap, and when a request comes back with an
// error, the first field message is scrolled into view so it is never
// left below the fold.

const c = registerModalCopy;

const HANDLE_ERROR_ID = "register-sheet-handle-error";
const DISPLAY_NAME_ERROR_ID = "register-sheet-display-name-error";
const TERMS_ERROR_ID = "register-sheet-terms-error";

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function revealFirstAlert(root: HTMLElement | null) {
  root
    ?.querySelector("[role=alert]")
    ?.scrollIntoView({ block: "nearest" });
}

function BusySpinner() {
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
        strokeOpacity="0.3"
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

// Inline field message -- Figma: Inter 400 16/24 Purple/100, 6 below
// the label and 6 above the input box (or below the consent row).
function FieldMessage({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} role="alert" className="text-label text-brand-purple">
      {text}
    </p>
  );
}

type SheetFieldProps = {
  id: string;
  label: string;
  note: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  error: string | null;
  errorId: string;
};

// Same label/box treatment as the desktop Field in RegisterModal;
// the error message sits between the label and the box and the box
// outline turns Purple/100 (frame 2092:2919).
function SheetField({
  id,
  label,
  note,
  placeholder,
  value,
  onChange,
  prefix,
  error,
  errorId,
}: SheetFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-bold text-ink">
        {label} <span className="font-medium">{note}</span>{" "}
        <span className="font-medium text-brand-purple">*</span>
      </label>
      {error && <FieldMessage id={errorId} text={error} />}
      <div
        className={
          "flex h-12 items-center gap-1 rounded-popup border " +
          "bg-ink-border-5 px-4 " +
          (error
            ? "border-brand-purple"
            : "border-ink-border-10 focus-within:border-brand-purple")
        }
      >
        {prefix && (
          <span className="text-body text-ink-60" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={
            "h-full w-full bg-transparent text-body text-ink outline-none " +
            "placeholder:italic placeholder:text-ink-60"
          }
        />
      </div>
    </div>
  );
}

type RegisterSheetProps = {
  titleId: string;
  handle: string;
  onHandleChange: (value: string) => void;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  avatarPreview: string | null;
  // The picked file's own name and size (before cropping).
  avatarFileName: string | null;
  avatarFileSize: number | null;
  avatarCantOpen: boolean;
  onSelectAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
  handleError: string | null;
  displayNameError: string | null;
  termsError: string | null;
  formError: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function RegisterSheet({
  titleId,
  handle,
  onHandleChange,
  displayName,
  onDisplayNameChange,
  termsAccepted,
  onTermsChange,
  avatarPreview,
  avatarFileName,
  avatarFileSize,
  avatarCantOpen,
  onSelectAvatar,
  onRemoveAvatar,
  handleError,
  displayNameError,
  termsError,
  formError,
  isSubmitting,
  onCancel,
  onSubmit,
}: RegisterSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasSubmittingRef = useRef(isSubmitting);
  const openPicker = () => inputRef.current?.click();

  useEffect(() => {
    if (wasSubmittingRef.current && !isSubmitting) {
      revealFirstAlert(scrollRef.current);
    }
    wasSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const handleSubmit = () => {
    onSubmit();
    requestAnimationFrame(() => revealFirstAlert(scrollRef.current));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file fires onChange again.
    e.target.value = "";
    if (file && file.type.startsWith("image/")) onSelectAvatar(file);
  };

  const tertiaryClass =
    "flex h-[calc(32*var(--fpx))] items-center rounded-[calc(4*var(--fpx))] " +
    "px-[calc(16*var(--fpx))] text-label font-medium text-brand-purple " +
    "hover:bg-brand-purple-5 focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-brand-purple";

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div
        ref={scrollRef}
        className={
          "min-h-0 flex-1 overflow-y-auto px-[calc(24*var(--fpx))] " +
          "pt-[calc(24*var(--fpx))]"
        }
      >
        {/* Close on its own row; title below it (frames 2090:2885 ff.) */}
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={c.closeAriaLabel}
            onClick={onCancel}
            className={
              "flex size-8 items-center justify-center text-brand-purple"
            }
          >
            <IconClose className="size-6" />
          </button>
        </div>
        <h2
          id={titleId}
          className="mt-[calc(16*var(--fpx))] text-title-md font-bold text-ink"
        >
          {c.heading}
        </h2>
        <p className="mt-[calc(12*var(--fpx))] text-body text-ink">{c.body}</p>

        {/* Content column -- Figma 345 wide, column gap 32 */}
        <div className="mt-[calc(24*var(--fpx))] flex flex-col gap-8">
          {/* Avatar block -- label, 12, circle (or photo + details) */}
          <div className="flex flex-col gap-[calc(12*var(--fpx))]">
            <span className="text-label font-bold text-ink">
              {c.avatarSectionLabel}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openPicker}
                aria-label={avatarPreview ? c.avatarChangeLabel : c.avatarAddLabel}
                className={
                  "size-[calc(119*var(--fpx))] shrink-0 overflow-hidden " +
                  "rounded-full " +
                  (avatarPreview
                    ? ""
                    : "border-2 border-ink-border-10 bg-[rgba(55,58,73,0.02)] ") +
                  "focus-visible:outline focus-visible:outline-2 " +
                  "focus-visible:outline-brand-purple"
                }
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={c.avatarAlt}
                    className="size-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-full items-center justify-center"
                  >
                    <AvatarPlaceholderGlyph className="size-[calc(38*var(--fpx))]" />
                  </span>
                )}
              </button>
              {avatarPreview && (
                <div className="flex min-w-0 flex-1 flex-col gap-[calc(12*var(--fpx))]">
                  {avatarFileName && (
                    <p className="flex min-w-0 text-label font-medium text-ink-60">
                      <span className="truncate">{avatarFileName}</span>
                      {avatarFileSize !== null && (
                        <span className="shrink-0 whitespace-pre">
                          {` (${formatFileSize(avatarFileSize)})`}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openPicker}
                      className={tertiaryClass}
                    >
                      {c.avatarChangeLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onRemoveAvatar}
                      className={tertiaryClass}
                    >
                      {sc.avatarDeleteLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {avatarCantOpen && (
              <p role="alert" className="text-body text-error">
                {imageUploadCopy.cantOpen}
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <SheetField
            id="register-handle"
            label={c.handleLabel}
            note={c.handleLabelNote}
            placeholder={c.handlePlaceholder}
            value={handle}
            onChange={onHandleChange}
            prefix="@"
            error={handleError}
            errorId={HANDLE_ERROR_ID}
          />
          <SheetField
            id="register-display-name"
            label={c.displayNameLabel}
            note={c.displayNameLabelNote}
            placeholder={c.displayNamePlaceholder}
            value={displayName}
            onChange={onDisplayNameChange}
            error={displayNameError}
            errorId={DISPLAY_NAME_ERROR_ID}
          />

          {/* Consent -- row gap 8 (24 checkbox box), message 6 below */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => onTermsChange(e.target.checked)}
                icon={
                  <span
                    className={
                      "block size-[calc(16*var(--fpx))] " +
                      "rounded-[calc(3*var(--fpx))] border border-ink-40 bg-white"
                    }
                  />
                }
                checkedIcon={
                  <span
                    className={
                      "flex size-[calc(16*var(--fpx))] items-center " +
                      "justify-center rounded-[calc(3*var(--fpx))] bg-brand-purple"
                    }
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="size-full">
                      <path
                        d="M5 8.2l2 2 4-4.4"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                }
                slotProps={{
                  input: {
                    "aria-invalid": termsError ? true : undefined,
                    "aria-describedby": termsError ? TERMS_ERROR_ID : undefined,
                  },
                }}
                sx={{ p: "calc(4*var(--fpx))" }}
              />
              <span className="text-body leading-[calc(24*var(--fpx))] text-ink">
                {c.termsPrefix}
                <a
                  href={c.termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-purple underline"
                >
                  {c.termsLinkText}
                </a>{" "}
                <span className="font-medium text-brand-purple">*</span>
              </span>
            </label>
            {termsError && <FieldMessage id={TERMS_ERROR_ID} text={termsError} />}
          </div>
        </div>
      </div>

      {/* Footer -- pinned; Cancel over Create account, gap 12, 24 below */}
      <div
        className={
          "shrink-0 px-[calc(24*var(--fpx))] " +
          "pb-[calc(24*var(--fpx))] pt-[calc(16*var(--fpx))]"
        }
      >
        {formError && (
          <p
            role="alert"
            className="mb-[calc(12*var(--fpx))] text-body text-error"
          >
            {formError}
          </p>
        )}
        <div className="flex flex-col gap-[calc(12*var(--fpx))]">
          <Button
            onClick={onCancel}
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
            {c.cancelLabel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              ...primaryButtonSx,
              "&.Mui-disabled": {
                backgroundImage: PURPLE_GRADIENT,
                color: "#ffffff",
                opacity: 0.4,
                boxShadow: "var(--shadow-purple-glow-medium)",
              },
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <BusySpinner />
                {c.submittingLabel}
              </span>
            ) : (
              c.submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
