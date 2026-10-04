import { SubscriptionTimeInterval } from "../../../candid/Subscription/Subscription";
import type { WriterSubscriptionDetails } from "../../../candid/Subscription/Subscription";

// Pay a publication's or an individual writer's subscription by card (Stripe)
// -- NIC-621 (epic NIC-620, design NIC-616); writers NIC-631 (design NIC-619).
//
// Nuance's off-chain card-payment server (Aikindapps/nuance `stripe-proxy`)
// creates the Stripe Checkout Session. Every call is authorised the same way:
// the reader stores a fresh nonce on the Subscription canister through their
// own identity (`authorizeForProxy`), then POSTs it to the server, which
// checks it with `checkProxyAuthorization` and consumes it (valid 2 minutes).
//
// LIVE route (D-174, Ed's assumption): the new app -- UAT included -- talks to
// the PROD Subscription canister, so it must use the server's `/prod` route
// (the `/uat` route checks nonces on the separate UAT canister). Card payments
// tested on UAT are therefore real charges.
export const CARD_SERVER_URL =
  "https://nuance-stripe-proxy.onrender.com/prod/stripe";

// One card plan the publication or writer sells: Stripe price id + USD amount
// in cents.
export type CardTier = {
  interval: SubscriptionTimeInterval;
  priceId: string;
  usdCents: string;
};

// Display order of the card plans (frame 3085:11951: Week, Month, Year).
// Lifetime is never sold by card (D-164); a stray LifeTime entry on the
// canister is ignored, as the old app does.
const CARD_INTERVALS = [
  SubscriptionTimeInterval.Weekly,
  SubscriptionTimeInterval.Monthly,
  SubscriptionTimeInterval.Annually,
] as const;

// The card plans a reader can buy, in display order. Empty unless the
// publication's or writer's Stripe account is active (charges + transfers
// enabled). The first entry per interval wins (updateStripePriceTier upserts,
// so there is only ever one).
export function cardTiers(details: WriterSubscriptionDetails | null): CardTier[] {
  if (!details || !details.stripeIsActive) return [];
  const tiers: CardTier[] = [];
  for (const interval of CARD_INTERVALS) {
    const hit = details.stripePricing.find(
      ([i, priceId, cents]) => i === interval && priceId !== "" && cents !== "",
    );
    if (hit) tiers.push({ interval, priceId: hit[1], usdCents: hit[2] });
  }
  return tiers;
}

// "$5.00" from "500".
export function fmtUsd(usdCents: string): string {
  return (Number(usdCents) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type CardCheckoutResult =
  | { kind: "url"; url: string }
  // The server answered 409: the reader already has an active subscription.
  | { kind: "already" }
  // Anything else: server unreachable, auth step failed, non-2xx, bad body.
  | { kind: "error"; message: string };

type CheckoutArgs = {
  authorize: (nonce: string) => Promise<void>;
  priceId: string;
  writerId: string;
  readerId: string;
  // This page's address: Stripe sends the reader back here (NIC-622). The
  // server ignores it until its change on petition NIC-624 (item 5) ships.
  returnUrl: string;
  fetchImpl?: typeof fetch;
};

function newNonce(): string {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

// Ask the card-payment server for a Stripe Checkout URL. Never throws.
export async function createCardCheckout({
  authorize,
  priceId,
  writerId,
  readerId,
  returnUrl,
  fetchImpl = fetch,
}: CheckoutArgs): Promise<CardCheckoutResult> {
  const nonce = newNonce();
  try {
    await authorize(nonce);
  } catch (e: unknown) {
    return { kind: "error", message: e instanceof Error ? e.message : "authorize failed" };
  }

  let res: Response;
  try {
    res = await fetchImpl(`${CARD_SERVER_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, writerId, readerId, nonce, returnUrl }),
    });
  } catch (e: unknown) {
    return { kind: "error", message: e instanceof Error ? e.message : "network error" };
  }

  if (res.status === 409) return { kind: "already" };

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const rec = (body ?? {}) as { url?: unknown; error?: unknown };
  if (!res.ok) {
    return {
      kind: "error",
      message: typeof rec.error === "string" ? rec.error : `HTTP ${res.status}`,
    };
  }
  if (typeof rec.url !== "string" || !/^https:\/\//.test(rec.url)) {
    return { kind: "error", message: "no checkout url" };
  }
  return { kind: "url", url: rec.url };
}

// Open the tab Stripe will load in. Must run synchronously inside the click
// handler (before any await) so the browser treats it as a user gesture and
// does not block it. Returns null when the browser blocked it anyway.
// `waitingText` is shown in the blank tab until Stripe loads (the server can
// take a while to answer).
export function openCheckoutTab(waitingText: string): Window | null {
  const tab = window.open("", "_blank");
  if (tab) {
    try {
      // Sever the back-reference before the tab leaves for Stripe.
      tab.opener = null;
      tab.document.title = waitingText;
      tab.document.body.textContent = waitingText;
      tab.document.body.style.cssText =
        "font-family:sans-serif;padding:24px;color:#444";
    } catch {
      // Cosmetic only.
    }
  }
  return tab;
}
