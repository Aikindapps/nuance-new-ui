// NIC-668 -- "no subscriptions yet" is not a failure.
//
// The Subscription canister has no empty answer for its subscription-history
// reads: getReaderSubscriptionDetails() and getWriterSubscriptionDetails()
// (own account, or a publication for its editor) return
// #err("No subscription record found.") when the caller or publication has
// never had a subscription record (Aikindapps/nuance
// src/Subscription/main.mo). The lists treat exactly that answer as an empty
// list. The canister sends only this text for the case (no error variant), so
// the match is on the exact string; every other err (e.g. "Unauthorized.")
// stays an error. If the canister ever rewords it, readers see the error
// block again rather than an empty list hiding a real failure.
export const NO_SUBSCRIPTION_RECORD = "No subscription record found.";

export function isNoSubscriptionRecord(err: string): boolean {
  return err === NO_SUBSCRIPTION_RECORD;
}
