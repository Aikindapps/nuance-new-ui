import type { HttpAgent } from "@icp-sdk/core/agent";
import { createActor as createPostCore } from "../candid/PostCore/PostCore";
import { createActor as createPostBucket } from "../candid/PostBucket/PostBucket";
import { createActor as createUser } from "../candid/User/User";
import { createActor as createStorage } from "../candid/Storage/Storage";
import { createActor as createNotifications } from "../candid/Notifications/Notifications";
import { createActor as createIcrc1 } from "../candid/Icrc1/Icrc1";
import { createActor as createSonic } from "../candid/Sonic/Sonic";
import canisterIds from "../config/canister_ids.json";

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
