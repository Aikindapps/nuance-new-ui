// NIC-248 — Desktop "Choose a publication" chooser modal.
//
// Opened by UserMenu when the editor belongs to >1 publications.
// The component reads useMyPublicationsEntry() for the list/state and
// navigates to /publication/:handle/manage/articles on row click.
//
// Chrome: the Popup shell hosts title + close-X. Because the overflow state
// (1368:7175) needs the title/subcount to stay fixed while only the list
// scrolls, the list region is a separate scrollable div inside the Popup
// body rather than relying on Popup's own scroll.

import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { Popup } from "./Popup";
import { Avatar } from "./Avatar";
import { useModal } from "../../services/modal";
import { useMyPublicationsEntry } from "../../lib/useMyPublicationsEntry";
import { publicationChooserCopy } from "../../constants/copy";
import { primaryButtonSx } from "./modalButtons";

// DOM id wired to the Modal service's aria-labelledby.
// Consumers pass this constant when calling modal.open().
export const PUBLICATION_CHOOSER_TITLE_ID = "publication-chooser-title";

// ---------- internal sub-components -----------------------------------------

/** Three shimmer rows shown while the profile query is in-flight. */
function SkeletonRows() {
  return (
    <div className="flex flex-col">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          {i > 0 && (
            <div className="h-px bg-[#373A49]/20" />
          )}
          <div className="flex h-[72px] items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex flex-col gap-1">
              <Skeleton variant="rectangular" width={180} height={16} sx={{ borderRadius: "4px" }} />
              <Skeleton variant="rectangular" width={120} height={12} sx={{ borderRadius: "4px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chevron-right icon (8×14, fill currentColor). */
function ChevronRight() {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="currentColor"
      aria-hidden
    >
      <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- main component ---------------------------------------------------

export function PublicationChooser() {
  const modal = useModal();
  const navigate = useNavigate();
  const { publications, count, isLoading, isError, refetch } =
    useMyPublicationsEntry();

  const handleClose = () => modal.close();

  const handleRowClick = (handle: string) => {
    navigate(`/publication/${handle}/manage/articles`);
    modal.close();
  };

  // Subcount line — different text in loading vs list state
  const subcountText = isLoading
    ? publicationChooserCopy.loadingSubcount
    : publicationChooserCopy.subcount(count);

  return (
    <Popup
      titleId={PUBLICATION_CHOOSER_TITLE_ID}
      title={publicationChooserCopy.title}
      onClose={handleClose}
      closeAriaLabel={publicationChooserCopy.closeAriaLabel}
    >
      {/* Subcount line — hidden in error state (matches frame 1368:7251 which
          has no subcount below the title) */}
      {!isError && (
        <p className="mt-1 text-[18px] leading-[22px] font-normal text-ink/60">
          {subcountText}
        </p>
      )}

      {/* Body — 600px wide inner region, matching "Body / list" in Figma */}
      <div className="mt-6 w-full">
        {isLoading && <SkeletonRows />}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-[24px] leading-[29px] font-bold text-ink">
              {publicationChooserCopy.errorHeading}
            </p>
            <p className="text-[18px] leading-[22px] font-normal text-ink/60">
              {publicationChooserCopy.errorBody}
            </p>
            <div className="mt-3">
              <Button
                variant="contained"
                onClick={refetch}
                sx={primaryButtonSx}
              >
                {publicationChooserCopy.retryLabel}
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          /* max-height matches ≈5.4 rows so the 6th clips (overflow state).
             Exact calc: 6 rows × 72px + 5 dividers × 1px = 437px visible
             in the Figma scroll frame (600×392). We cap at ~392px so the
             partial 6th row shows through on 8+ pubs. */
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "392px" }}
          >
            {publications.map((pub, i) => (
              <div key={pub.handle}>
                {i > 0 && <div className="h-px bg-[#373A49]/20" />}
                <button
                  type="button"
                  onClick={() => handleRowClick(pub.handle)}
                  aria-label={publicationChooserCopy.rowAriaLabel(pub.name)}
                  className="flex h-[72px] w-full items-center gap-4 text-left hover:bg-brand-purple-5 transition-colors"
                >
                  {/* Avatar — 48×48, branded-initial fallback */}
                  <Avatar
                    src=""
                    label={pub.name}
                    sizeClass="size-12 shrink-0"
                    textClass="text-body"
                  />

                  {/* Name + handle stack */}
                  <div className="flex flex-1 flex-col gap-[3px] min-w-0">
                    <span className="text-[18px] leading-[22px] font-semibold text-ink truncate">
                      {pub.name}
                    </span>
                    <span className="text-[16px] leading-[19px] font-normal text-ink/60 truncate">
                      @{pub.handle}&nbsp;&middot;&nbsp;{pub.isEditor ? "Editor" : "Writer"}
                    </span>
                  </div>

                  {/* Chevron right */}
                  <span className="shrink-0 text-ink">
                    <ChevronRight />
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Popup>
  );
}
