// Pure helpers for the "Publish date & time" (scheduled publish)
// control (NIC-418). No React here - keeps the date/time math
// testable and out of the component tree. ASCII-only (NIC-180).
//
// Timezone rule: the writer picks local wall-clock time; we send
// the corresponding UTC instant (epoch milliseconds) to the
// canister. composeLocalMs is the single place that conversion
// happens.

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// "YYYY-MM-DD" in LOCAL time. Do not use toISOString - that is UTC.
export function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

// "HH:MM" local, 24h, zero-padded.
export function clockHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Interpret dateISO + timeHHMM as LOCAL wall-clock time and return
// the corresponding epoch milliseconds. Never parse the combined
// string via Date.parse - that can be read as UTC in some engines.
export function composeLocalMs(
  dateISO: string,
  timeHHMM: string,
): number {
  const [y, m, day] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  return new Date(y, m - 1, day, hh, mm, 0, 0).getTime();
}

// Fixed 30-minute increments, "00:00".."23:30" (48 slots). If
// dateISO is today, only the slots strictly later than now.
export function halfHourSlots(dateISO: string, now: Date): string[] {
  const all: string[] = [];
  for (let h = 0; h < 24; h++) {
    all.push(`${pad2(h)}:00`);
    all.push(`${pad2(h)}:30`);
  }
  if (dateISO !== localDateISO(now)) return all;
  const nowMs = now.getTime();
  return all.filter((slot) => composeLocalMs(dateISO, slot) > nowMs);
}

// effective = timeHHMM ?? clockHHMM(now); returns epoch ms if the
// resulting instant is still in the future, otherwise null (a
// stale pick silently falls back to "publish immediately").
export function scheduleMsIfFuture(
  dateISO: string,
  timeHHMM: string | null,
  now: Date,
): number | null {
  const effective = timeHHMM ?? clockHHMM(now);
  const ms = composeLocalMs(dateISO, effective);
  return ms > now.getTime() ? ms : null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "Jul 5, 2025" - matches the goes-live line on frame 2426:6185.
export function formatGoesLive(dateISO: string): string {
  const [y, m, day] = dateISO.split("-").map(Number);
  return `${MONTHS[m - 1]} ${day}, ${y}`;
}

// "2:30 PM" - the goes-live sentence uses 12h + meridiem even
// though the closed time field itself shows 24h "HH:MM" (per the
// frames, these two spots use different time formats).
export function formatClock12h(timeHHMM: string): string {
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${pad2(mm)} ${period}`;
}
