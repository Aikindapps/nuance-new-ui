import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";
import type { CardTier } from "./cardCheckout";

// Coming back from Stripe Checkout -- NIC-622 (epic NIC-620; design NIC-616
// items 5-6, writers NIC-619 item 5).
//
// The app sends its own address with every checkout request (`returnUrl`).
// The card-payment server is to send the reader back to it with
// `?stripe_checkout=success&session_id=...` or `?stripe_checkout=cancel`
// (server change requested on petition NIC-624, item 5; until it ships the
// server ignores the address and returns readers to the old app).
//
// Stripe Checkout opens in a NEW tab, so the return lands in that tab while
// the reader's original tab may still be open on the Subscribe window.
// Everything the two tabs share therefore lives in localStorage (every tab
// of the app sees it), never in sessionStorage, and is read at the moment it
// is needed rather than when the window opens.

export type CardReturn = "success" | "cancel";

const RETURN_PARAM = "stripe_checkout";
const SESSION_PARAM = "session_id";

// Success return: re-read the reader's subscription every 2 s; still not
// there 15 s after the return -> Payment received.
export const CONFIRM_POLL_MS = 2_000;
export const CONFIRM_LIMIT_MS = 15_000;
// Duplicate-payment guard: lapses 10 minutes after the success return.
export const PENDING_GUARD_MS = 10 * 60_000;

export function readCardReturn(params: URLSearchParams): CardReturn | null {
  const v = params.get(RETURN_PARAM);
  return v === "success" || v === "cancel" ? v : null;
}

// The same query without the return flags, so a reload never replays them.
export function withoutCardReturn(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(RETURN_PARAM);
  next.delete(SESSION_PARAM);
  return next;
}

// Where Stripe should send the reader back: this page, without query or hash
// (the server appends its own `?stripe_checkout=...`).
export function cardReturnUrl(
  loc: Pick<Location, "origin" | "pathname"> = window.location,
): string {
  return `${loc.origin}${loc.pathname}`;
}

// -- Shared between tabs (localStorage) ----------------------------------------
// A blocked or full storage never throws: the guard and the amount line simply
// fall away.

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function storeKey(kind: "plan" | "pending", readerId: string, writerId: string) {
  return `nuance.cardCheckout.${kind}.${readerId}.${writerId}`;
}

function readRecord(key: string): Record<string, unknown> | null {
  try {
    const raw = store()?.getItem(key);
    const v: unknown = raw ? JSON.parse(raw) : null;
    return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function writeRecord(key: string, value: Record<string, unknown>) {
  try {
    store()?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable.
  }
}

function dropRecord(key: string) {
  try {
    store()?.removeItem(key);
  } catch {
    // Storage unavailable.
  }
}

// The card plan the reader picked: written when Continue to payment opens
// Stripe, read by the tab Stripe returns to ("Your card will be charged $5.00
// every month") and by the cancel return (the plan stays picked).
export type CardPlan = Pick<CardTier, "interval" | "usdCents">;

const PLAN_INTERVALS: readonly string[] = [
  SubscriptionTimeInterval.Weekly,
  SubscriptionTimeInterval.Monthly,
  SubscriptionTimeInterval.Annually,
];

export function saveCardPlan(readerId: string, writerId: string, plan: CardPlan) {
  writeRecord(storeKey("plan", readerId, writerId), {
    interval: plan.interval,
    usdCents: plan.usdCents,
  });
}

export function readCardPlan(readerId: string, writerId: string): CardPlan | null {
  const v = readRecord(storeKey("plan", readerId, writerId));
  if (!v || typeof v.interval !== "string" || !PLAN_INTERVALS.includes(v.interval)) {
    return null;
  }
  if (typeof v.usdCents !== "string" || !/^\d+$/.test(v.usdCents)) return null;
  return {
    interval: v.interval as SubscriptionTimeInterval,
    usdCents: v.usdCents,
  };
}

// Duplicate-payment guard (NIC-616 item 6), per reader and per publication or
// writer. Set on a success return; cleared when that subscription shows up.
// While it is set -- at most 10 minutes from the return -- Continue to payment
// shows Payment received instead of opening Stripe, in every tab.
export function markCardPending(readerId: string, writerId: string, now: number) {
  writeRecord(storeKey("pending", readerId, writerId), { at: now });
}

export function clearCardPending(readerId: string, writerId: string) {
  dropRecord(storeKey("pending", readerId, writerId));
}

export function isCardPending(readerId: string, writerId: string, now: number): boolean {
  const key = storeKey("pending", readerId, writerId);
  const at = readRecord(key)?.at;
  if (typeof at !== "number" || !Number.isFinite(at)) return false;
  if (Math.abs(now - at) < PENDING_GUARD_MS) return true;
  dropRecord(key); // Lapsed.
  return false;
}
