import { useEffect, useRef } from "react";
import { publishScheduleCopy as copy } from "./publishScheduleCopy";
import {
  clockHHMM,
  formatClock12h,
  formatGoesLive,
  halfHourSlots,
  localDateISO,
} from "../lib/publishSchedule";
import {
  IconCalendar,
} from "../../../components/ui/icons/IconCalendar";
import {
  IconChevronDown,
} from "../../../components/ui/icons/IconChevronDown";

const FIELD_CLASS = [
  "flex h-[calc(48*var(--fpx))] w-full items-center",
  "justify-between rounded-[calc(6*var(--fpx))]",
  "px-[calc(16*var(--fpx))] text-body text-ink-80",
  "border-2 border-ink-border-10 bg-ink-border-5",
].join(" ");

const TIME_FIELD_OPEN_CLASS = [
  "flex h-[calc(48*var(--fpx))] w-full items-center",
  "justify-between rounded-[calc(6*var(--fpx))]",
  "px-[calc(16*var(--fpx))] text-body text-ink-80",
  "border-2 border-brand-purple bg-brand-purple-5",
].join(" ");

const DATE_INPUT_CLASS = [
  "h-full w-full bg-transparent text-body text-ink-80",
  "outline-none appearance-none",
  "[&::-webkit-calendar-picker-indicator]:opacity-0",
].join(" ");

const FOLDOUT_CLASS = [
  "absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-full",
  "rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))]",
  "shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]",
  "max-h-[calc(320*var(--fpx))] overflow-y-auto",
].join(" ");

const OPTION_CLASS = [
  "flex w-full items-center gap-[calc(16*var(--fpx))]",
  "rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))]",
  "py-[calc(13*var(--fpx))] text-left text-white",
  "text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))]",
].join(" ");

const OPTION_SELECTED_CLASS = "bg-brand-purple-fluor-80 font-medium";
const OPTION_HOVER_CLASS = "hover:bg-brand-purple-fluor-80";

const HELP_CLASS =
  "text-[length:calc(14*var(--fpx))] text-ink-60";

const GOES_LIVE_CLASS =
  "text-[length:calc(14*var(--fpx))] text-brand-purple";

type Props = {
  date: string;
  time: string | null;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string | null) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scheduledMs: number | null;
};

// The "Publish date & time" row (NIC-418, Figma 1:38058 / 2426:6185 /
// 2426:6208). The date field is the browser/OS native date popup (not
// a pixel target - only the closed field must match the frame); the
// time field is a dropdown-style foldout, same pattern as Access.
export function PublishScheduleField({
  date,
  time,
  onDateChange,
  onTimeChange,
  open,
  onOpenChange,
  scheduledMs,
}: Props) {
  const timeRef = useRef<HTMLDivElement>(null);
  const timeListId = "publish-schedule-time-listbox";

  const now = new Date();
  const slots = halfHourSlots(date, now);
  const displayedTime =
    time != null && slots.includes(time) ? time : clockHHMM(now);

  // Close on outside mousedown (mirror PublishView's Access pattern).
  // Escape is handled by the parent PublishView (shared cascade).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (timeRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onOpenChange]);

  const helpText =
    scheduledMs === null
      ? copy.immediateHelp
      : copy.goesLive
          .replace("{date}", formatGoesLive(date))
          .replace("{time}", formatClock12h(displayedTime));

  return (
    <div className="flex flex-col gap-[calc(6*var(--fpx))]">
      <label className="text-label font-bold text-ink">
        {copy.label}
      </label>
      <div className="flex w-full gap-[calc(16*var(--fpx))]">
        <div className={FIELD_CLASS}>
          <input
            type="date"
            aria-label={copy.dateAriaLabel}
            value={date}
            min={localDateISO(new Date())}
            onChange={(e) => onDateChange(e.target.value)}
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & {
                showPicker?: () => void;
              };
              try {
                el.showPicker?.();
              } catch {
                /* not supported - native UI still works */
              }
            }}
            className={DATE_INPUT_CLASS}
          />
          <IconCalendar
            className="size-[calc(24*var(--fpx))] shrink-0"
          />
        </div>

        <div className="relative w-full" ref={timeRef}>
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={timeListId}
            aria-label={copy.timeAriaLabel}
            onClick={() => onOpenChange(!open)}
            className={open ? TIME_FIELD_OPEN_CLASS : FIELD_CLASS}
          >
            <span>{displayedTime}</span>
            <IconChevronDown
              className="size-[calc(24*var(--fpx))] shrink-0"
            />
          </button>

          {open && (
            <ul
              id={timeListId}
              role="listbox"
              className={FOLDOUT_CLASS}
            >
              {slots.length === 0 && (
                <li className={OPTION_CLASS}>{copy.noSlotsToday}</li>
              )}
              {slots.map((slot) => {
                const selected = slot === displayedTime;
                return (
                  <li key={slot} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onTimeChange(slot);
                        onOpenChange(false);
                      }}
                      className={[
                        OPTION_CLASS,
                        selected
                          ? OPTION_SELECTED_CLASS
                          : OPTION_HOVER_CLASS,
                      ].join(" ")}
                    >
                      {slot}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <p
        className={scheduledMs === null ? HELP_CLASS : GOES_LIVE_CLASS}
      >
        {helpText}
      </p>
    </div>
  );
}
