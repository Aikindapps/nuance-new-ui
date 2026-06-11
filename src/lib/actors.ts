import type { HttpAgent } from "@icp-sdk/core/agent";
import { createActor as createPostCore } from "../candid/PostCore/PostCore";
import { createActor as createPostBucket } from "../candid/PostBucket/PostBucket";
import { createActor as createUser } from "../candid/User/User";
import { createActor as createStorage } from "../candid/Storage/Storage";
import { createActor as createNotifications } from "../candid/Notifications/Notifications";
import { createActor as createIcrc1 } from "../candid/Icrc1/Icrc1";
import { createActor as createSonic } from "../candid/Sonic/Sonic";
import { createActor as createIcpLedger } from "../candid/IcpLedger/IcpLedger";
import { createActor as createIcpIndex } from "../candid/IcpIndex/IcpIndex";
import { createActor as createCkBtcIndex } from "../candid/CkBtcIndex/CkBtcIndex";
import { createActor as createIcrc1Archive } from "../candid/Icrc1Archive/Icrc1Archive";
import { createActor as createExtV2 } from "../candid/ExtV2/ExtV2";
import { createActor as createSubscription } from "../candid/Subscription/Subscription";
import canisterIds from "../config/canister_ids.json";
import {
  CKBTC_INDEX_CANISTER_ID,
  ICP_INDEX_CANISTER_ID,
  TOKENS,
} from "../config/tokens";

// PR #4 Phase 4: pure factories. Caller (ActorsContext) owns caching and
// invalidation per identity. The module-level singleton cache that existed
// pre-Phase-4 was incompatible with auth-state changes — the anon actor
// would have leaked into authed calls after login.

export function createPostCoreActor(agent: HttpAgent) {
  return createPostCore(canisterIds.PostCore.ic, { agent });
}

export function createUserActor(agent: HttpAgent) {
  return createUser(canisterIds.User.ic, { agent });
}

export function createPostBucketActor(agent: HttpAgent, bucketCanisterId: string) {
  return createPostBucket(bucketCanisterId, { agent });
}

export function createStorageActor(agent: HttpAgent) {
  return createStorage(canisterIds.Storage.ic, { agent });
}

export function createNotificationsActor(agent: HttpAgent) {
  return createNotifications(canisterIds.Notifications.ic, { agent });
}

// PR-1 (wallet/tipping): ICRC-1 ledgers and Sonic DEX pools take a dynamic
// canisterId (one per token / per pool), like createPostBucketActor.
export function createIcrc1Actor(agent: HttpAgent, ledgerCanisterId: string) {
  return createIcrc1(ledgerCanisterId, { agent });
}

export function createSonicActor(agent: HttpAgent, poolCanisterId: string) {
  return createSonic(poolCanisterId, { agent });
}

// PR #14 (wallet completion, decision #43): legacy ICP ledger interface (for
// account-id withdrawals), the two transaction-index canisters (history), the
// ICRC-1 archive interface (old NUA ledger blocks live in archive canisters
// whose ids come back in the ledger's get_transactions response), per-article
// ext_v2 NFT canisters (Article Keys), and the Nuance Subscription canister.
export function createIcpLedgerActor(agent: HttpAgent) {
  return createIcpLedger(TOKENS.ICP.canisterId, { agent });
}

export function createIcpIndexActor(agent: HttpAgent) {
  return createIcpIndex(ICP_INDEX_CANISTER_ID, { agent });
}

export function createCkBtcIndexActor(agent: HttpAgent) {
  return createCkBtcIndex(CKBTC_INDEX_CANISTER_ID, { agent });
}

export function createIcrc1ArchiveActor(agent: HttpAgent, archiveCanisterId: string) {
  return createIcrc1Archive(archiveCanisterId, { agent });
}

export function createExtV2Actor(agent: HttpAgent, nftCanisterId: string) {
  return createExtV2(nftCanisterId, { agent });
}

export function createSubscriptionActor(agent: HttpAgent) {
  return createSubscription(canisterIds.Subscription.ic, { agent });
}
