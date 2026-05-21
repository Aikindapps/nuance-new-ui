import { Link } from "react-router-dom";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import { FollowButton } from "../../../components/ui/FollowButton/FollowButton";
import { formatCount } from "../../../lib/formatCount";
import type { UserListItem } from "../../../candid/User/User";

// Publication hover card — Figma §4.9 (`1:20286`).
//
// Anchored to the publication name in the Breadcrumb. Dark `#202123` card
// (same colour as `WelcomeBanner`) with the publication's identity and a
// Follow button. The trigger states the Figma file draws are
//   - Hover author name → Tooltip appears
//   - Hover follow button → Follow gradient highlights
//   - Unfollow on hover → Following swaps to Unfollow
// All three are owned by `FollowButton`'s existing state machine — no
// duplicate logic here.
//
// `onMouseEnter` / `onMouseLeave` are forwarded by the Breadcrumb's trigger
// logic so the popover stays open while the cursor is on EITHER the
// trigger or the card; without that the cursor crossing the gap between
// link and card flickers the popover closed.

type Props = {
  publication: UserListItem;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function PublicationPopover({
  publication,
  anchorEl,
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      modifiers={[{ name: "offset", options: { offset: [0, 12] } }]}
      sx={{ zIndex: 60 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <div
          role="dialog"
          aria-label={`${publication.displayName} publication card`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="flex w-[calc(304*var(--fpx))] flex-col gap-3 rounded-card bg-[#202123] p-5 text-white shadow-[var(--shadow-purple-glow-medium)]"
        >
          <h3 className="text-title-sm font-bold">
            {publication.displayName || publication.handle}
          </h3>
          <Link
            to={`/${publication.handle.toLowerCase()}`}
            className="text-body font-medium text-brand-purple-light underline hover:no-underline"
          >
            @{publication.handle}
          </Link>
          {publication.bio && (
            <p className="text-label text-white/80">{publication.bio}</p>
          )}
          <div className="mt-2 flex items-center gap-4">
            <FollowButton targetHandle={publication.handle} />
            <span className="text-label text-white/60">
              {formatCount(publication.followersCount)} followers
            </span>
          </div>
        </div>
      </ClickAwayListener>
    </Popper>
  );
}
