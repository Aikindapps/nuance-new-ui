import { useCallback, useMemo, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import {
  ToastContext,
  type ToastContextValue,
  type ToastSeverity,
} from "./useToast";

// Programmatic toast service — decision #22 second consumer (after the
// modal service). PR #8 first consumers: follow / unfollow / like / comment
// mutations.
//
// API is intentionally narrow: `show(message, severity)` displays one
// snackbar at a time. Calling `show` again before the previous toast
// auto-hides simply replaces the message. No queue, no action button, no
// info/warning variants — keep minimal until a real consumer needs more.
// Decision #34 locks this scope.

const AUTO_HIDE_MS = 4000;

type ActiveToast = {
  message: string;
  severity: ToastSeverity;
  // Bumped on every `show` so MUI Snackbar re-runs its auto-hide timer when
  // a new message replaces an old one mid-display.
  seq: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveToast | null>(null);

  const show = useCallback((message: string, severity: ToastSeverity) => {
    setActive((prev) => ({
      message,
      severity,
      seq: (prev?.seq ?? 0) + 1,
    }));
  }, []);

  const hide = useCallback(() => {
    setActive(null);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ show, hide }),
    [show, hide],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={active?.seq ?? 0}
        open={active !== null}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={(_, reason) => {
          // Ignore click-away — only auto-timeout + the explicit Alert close
          // dismiss the toast. Click-away would dismiss while the user is
          // mid-click on the Alert button.
          if (reason === "clickaway") return;
          hide();
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {active ? (
          <Alert
            severity={active.severity}
            variant="filled"
            onClose={hide}
            sx={{ minWidth: "280px" }}
          >
            {active.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}
