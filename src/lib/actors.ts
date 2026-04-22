import { createActor as createPostCore } from "../candid/PostCore/PostCore";
import { createActor as createPostBucket } from "../candid/PostBucket/PostBucket";
import { createActor as createUser } from "../candid/User/User";
import canisterIds from "../config/canister_ids.json";
import { getAgent } from "./agent";

let postCoreActor: ReturnType<typeof createPostCore> | null = null;
let userActor: ReturnType<typeof createUser> | null = null;
const bucketActors = new Map<string, ReturnType<typeof createPostBucket>>();

export function getPostCoreActor() {
  if (!postCoreActor) {
    postCoreActor = createPostCore(canisterIds.PostCore.ic, { agent: getAgent() });
  }
  return postCoreActor;
}

export function getUserActor() {
  if (!userActor) {
    userActor = createUser(canisterIds.User.ic, { agent: getAgent() });
  }
  return userActor;
}

export function getPostBucketActor(bucketCanisterId: string) {
  let actor = bucketActors.get(bucketCanisterId);
  if (!actor) {
    actor = createPostBucket(bucketCanisterId, { agent: getAgent() });
    bucketActors.set(bucketCanisterId, actor);
  }
  return actor;
}
