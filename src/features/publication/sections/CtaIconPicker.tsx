// NIC-378 §6.6 — CTA icon picker.
// Mirrors PrimaryColorPicker.tsx (MUI Popper + ClickAwayListener).
// A closed dropdown-style trigger opens a 2×4 tile grid of the 8 CTA_ICONS.
// The selected tile has a 2px Purple/100 ring; when nothing is selected, the
// "star" tile shows the default-highlighted ring (per frame 1924:9467) but
// selecting a tile is what actually sets the value — opening the picker alone
// does NOT auto-write "star" into state.
//
// Design reference: 1924:9467 (popover OPEN), 1914:9461 (trigger closed).

import { useState, useRef, useCallback } from "react";
import Popper from "@mui/material/Popper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { CTA_ICONS } from "../../../components/ui/icons/ctaIconList";
import { CtaIcon } from "../../../components/ui/icons/CtaIcon";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { publicationSettingsCopy as copy } from "../../../constants/copy";

// Capitalise the first letter of an icon name for display.
function displayName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

type Props = {
  value: string;
  onChange: (name: string) => void;
};

export function CtaIconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setAnchorEl(triggerRef.current);
    setOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
    },
    [onChange],
  );

  // Rows: 2 rows × 4 cols matching 1924:9467.
  const row1 = CTA_ICONS.slice(0, 4);
  const row2 = CTA_ICONS.slice(4, 8);

  // Default-highlighted tile in the grid when nothing is selected yet (per
  // frame 1924:9467 "star" tile has ring even when value === "").
  const gridHighlight = value || "star";

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Closed trigger — same visual idiom as PrimaryColorPicker */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={[
          "flex flex-row items-center justify-between",
          "w-full rounded-[calc(6*var(--fpx))]",
          "border border-ink-border/10",
          "bg-ink/5",
          "h-[calc(48*var(--fpx))]",
          "px-[calc(16*var(--fpx))]",
          "cursor-pointer",
        ].join(" ")}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex flex-row items-center gap-[calc(8*var(--fpx))]">
          {value ? (
            <>
              <CtaIcon name={value} className="size-[calc(24*var(--fpx))] text-ink/80" />
              <span className="text-[length:calc(18*var(--fpx))] leading-[calc(22*var(--fpx))] text-ink/80">
                {displayName(value)}
              </span>
            </>
          ) : (
            <>
              {/* Placeholder glyph when no selection yet (mirrors frame 1914:9461 "heart" placeholder) */}
              <CtaIcon name="heart" className="size-[calc(24*var(--fpx))] text-ink" />
              <span className="text-[length:calc(18*var(--fpx))] leading-[calc(22*var(--fpx))] text-ink/80">
                {copy.bannerIconPickerPlaceholder}
              </span>
            </>
          )}
        </span>
        <IconChevronDown className="size-[calc(16*var(--fpx))] text-ink" />
      </button>

      {/* Popover */}
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
        sx={{ zIndex: 60 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          {/* 292×185 per 1924:9467; pad 16, radius 12, shadow */}
          <div
            className={[
              "bg-white rounded-[calc(12*var(--fpx))]",
              "border border-ink-border/10",
              "shadow-[var(--shadow-purple-glow-medium)]",
              "p-[calc(16*var(--fpx))]",
            ].join(" ")}
            style={{ width: "calc(292 * var(--fpx))" }}
          >
            {/* Row 1 */}
            <div className="flex flex-row gap-[calc(12*var(--fpx))] mb-[calc(12*var(--fpx))]">
              {row1.map((name) => {
                const isHighlighted = gridHighlight === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    aria-label={displayName(name)}
                    aria-pressed={value === name}
                    className={[
                      "size-[calc(56*var(--fpx))] rounded-[calc(8*var(--fpx))]",
                      "bg-ink/5",
                      "flex items-center justify-center",
                      "text-ink",
                      isHighlighted ? "ring-2 ring-brand-purple ring-offset-2" : "",
                    ].join(" ")}
                  >
                    <CtaIcon name={name} className="size-[calc(24*var(--fpx))]" />
                  </button>
                );
              })}
            </div>
            {/* Row 2 */}
            <div className="flex flex-row gap-[calc(12*var(--fpx))]">
              {row2.map((name) => {
                const isHighlighted = gridHighlight === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    aria-label={displayName(name)}
                    aria-pressed={value === name}
                    className={[
                      "size-[calc(56*var(--fpx))] rounded-[calc(8*var(--fpx))]",
                      "bg-ink/5",
                      "flex items-center justify-center",
                      "text-ink",
                      isHighlighted ? "ring-2 ring-brand-purple ring-offset-2" : "",
                    ].join(" ")}
                  >
                    <CtaIcon name={name} className="size-[calc(24*var(--fpx))]" />
                  </button>
                );
              })}
            </div>

            {/* Help text — per 1924:9467 */}
            <p className="mt-[calc(12*var(--fpx))] text-[length:calc(14*var(--fpx))] leading-[calc(17*var(--fpx))] text-ink/60">
              {copy.bannerIconPickerHelp}
            </p>
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
