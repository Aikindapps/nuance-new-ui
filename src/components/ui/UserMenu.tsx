import { useState, type MouseEvent } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar } from "./Avatar";
import { useAuth } from "../../contexts/useAuth";
import { headerCopy } from "../../constants/copy";

// Header logged-in state — minimum viable per PR #3 scope.
//
// Renders the avatar (fallback to initial-on-gradient since we don't fetch
// the User canister profile until PR #4) and a dropdown containing Logout.
// Notification dot, "Manage account", and other dropdown items land in PR #4
// alongside the rest of the logged-in chrome.

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
        sx={{ p: 0 }}
      >
        <Avatar
          src=""
          label={principalText}
          sizeClass="size-10 lg:size-12"
          textClass="text-body"
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
