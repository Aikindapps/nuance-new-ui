// NIC-378 §6.6 — Publication CTA banner bar (presentational).
// Renders a full-width coloured bar with an optional icon, a title, and a
// button pill.  Used both as the settings live-preview (preview=true, mini
// sizing) and the reader bar (preview=false, full-size).
//
// isCtaEmpty lives in ../lib/cta (plain .ts) — this file only exports the
// component, satisfying react-refresh/only-export-components.
//
// Design reference:
//   1922:9467 — full-width reader bar (1312×120, pad 0/48/0/48, radius 12)
//   1924:9514 — custom primaryColor treatment
//   1924:9523 — no icon variant
//   1924:9534 — overflow wrapping (bar grows in height)
//   1914:9461 / 1920:9464 — mini preview in settings (pad 0/16, radius 8, gap 12)
//     Mini: 448×64, icon 20×20, title Inter 700 16/19, button 36h pad 0/16 font 14/17

import { CtaIcon } from "../../../components/ui/icons/CtaIcon";

const DEFAULT_COLOR = "#5405D4";

type Props = {
  ctaCopy: string;
  buttonCopy: string;
  link: string;
  icon: string;
  primaryColor: string;
  /** When true: mini sizing + pill rendered as non-navigating <span>. */
  preview?: boolean;
};

export function PublicationCtaBar({
  ctaCopy,
  buttonCopy,
  link,
  icon,
  primaryColor,
  preview = false,
}: Props) {
  const bg = primaryColor.trim() || DEFAULT_COLOR;

  // Pill shown when buttonCopy is present; in non-preview mode, link also required.
  const showPill = buttonCopy.trim() !== "" && (preview || link.trim() !== "");

  if (preview) {
    // Mini preview — matches 1914:9461 / 1920:9464:
    // 448×64, pad 0/16, radius 8, gap 12, icon 20×20, title 16/19 bold, button 36h pad 0/16 14/17 bold.
    return (
      <div
        className="flex w-full flex-row items-center justify-between gap-[calc(12*var(--fpx))] rounded-[calc(8*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(14*var(--fpx))]"
        style={{ backgroundColor: bg }}
      >
        {/* Left cluster */}
        <div className="flex min-w-0 flex-1 flex-row items-center gap-[calc(8*var(--fpx))]">
          {icon.trim() !== "" && (
            <CtaIcon
              name={icon}
              className="size-[calc(20*var(--fpx))] shrink-0 text-white"
            />
          )}
          {ctaCopy.trim() !== "" && (
            <span className="text-[length:calc(16*var(--fpx))] font-bold leading-[calc(19*var(--fpx))] text-white">
              {ctaCopy}
            </span>
          )}
        </div>

        {/* Pill (non-navigating span) */}
        {showPill && (
          <span
            className="shrink-0 whitespace-nowrap rounded-[calc(8*var(--fpx))] bg-white px-[calc(16*var(--fpx))] py-[calc(9.5*var(--fpx))] text-[length:calc(14*var(--fpx))] font-bold leading-[calc(17*var(--fpx))]"
            style={{ color: bg }}
          >
            {buttonCopy}
          </span>
        )}
      </div>
    );
  }

  // Full-size reader bar — matches 1922:9467:
  // pad 0/48/0/48, radius 12, icon 40×40, title 30/36 bold, button 56h pad 0/32 18/22 bold.
  return (
    <div
      className="flex w-full flex-row items-center justify-between gap-[calc(24*var(--fpx))] rounded-[calc(12*var(--fpx))] px-[calc(48*var(--fpx))] py-[calc(24*var(--fpx))]"
      style={{ backgroundColor: bg }}
    >
      {/* Left cluster: optional icon + title */}
      <div className="flex min-w-0 flex-1 flex-row items-center gap-[calc(20*var(--fpx))]">
        {icon.trim() !== "" && (
          <CtaIcon
            name={icon}
            className="size-[calc(40*var(--fpx))] shrink-0 text-white"
          />
        )}
        {ctaCopy.trim() !== "" && (
          <span className="text-[length:calc(30*var(--fpx))] font-bold leading-[calc(36*var(--fpx))] text-white">
            {ctaCopy}
          </span>
        )}
      </div>

      {/* Button pill (anchor — navigates to link in new tab) */}
      {showPill && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap rounded-[calc(8*var(--fpx))] bg-white px-[calc(32*var(--fpx))] py-[calc(17*var(--fpx))] text-[length:calc(18*var(--fpx))] font-bold leading-[calc(22*var(--fpx))] no-underline"
          style={{ color: bg }}
        >
          {buttonCopy}
        </a>
      )}
    </div>
  );
}
