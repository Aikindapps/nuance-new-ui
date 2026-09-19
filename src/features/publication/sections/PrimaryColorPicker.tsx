// NIC-370 §6.6 — Primary colour picker.
// Opens a popover with 7 preset swatches + a custom "+" tile and a hex input.
// Mirror of PublicationPopover.tsx Popper/ClickAwayListener pattern.

import { useState, useRef, useCallback } from "react";
import Popper from "@mui/material/Popper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { IconPlus } from "../../../components/ui/icons/IconPlus";

const DEFAULT_COLOR = "#5405D4";
const SWATCHES = [
  "#5405D4",
  "#202123",
  "#0FA3A3",
  "#E8467C",
  "#F5A623",
  "#2D9CDB",
  "#27AE60",
] as const;

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

export function PrimaryColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const effectiveColor = (value || DEFAULT_COLOR).toUpperCase();

  // Local hex draft state for the text input.
  const [hexDraft, setHexDraft] = useState(effectiveColor);

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

  const handleSwatchClick = useCallback(
    (swatch: string) => {
      onChange(swatch);
      setHexDraft(swatch.toUpperCase());
      // Do NOT auto-close per spec.
    },
    [onChange],
  );

  const handleHexDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const draft = e.target.value;
      setHexDraft(draft);
      if (/^#?[0-9A-Fa-f]{6}$/.test(draft)) {
        const normalised = "#" + draft.replace(/^#/, "").toUpperCase();
        onChange(normalised);
      }
    },
    [onChange],
  );

  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value.toUpperCase();
      onChange(hex);
      setHexDraft(hex);
    },
    [onChange],
  );
  return (
    <div onKeyDown={handleKeyDown}>
      {/* Closed trigger */}
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
        <span className="flex flex-row items-center gap-[calc(12*var(--fpx))]">
          <span
            className="size-[calc(24*var(--fpx))] rounded-[calc(4*var(--fpx))] shrink-0"
            style={{ backgroundColor: effectiveColor }}
            aria-hidden
          />
          <span className="text-[length:calc(16*var(--fpx))] text-ink">
            {effectiveColor}
          </span>
        </span>
        <IconChevronDown className="size-[calc(20*var(--fpx))] text-ink/40" />
      </button>

      {/* Open popover */}
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
        sx={{ zIndex: 60 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <div
            className={[
              "bg-white rounded-[calc(12*var(--fpx))]",
              "border border-ink-border/10",
              "shadow-[var(--shadow-purple-glow-medium)]",
              "p-[calc(16*var(--fpx))]",
            ].join(" ")}
          >
            {/* Swatch grid: 4 cols */}
            <div className="grid grid-cols-4 gap-[calc(12*var(--fpx))]">
              {SWATCHES.map((swatch) => {
                const isSelected = effectiveColor === swatch.toUpperCase();
                return (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => handleSwatchClick(swatch)}
                    className={[
                      "size-[calc(40*var(--fpx))] rounded-[calc(8*var(--fpx))]",
                      isSelected
                        ? "ring-2 ring-brand-purple ring-offset-2"
                        : "",
                    ].join(" ")}
                    style={{ backgroundColor: swatch }}
                    aria-label={swatch}
                    aria-pressed={isSelected}
                  />
                );
              })}

              {/* 8th tile: custom colour via native colour input */}
              <label
                className={[
                  "size-[calc(40*var(--fpx))] rounded-[calc(8*var(--fpx))]",
                  "border-2 border-dashed border-ink-border/20",
                  "grid place-items-center cursor-pointer",
                  "bg-ink/5",
                ].join(" ")}
                aria-label="Custom colour"
              >
                <input
                  type="color"
                  className="sr-only"
                  onChange={handleCustomColorChange}
                  tabIndex={-1}
                />
                <IconPlus className="size-[calc(18*var(--fpx))] text-ink/60" />
              </label>
            </div>

            {/* Hex input row */}
            <div className="mt-[calc(12*var(--fpx))]">
              <input
                type="text"
                value={hexDraft}
                onChange={handleHexDraftChange}
                maxLength={7}
                className={[
                  "w-full border border-ink-border/10",
                  "rounded-[calc(6*var(--fpx))]",
                  "bg-ink/5",
                  "h-[calc(40*var(--fpx))]",
                  "px-[calc(12*var(--fpx))]",
                  "text-[length:calc(14*var(--fpx))] text-ink",
                  "outline-none focus:border-brand-purple transition-colors",
                ].join(" ")}
                aria-label="Hex colour value"
                spellCheck={false}
              />
            </div>
          </div>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
