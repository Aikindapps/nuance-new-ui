import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useAuth } from "../../contexts/useAuth";
import { useModal } from "../../services/modal";
import { loginModalCopy } from "../../constants/copy";
import { IconClose } from "../ui/icons/IconClose";
import type { OpenIdProvider } from "@icp-sdk/auth/client";

// DOM id used by the Modal service's aria-labelledby. Exported so the
// open() callers can reference the same constant.
export const LOGIN_MODAL_TITLE_ID = "login-modal-title";

// First consumer of the Modal service (decision #22) and AuthContext.
//
// Pixel-mapped to Figma node 1:50034 ("Popup" frame inside Page 8). The
// popup's NUR/Popup chrome, NUR/Button primary gradient, and NUR/Button/Link
// styling were harvested via get_design_context on 1:50034 on 2026-05-11.
// New tokens added to @theme: --text-title-md, --shadow-purple-glow-medium,
// bg-brand-gradient-button utility.
//
// Sign-in slots map to decision #24's four providers: classic II + Google
// + Apple + Microsoft via II 2.0's OpenID bridge.

const primaryButtonSx = {
  height: 48,
  borderRadius: "var(--radius-card)",
  color: "#ffffff",
  textTransform: "none" as const,
  fontWeight: 500,
  fontSize: "var(--text-body)",
  backgroundImage:
    "linear-gradient(-31.886deg, var(--color-brand-purple-light) 0.643%, var(--color-brand-purple) 59.555%)",
  boxShadow: "var(--shadow-purple-glow-medium)",
  "&:hover": {
    backgroundImage:
      "linear-gradient(-31.886deg, var(--color-brand-purple-light) 0.643%, var(--color-brand-purple) 59.555%)",
    boxShadow: "var(--shadow-purple-glow-medium)",
    opacity: 0.92,
  },
  "&.Mui-disabled": {
    backgroundImage:
      "linear-gradient(-31.886deg, var(--color-brand-purple-light) 0.643%, var(--color-brand-purple) 59.555%)",
    color: "#ffffff",
    opacity: 0.5,
    boxShadow: "var(--shadow-purple-glow-medium)",
  },
};

export function LoginModal() {
  const { login, isLoading, error } = useAuth();
  const modal = useModal();

  const handleLogin = async (provider?: OpenIdProvider) => {
    try {
      await login(provider);
      modal.close();
    } catch {
      // error surfaces via useAuth().error; stay open so the user can retry
    }
  };

  return (
    <div className="w-[696px] max-w-[calc(100vw-32px)] rounded-[24px] bg-white px-6 py-8 md:px-12 md:py-10">
      {/* Header row: title + close (Figma layer "Header" inside NUR / Popup) */}
      <div className="flex items-center justify-between">
        <h2
          id={LOGIN_MODAL_TITLE_ID}
          className="text-title-md font-bold text-ink"
        >
          {loginModalCopy.heading}
        </h2>
        <IconButton
          onClick={modal.close}
          aria-label={loginModalCopy.closeAriaLabel}
          sx={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-card)",
            color: "var(--color-brand-purple)",
            "&:hover": { backgroundColor: "rgba(84, 5, 212, 0.08)" },
          }}
        >
          <IconClose className="size-6" />
        </IconButton>
      </div>

      {/* Body — 28px below header per Figma (y=116 in popup, content top y=88) */}
      <p className="mt-7 text-body text-ink">{loginModalCopy.body}</p>

      {/* Buttons stack — 74px below body per Figma (y=246 in popup) */}
      <div className="mx-auto mt-[74px] flex w-[359px] max-w-full flex-col gap-6">
        <Button
          fullWidth
          onClick={() => handleLogin()}
          disabled={isLoading}
          sx={primaryButtonSx}
        >
          {loginModalCopy.iiLabel}
        </Button>
        <Button
          fullWidth
          onClick={() => handleLogin("google")}
          disabled={isLoading}
          sx={primaryButtonSx}
        >
          {loginModalCopy.googleLabel}
        </Button>
        <Button
          fullWidth
          onClick={() => handleLogin("apple")}
          disabled={isLoading}
          sx={primaryButtonSx}
        >
          {loginModalCopy.appleLabel}
        </Button>
        <Button
          fullWidth
          onClick={() => handleLogin("microsoft")}
          disabled={isLoading}
          sx={primaryButtonSx}
        >
          {loginModalCopy.microsoftLabel}
        </Button>
        <a
          href={loginModalCopy.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-body font-medium text-brand-purple"
        >
          {loginModalCopy.helpLabel}
        </a>
      </div>

      {error && (
        <p role="alert" className="mt-6 text-center text-body text-error">
          {error}
        </p>
      )}
    </div>
  );
}
