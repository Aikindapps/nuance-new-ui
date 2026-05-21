import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import { SocialIcon } from "../icons/SocialIcon";
import {
  SHARE_LABELS,
  SHARE_TARGETS,
  buildShareUrl,
} from "../../../lib/shareUrls";

// Article share popover — surfaces the four social-channel targets that
// Figma 4.4 renders (Google / LinkedIn / Reddit / Facebook). Each opens
// a share-intent URL in a new tab. The Copy link affordance stays in the
// ActionBar itself — the design splits these intentionally.
//
// Anchored above the share button (the ActionBar is fixed at viewport
// bottom, so popping upward keeps the popover on screen). MUI Popper
// + ClickAwayListener follow the project's modal-service shape but stay
// ad-hoc here — extract a shared <Popover /> primitive on third consumer.

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
};

export function SharePopover({ anchorEl, open, onClose, url, title }: Props) {
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top"
      modifiers={[{ name: "offset", options: { offset: [0, 12] } }]}
      sx={{ zIndex: 50 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <div
          role="dialog"
          aria-label="Share this article"
          className="flex items-center gap-2 rounded-card bg-white p-3 shadow-[var(--shadow-purple-glow-medium)]"
        >
          {SHARE_TARGETS.map((target) => (
            <a
              key={target}
              href={buildShareUrl(target, url, title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SHARE_LABELS[target]}
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-card transition-colors hover:bg-ink-border-5"
            >
              <SocialIcon platform={target} className="size-6" />
            </a>
          ))}
        </div>
      </ClickAwayListener>
    </Popper>
  );
}
