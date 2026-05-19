import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Dialog from "@mui/material/Dialog";
import {
  ModalContext,
  type ModalContextValue,
  type ModalOpenOptions,
} from "./useModal";

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
//
// The ModalContext constant + useModal() hook live in ./useModal.ts so this
// file is a pure component file (Fast Refresh).

type ActiveModal = {
  content: ReactNode;
  ariaLabelledBy?: string;
  dismissable: boolean;
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveModal | null>(null);

  const open = useCallback((content: ReactNode, opts?: ModalOpenOptions) => {
    setActive({
      content,
      ariaLabelledBy: opts?.ariaLabelledBy,
      dismissable: opts?.dismissable !== false,
    });
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
        // A non-dismissable modal passes no onClose, so MUI ignores both
        // backdrop clicks and Escape — it can only be closed from a control
        // inside its content.
        onClose={active?.dismissable === false ? undefined : close}
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
