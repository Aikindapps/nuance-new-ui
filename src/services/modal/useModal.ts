import { createContext, useContext, type ReactNode } from "react";

// ModalContext + hook + types live in this file so ModalProvider.tsx is a
// pure component file. Satisfies `react-refresh/only-export-components`.

export type ModalOpenOptions = {
  ariaLabelledBy?: string;
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
