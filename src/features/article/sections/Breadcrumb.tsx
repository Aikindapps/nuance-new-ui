import {
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconBack } from "../../../components/ui/icons/IconBack";

// Figma 1:5290 — back button + a trail of crumbs. Crumbs with a `to` render
// as underlined purple links; the last crumb (current location) is plain.
// 18/28 type, brand-purple. The Figma trail is "Overview / {publication} /
// {category}" — the route assembles the list and passes it in.
//
// PR #8 Phase 3b: a crumb can carry an optional `popover` render fn that
// gets mounted on hover / focus / click. Used for the publication crumb's
// info-card-with-Follow-button (Figma §4.9). The crumb owns hover-state +
// a small close-delay timer so the cursor can move between the trigger
// link and the popover without flickering closed.

export type CrumbPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export type Crumb = {
  label: string;
  to?: string;
  popover?: (props: CrumbPopoverProps) => ReactNode;
};

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-3 px-6 py-3 lg:px-14"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        <IconBack className="size-[calc(18*var(--fpx))]" />
      </button>

      <p className="min-w-0 truncate text-body text-brand-purple">
        {crumbs.map((crumb, i) => (
          <CrumbItem
            key={`${crumb.label}-${i}`}
            crumb={crumb}
            showSeparator={i > 0}
          />
        ))}
      </p>
    </nav>
  );
}

const CLOSE_DELAY_MS = 150;

function CrumbItem({
  crumb,
  showSeparator,
}: {
  crumb: Crumb;
  showSeparator: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLAnchorElement | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const hasPopover = Boolean(crumb.popover);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openNow = () => {
    cancelClose();
    setOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, CLOSE_DELAY_MS);
  };

  const closeNow = () => {
    cancelClose();
    setOpen(false);
  };

  let content: ReactNode;
  if (crumb.to) {
    content = (
      <Link
        ref={setAnchorEl}
        to={crumb.to}
        onMouseEnter={hasPopover ? openNow : undefined}
        onMouseLeave={hasPopover ? scheduleClose : undefined}
        onFocus={hasPopover ? openNow : undefined}
        onBlur={hasPopover ? scheduleClose : undefined}
        onClick={
          hasPopover
            ? (e) => {
                // Publication routes don't exist yet; the popover IS the
                // interaction surface (it carries the Follow button).
                // preventDefault + toggle covers touch devices that can't
                // hover. Revisit when publication pages ship.
                e.preventDefault();
                if (open) closeNow();
                else openNow();
              }
            : undefined
        }
        aria-haspopup={hasPopover ? "dialog" : undefined}
        aria-expanded={hasPopover ? open : undefined}
        className="underline hover:no-underline"
      >
        {crumb.label}
      </Link>
    );
  } else {
    content = <span>{crumb.label}</span>;
  }

  // Popover renderer is invoked during render, but the handlers it receives
  // (openNow / scheduleClose / closeNow) only mutate the `closeTimer` ref
  // from event callbacks — never during render. The static analyzer can't
  // prove that, so suppress react-hooks/refs with explicit reasoning.
  const popoverNode = hasPopover
    ? // eslint-disable-next-line react-hooks/refs
      crumb.popover?.({
        anchorEl,
        open,
        onClose: closeNow,
        onMouseEnter: openNow,
        onMouseLeave: scheduleClose,
      })
    : null;

  return (
    <span>
      {showSeparator && <span className="text-brand-purple"> / </span>}
      {content}
      {popoverNode}
    </span>
  );
}
