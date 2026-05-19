import { createContext, useContext, type ReactNode } from "react";

// ModalContext + hook + types live in this file so ModalProvider.tsx is a
// pure component file. Satisfies `react-refresh/only-export-components`.

export type ModalOpenOptions = {
  ariaLabelledBy?: string;
  // When false, the modal cannot be dismissed by Escape or backdrop click —
  // the only way out is a control inside the modal content. Defaults to
  // true. The onboarding modals (decision #30) set this false so every exit
  // path runs the right handler (Cancel = logout, etc.) rather than a bare
  // close that would leave an authed-but-unregistered user in limbo.
  dismissable?: boolean;
};

export type ModalContextValue = {
  open: (content: ReactNode, opts?: ModalOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

export const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const v = useContext(ModalContext);
  if (!v) {
    throw new Error("useModal() must be used inside <ModalProvider>");
  }
  return v;
}
