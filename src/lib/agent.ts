import { HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";

export const IC_HOST = "https://icp-api.io";

// PR #4 Phase 4: pure factory. Caller (ActorsContext) owns the lifecycle and
// caches by identity. Anonymous calls pass undefined; authed calls pass the
// Identity returned by AuthContext.
export function createAgent(identity?: Identity | null): Promise<HttpAgent> {
  return HttpAgent.create({
    host: IC_HOST,
    ...(identity ? { identity } : {}),
  });
}
