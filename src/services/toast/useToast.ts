import { createContext, useContext } from "react";

// ToastContext + hook + types live in this file so ToastProvider.tsx is a
// pure component file. Satisfies `react-refresh/only-export-components`.
// Mirrors the modal service shape (decision #22).

export type ToastSeverity = "success" | "error";

export type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

export type ToastContextValue = {
  show: (message: string, severity: ToastSeverity, options?: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const v = useContext(ToastContext);
  if (!v) {
    throw new Error("useToast() must be used inside <ToastProvider>");
  }
  return v;
}
