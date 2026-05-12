import { createContext, useContext } from "react";
import type { GetPostsByFollowers } from "../candid/PostCore/PostCore";
import type { PostBucketType__1 } from "../candid/PostBucket/PostBucket";
import type { Result as UserResult, UserListItem } from "../candid/User/User";

// ActorsContext + hook + types live in this file so ActorsContext.tsx is a
// pure component file. Satisfies `react-refresh/only-export-components`.

export type ActorsValue = {
  getPopularThisWeek: (from: number, to: number) => Promise<GetPostsByFollowers>;
  getLatestPosts: (from: number, to: number) => Promise<GetPostsByFollowers>;
  getPostsByPostIds: (
    bucketCanisterId: string,
    postIds: string[],
    includeDraft: boolean,
  ) => Promise<Array<PostBucketType__1>>;
  getUsersByHandles: (handles: string[]) => Promise<Array<UserListItem>>;
  // Query method: returns the full User record (with displayName, avatar,
  // isVerified, follow counts) for a principal text. Safe on the anonymous
  // agent — Result variant {ok: User} | {err: text} is returned raw so the
  // hook layer can decide whether "not registered" is an error or an empty
  // state. PR #4 Phase 2: first consumer is WelcomeBanner.
  getUserByPrincipalId: (principalText: string) => Promise<UserResult>;
};

export const ActorsContext = createContext<ActorsValue | null>(null);

export function useActors(): ActorsValue {
  const v = useContext(ActorsContext);
  if (!v) {
    throw new Error("useActors() must be used inside <ActorsProvider>");
  }
  return v;
}
