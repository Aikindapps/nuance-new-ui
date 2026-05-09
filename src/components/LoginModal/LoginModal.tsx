import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useAuth } from "../../contexts/AuthContext";
import { useModal } from "../../services/modal";
import { loginModalCopy } from "../../constants/copy";
import type { OpenIdProvider } from "@icp-sdk/auth/client";

// First consumer of the Modal service (decision #22) and AuthContext.
//
// Maps to Figma node 1:50034 ("Popup" frame inside Page 8). The Figma popup
// has 4 primary-button slots which match the 4 sign-in paths from
// decision #24 (II + Google + Apple + Microsoft).
//
// The modal closes on its own once login() resolves successfully. Errors are
// surfaced via useAuth().error and rendered inline; the user can retry.

export function LoginModal() {
  const { login, isLoading, error } = useAuth();
  const modal = useModal();

  const handleLogin = async (provider?: OpenIdProvider) => {
    try {
      await login(provider);
      modal.close();
    } catch {
      // error state surfaces via useAuth().error; stay open so user can retry
    }
  };

  return (
    <div className="w-[696px] max-w-[calc(100vw-32px)] rounded-[24px] bg-white p-8 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] md:p-12">
      <h2 className="text-title-lg font-bold text-ink">{loginModalCopy.heading}</h2>
      <p className="mt-3 text-body text-ink-80">{loginModalCopy.body}</p>

      <Stack spacing={1.5} sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => handleLogin()}
          disabled={isLoading}
          sx={{ height: 48, borderRadius: "var(--radius-card)" }}
        >
          {loginModalCopy.iiLabel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => handleLogin("google")}
          disabled={isLoading}
          sx={{ height: 48, borderRadius: "var(--radius-card)" }}
        >
          {loginModalCopy.googleLabel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => handleLogin("apple")}
          disabled={isLoading}
          sx={{ height: 48, borderRadius: "var(--radius-card)" }}
        >
          {loginModalCopy.appleLabel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => handleLogin("microsoft")}
          disabled={isLoading}
          sx={{ height: 48, borderRadius: "var(--radius-card)" }}
        >
          {loginModalCopy.microsoftLabel}
        </Button>
      </Stack>

      <Button
        variant="text"
        color="primary"
        fullWidth
        onClick={modal.close}
        disabled={isLoading}
        sx={{ mt: 2, height: 28 }}
      >
        {loginModalCopy.cancelLabel}
      </Button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-center text-body"
          style={{ color: "#c62828" }}
        >
          {error || loginModalCopy.errorFallback}
        </p>
      )}
    </div>
  );
}
