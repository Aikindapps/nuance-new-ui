import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Dialog from "@mui/material/Dialog";

// Programmatic modal service — decision #22 first consumer.
//
// Consumers call useModal().open(<Component />, { ariaLabelledBy }) to
// surface a modal and useModal().close() (or, from inside a modal component,
// the same hook) to dismiss. MUI Dialog provides the portal, backdrop, focus
// trap, escape-key and ARIA behavior; the modal content provides its own
// visual chrome (background, border-radius, shadow, padding) so this service
// stays unopinionated about appearance.
//
// `ariaLabelledBy` should point to the id of the heading inside the modal
// content so screen readers announce a meaningful title when the modal
// opens. Optional but strongly encouraged for every modal.

export type ModalOpenOptions = {
  ariaLabelledBy?: string;
};

export type ModalContextValue = {
  open: (content: ReactNode, opts?: ModalOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

type ActiveModal = { content: ReactNode; ariaLabelledBy?: string };

export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveModal | null>(null);

  const open = useCallback((content: ReactNode, opts?: ModalOpenOptions) => {
    setActive({ content, ariaLabelledBy: opts?.ariaLabelledBy });
  }, []);

  const close = useCallback(() => {
    setActive(null);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ open, close, isOpen: active !== null }),
    [open, close, active],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Dialog
        open={active !== null}
        onClose={close}
        aria-labelledby={active?.ariaLabelledBy}
        slotProps={{
          paper: {
            sx: {
              background: "transparent",
              boxShadow: "none",
              overflow: "visible",
              maxWidth: "unset",
              margin: 0,
            },
          },
        }}
      >
        {active?.content}
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const v = useContext(ModalContext);
  if (!v) {
    throw new Error("useModal() must be used inside <ModalProvider>");
  }
  return v;
}
