import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar } from "./Avatar";
import { useAuth } from "../../contexts/useAuth";
import { headerCopy } from "../../constants/copy";
import { useMyPublicationsEntry } from "../../lib/useMyPublicationsEntry";

// Header logged-in state.
//
// Renders the avatar (fallback to initial-on-gradient — Phase 2's
// useMyProfile is not consumed here yet; that's a future cleanup) and a
// dropdown containing Logout. The notification dot moved to the bell
// button in HeaderLoggedIn during Phase 8's Figma fidelity pass; it lives
// on the bell, not the avatar (Figma 1:50117 sits over the bell, not
// the profile avatar).

export function UserMenu() {
  const { principal, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { show: showPubs, firstPubHandle } = useMyPublicationsEntry();

  if (!principal) return null;

  const principalText = principal.toText();
  const open = Boolean(anchor);

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  const handleMyArticles = () => {
    handleClose();
    navigate("/my-articles");
  };

  const handleFollowing = () => {
    handleClose();
    navigate("/following/manage");
  };

  const handlePublications = () => {
    if (!firstPubHandle) return;
    handleClose();
    navigate(`/publication/${firstPubHandle}/manage/articles`);
  };

  const handleWallet = () => {
    handleClose();
    navigate("/wallet");
  };

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
        <MenuItem onClick={handleMyArticles}>{headerCopy.myArticles}</MenuItem>
        <MenuItem onClick={handleFollowing}>{headerCopy.following}</MenuItem>
        {showPubs && firstPubHandle && (
          <MenuItem onClick={handlePublications}>{headerCopy.publications}</MenuItem>
        )}
        <MenuItem onClick={handleWallet}>{headerCopy.wallet}</MenuItem>
        <MenuItem onClick={handleLogout}>{headerCopy.logout}</MenuItem>
      </Menu>
    </>
  );
}
