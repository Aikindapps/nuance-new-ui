import { createContext, useContext } from "react";
import type {
  GetPostsByFollowers,
  PostTagModel__1,
  Result_1 as FollowTagsResult,
  TagModel,
} from "../candid/PostCore/PostCore";
import type { PostBucketType__1 } from "../candid/PostBucket/PostBucket";
import type {
  RegisterUserReturn,
  Result as UserResult,
  UserListItem,
} from "../candid/User/User";

// ActorsContext + hook + types live in this file so ActorsContext.tsx is a
// pure component file. Satisfies `react-refresh/only-export-components`.

export type ActorsValue = {
  getPopularThisWeek: (from: number, to: number) => Promise<GetPostsByFollowers>;
  getLatestPosts: (from: number, to: number) => Promise<GetPostsByFollowers>;
  // Query method: same (indexFrom, indexTo) half-open range as the other
  // PostCore list methods (project lesson 2026-04-21). Handles must be
  // lowercased before passing — PostCore looks up via the same lowercase
  // reverse index the User canister uses (project lesson 2026-04-22).
  getPostsByFollowers: (
    handles: string[],
    from: number,
    to: number,
  ) => Promise<GetPostsByFollowers>;
  // Composite query — uses msg.caller, so the authed agent is required.
  // Returns articles tagged with topics the caller follows.
  getMyFollowingTagsPostKeyProperties: (
    from: number,
    to: number,
  ) => Promise<GetPostsByFollowers>;
  // Query method that returns the list of tags the authed caller follows.
  // Used to drive the Following tab's empty-state determination — empty when
  // the user has zero writers AND zero topics followed.
  getMyTags: () => Promise<Array<PostTagModel__1>>;
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
  // --- Mutations (PR #6, decision #30) — the first write calls in the
  // project. They run on the authed agent (PR #4 Phase 4) so msg.caller is
  // the registering principal. ---
  // Registers the authed principal as a Nuance user. avatar is passed empty
  // ("") — avatar upload is deferred (decision #30). The raw variant is
  // returned so the modal layer can surface a duplicate/reserved-handle err
  // inline rather than throwing.
  registerUser: (
    handle: string,
    displayName: string,
    avatar: string,
  ) => Promise<RegisterUserReturn>;
  // Every tag on the platform — drives the TopicsModal tag list.
  getAllTags: () => Promise<Array<TagModel>>;
  // Follows the given tag IDs for the authed caller (TopicsModal "Done").
  followTags: (tagIds: string[]) => Promise<FollowTagsResult>;
};

export const ActorsContext = createContext<ActorsValue | null>(null);

export function useActors(): ActorsValue {
  const v = useContext(ActorsContext);
  if (!v) {
    throw new Error("useActors() must be used inside <ActorsProvider>");
  }
  return v;
}
