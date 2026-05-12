import { useState, type MouseEvent } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar } from "./Avatar";
import { useAuth } from "../../contexts/useAuth";
import { headerCopy } from "../../constants/copy";

// Header logged-in state.
//
// Renders the avatar (fallback to initial-on-gradient — Phase 2's
// useMyProfile is not consumed here yet; that's a future cleanup), a 8×8
// notification dot at the avatar's top-right corner per Figma 1:50117, and a
// dropdown containing Logout. The notification dot is hardcoded visible in
// PR #4 — Notifications canister wiring is on the decision #22 service
// backlog and lands when its first canister consumer arrives.

export function UserMenu() {
  const { principal, logout } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!principal) return null;

  const principalText = principal.toText();
  const open = Boolean(anchor);

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
    } catch {
      // logout failure is rare and non-blocking; the next state read will reflect truth
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label={headerCopy.userMenuAriaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{ p: 0, position: "relative", overflow: "visible" }}
      >
        <Avatar
          src=""
          label={principalText}
          sizeClass="size-10 lg:size-12"
          textClass="text-body"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 size-2 rounded-full bg-notification"
        />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleLogout}>{headerCopy.logout}</MenuItem>
      </Menu>
    </>
  );
}
