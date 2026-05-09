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
// Consumers call useModal().open(<Component />) to surface a modal and
// useModal().close() (or, from inside a modal component, the same hook) to
// dismiss. MUI Dialog provides the portal, backdrop, focus trap, escape-key
// and ARIA behavior; the modal content provides its own visual chrome
// (background, border-radius, shadow, padding) so this service stays
// unopinionated about appearance.

export type ModalContextValue = {
  open: (content: ReactNode) => void;
  close: () => void;
  isOpen: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);

  const open = useCallback((next: ReactNode) => {
    setContent(next);
  }, []);

  const close = useCallback(() => {
    setContent(null);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ open, close, isOpen: content !== null }),
    [open, close, content],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Dialog
        open={content !== null}
        onClose={close}
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
        {content}
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
