import { useCallback, useMemo, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastSeverity,
} from "./useToast";

// Programmatic toast service — decision #22 second consumer (after the
// modal service). PR #8 first consumers: follow / unfollow / like / comment
// mutations.
//
// API is intentionally narrow: `show(message, severity[, options])` displays
// one snackbar at a time. Calling `show` again before the previous toast
// auto-hides simply replaces the message. No queue, no info/warning variants.
// Decision #34 locks this scope; NIC-173 adds optional `actionLabel`/`onAction`
// in a fully backwards-compatible way — existing `show(msg, sev)` callers are
// unaffected.

const AUTO_HIDE_MS = 4000;

type ActiveToast = {
  message: string;
  severity: ToastSeverity;
  actionLabel?: string;
  onAction?: () => void;
  // Bumped on every `show` so MUI Snackbar re-runs its auto-hide timer when
  // a new message replaces an old one mid-display.
  seq: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveToast | null>(null);

  const show = useCallback(
    (message: string, severity: ToastSeverity, options?: ToastOptions) => {
      setActive((prev) => ({
        message,
        severity,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
        seq: (prev?.seq ?? 0) + 1,
      }));
    },
    [],
  );

  const hide = useCallback(() => {
    setActive(null);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

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
            action={
              active.actionLabel && active.onAction ? (
                <>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      active.onAction?.();
                      hide();
                    }}
                    sx={{ fontWeight: 700, textTransform: "none" }}
                  >
                    {active.actionLabel}
                  </Button>
                </>
              ) : undefined
            }
          >
            {active.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}
