import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getPostBucketActor,
  getPostCoreActor,
  getUserActor,
} from "../lib/actors";
import type { GetPostsByFollowers } from "../candid/PostCore/PostCore";
import type { PostBucketType__1 } from "../candid/PostBucket/PostBucket";
import type { UserListItem } from "../candid/User/User";

// Per-method backend call surface. Each consumer hook calls one of these
// instead of importing actor factories directly. Decision #18: explicit
// allowlist of backend calls; per-call swap/instrumentation seam; no leakage
// of unauthenticated mutation methods that the frontend has no business
// invoking. Adding a new backend call = adding it here.
export type ActorsValue = {
  getPopularThisWeek: (from: number, to: number) => Promise<GetPostsByFollowers>;
  getLatestPosts: (from: number, to: number) => Promise<GetPostsByFollowers>;
  getPostsByPostIds: (
    bucketCanisterId: string,
    postIds: string[],
    includeDraft: boolean,
  ) => Promise<Array<PostBucketType__1>>;
  getUsersByHandles: (handles: string[]) => Promise<Array<UserListItem>>;
};

const ActorsContext = createContext<ActorsValue | null>(null);

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

export function useActors(): ActorsValue {
  const v = useContext(ActorsContext);
  if (!v) {
    throw new Error("useActors() must be used inside <ActorsProvider>");
  }
  return v;
}
