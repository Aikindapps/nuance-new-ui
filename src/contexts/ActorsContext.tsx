import { useMemo, type ReactNode } from "react";
import {
  getPostBucketActor,
  getPostCoreActor,
  getUserActor,
} from "../lib/actors";
import { ActorsContext, type ActorsValue } from "./useActors";

// Per-method backend call surface. Each consumer hook calls one of these
// instead of importing actor factories directly. Decision #18: explicit
// allowlist of backend calls; per-call swap/instrumentation seam; no leakage
// of unauthenticated mutation methods that the frontend has no business
// invoking. Adding a new backend call = adding it here.
//
// The ActorsContext constant + useActors() hook live in ./useActors.ts so
// this file is a pure component file (Fast Refresh).

export function ActorsProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ActorsValue>(
    () => ({
      getPopularThisWeek: async (from, to) => {
        const actor = await getPostCoreActor();
        return actor.getPopularThisWeek(from, to);
      },
      getLatestPosts: async (from, to) => {
        const actor = await getPostCoreActor();
        return actor.getLatestPosts(from, to);
      },
      getPostsByPostIds: async (bucketCanisterId, postIds, includeDraft) => {
        const actor = await getPostBucketActor(bucketCanisterId);
        return actor.getPostsByPostIds(postIds, includeDraft);
      },
      getUsersByHandles: async (handles) => {
        const actor = await getUserActor();
        return actor.getUsersByHandles(handles);
      },
    }),
    [],
  );
  return <ActorsContext.Provider value={value}>{children}</ActorsContext.Provider>;
}
