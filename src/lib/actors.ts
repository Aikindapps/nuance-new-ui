import { createActor as createPostCore } from "../candid/PostCore/PostCore";
import { createActor as createPostBucket } from "../candid/PostBucket/PostBucket";
import { createActor as createUser } from "../candid/User/User";
import canisterIds from "../config/canister_ids.json";
import { getAgent } from "./agent";

let postCoreActor: ReturnType<typeof createPostCore> | null = null;
let userActor: ReturnType<typeof createUser> | null = null;
const bucketActors = new Map<string, ReturnType<typeof createPostBucket>>();

export async function getPostCoreActor() {
  if (!postCoreActor) {
    postCoreActor = createPostCore(canisterIds.PostCore.ic, { agent: await getAgent() });
  }
  return postCoreActor;
}

export async function getUserActor() {
  if (!userActor) {
    userActor = createUser(canisterIds.User.ic, { agent: await getAgent() });
  }
  return userActor;
}

export async function getPostBucketActor(bucketCanisterId: string) {
  let actor = bucketActors.get(bucketCanisterId);
  if (!actor) {
    actor = createPostBucket(bucketCanisterId, { agent: await getAgent() });
    bucketActors.set(bucketCanisterId, actor);
  }
  return actor;
}
