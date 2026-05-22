/* eslint-disable */
// Diagnostic: confirm getUsersByPrincipals hydrates comment creators correctly.
// Run via: npx tsx scripts/probe-comments.ts
import { HttpAgent } from "@icp-sdk/core/agent";
import { createActor as createPostCore } from "../src/candid/PostCore/PostCore";
import { createActor as createPostBucket } from "../src/candid/PostBucket/PostBucket";
import { createActor as createUser } from "../src/candid/User/User";
import canisterIds from "../src/config/canister_ids.json" with { type: "json" };

const agent = await HttpAgent.create({ host: "https://icp-api.io" });
const postCore = createPostCore(canisterIds.PostCore.ic, { agent });
const userActor = createUser(canisterIds.User.ic, { agent });

const popular = await postCore.getPopularThisWeek(0, 5);
const sample = popular.posts[0];
const bucket = createPostBucket(sample.bucketCanisterId, { agent });
const result = await bucket.getPostComments(sample.postId);
if (result.__kind__ === "err") {
  console.log("err:", result.err);
  process.exit(1);
}
const creators = Array.from(new Set(result.ok.comments.map((c) => c.creator)));
console.log("Unique creators on this post:", creators);

const users = await userActor.getUsersByPrincipals(creators);
console.log(`\ngetUsersByPrincipals(${creators.length}) returned ${users.length} records:`);
for (const u of users) {
  console.log(`  - principal=${u.principal} handle=${u.handle} displayName=${u.displayName} avatar=${u.avatar.slice(0, 40)}${u.avatar.length > 40 ? "..." : ""}`);
}
