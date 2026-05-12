import { useMemo, type ReactNode } from "react";
import type { HttpAgent } from "@icp-sdk/core/agent";
import {
  createPostBucketActor,
  createPostCoreActor,
  createUserActor,
} from "../lib/actors";
import { createAgent } from "../lib/agent";
import { useAuth } from "./useAuth";
import { ActorsContext, type ActorsValue } from "./useActors";

// Per-method backend call surface. Each consumer hook calls one of these
// instead of importing actor factories directly. Decision #18: explicit
// allowlist of backend calls; per-call swap/instrumentation seam; no leakage
// of unauthenticated mutation methods that the frontend has no business
// invoking. Adding a new backend call = adding it here.
//
// PR #4 Phase 4: ActorsContext now reads identity from AuthContext and binds
// the HttpAgent to it. When identity changes (login/logout) the useMemo
// re-runs — fresh agent, fresh actor promises — so authed-only calls
// (e.g., Following hook in Phase 5) automatically route through the authed
// agent without callers needing to thread identity through. Anon calls
// (Popular/New/popular-discovery) keep working because query methods don't
// care which principal calls them.

export function ActorsProvider({ children }: { children: ReactNode }) {
  const { identity } = useAuth();

  const value = useMemo<ActorsValue>(() => {
    // One agent per identity. PostCore + User actors materialize as soon as
    // the agent resolves (eager promise chains); bucket actors stay lazy
    // because their canister IDs are dynamic. The whole closure rebuilds
    // when identity changes, so stale agents/actors GC away.
    const agentPromise: Promise<HttpAgent> = createAgent(identity);
    const postCorePromise = agentPromise.then(createPostCoreActor);
    const userPromise = agentPromise.then(createUserActor);
    const bucketPromises = new Map<string, ReturnType<typeof createPostBucketActor>>();

    const getBucket = async (bucketCanisterId: string) => {
      const cached = bucketPromises.get(bucketCanisterId);
      if (cached) return cached;
      const actor = createPostBucketActor(await agentPromise, bucketCanisterId);
      bucketPromises.set(bucketCanisterId, actor);
      return actor;
    };

    return {
      getPopularThisWeek: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getPopularThisWeek(from, to);
      },
      getLatestPosts: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getLatestPosts(from, to);
      },
      getPostsByPostIds: async (bucketCanisterId, postIds, includeDraft) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.getPostsByPostIds(postIds, includeDraft);
      },
      getUsersByHandles: async (handles) => {
        const actor = await userPromise;
        return actor.getUsersByHandles(handles);
      },
      getUserByPrincipalId: async (principalText) => {
        const actor = await userPromise;
        return actor.getUserByPrincipalId(principalText);
      },
    };
  }, [identity]);

  return <ActorsContext.Provider value={value}>{children}</ActorsContext.Provider>;
}
