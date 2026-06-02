import { useMemo, type ReactNode } from "react";
import type { HttpAgent } from "@icp-sdk/core/agent";
import {
  createNotificationsActor,
  createPostBucketActor,
  createPostCoreActor,
  createStorageActor,
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
    const storagePromise = agentPromise.then(createStorageActor);
    const notificationsPromise = agentPromise.then(createNotificationsActor);
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
      getPostsByFollowers: async (handles, from, to) => {
        const actor = await postCorePromise;
        return actor.getPostsByFollowers(handles, from, to);
      },
      getMyFollowingTagsPostKeyProperties: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getMyFollowingTagsPostKeyProperties(from, to);
      },
      getMyTags: async () => {
        const actor = await postCorePromise;
        return actor.getMyTags();
      },
      getPostsByPostIds: async (bucketCanisterId, postIds, includeDraft) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.getPostsByPostIds(postIds, includeDraft);
      },
      getUsersByHandles: async (handles) => {
        const actor = await userPromise;
        return actor.getUsersByHandles(handles);
      },
      getUsersByPrincipals: async (principals) => {
        const actor = await userPromise;
        return actor.getUsersByPrincipals(principals);
      },
      getUserByPrincipalId: async (principalText) => {
        const actor = await userPromise;
        return actor.getUserByPrincipalId(principalText);
      },
      // Mutations (PR #6, decision #30). The userPromise/postCorePromise
      // actors are bound to the authed agent whenever identity is non-anon,
      // so registerUser/followTags write as the registering principal.
      registerUser: async (handle, displayName, avatar) => {
        const actor = await userPromise;
        return actor.registerUser(handle, displayName, avatar);
      },
      getAllTags: async () => {
        const actor = await postCorePromise;
        return actor.getAllTags();
      },
      followTags: async (tagIds) => {
        const actor = await postCorePromise;
        return actor.followTags(tagIds);
      },
      // Read Article (PR #7, decision #31). All anon-safe — query/oneway —
      // so an article reads identically logged-out (the SEO path) or in.
      getPost: async (bucketCanisterId, postId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.getPost(postId);
      },
      getPostKeyProperties: async (postId) => {
        const actor = await postCorePromise;
        return actor.getPostKeyProperties(postId);
      },
      viewPost: async (postId) => {
        const actor = await postCorePromise;
        return actor.viewPost(postId);
      },
      getMoreArticlesFromUsers: async (postId, handles) => {
        const actor = await postCorePromise;
        return actor.getMoreArticlesFromUsers(postId, handles);
      },
      // Article Enrichment (PR #8, decision #34). Follow/unfollow on User;
      // every comment method on PostBucket (variable canister ID, so via
      // getBucket). All return raw variant results — hook layer surfaces
      // canister `err` strings instead of throwing here.
      followAuthor: async (handle) => {
        const actor = await userPromise;
        return actor.followAuthor(handle);
      },
      unfollowAuthor: async (handle) => {
        const actor = await userPromise;
        return actor.unfollowAuthor(handle);
      },
      getPostComments: async (bucketCanisterId, postId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.getPostComments(postId);
      },
      saveComment: async (bucketCanisterId, model) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.saveComment(model);
      },
      upvoteComment: async (bucketCanisterId, commentId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.upvoteComment(commentId);
      },
      downvoteComment: async (bucketCanisterId, commentId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.downvoteComment(commentId);
      },
      removeCommentVote: async (bucketCanisterId, commentId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.removeCommentVote(commentId);
      },
      reportComment: async (bucketCanisterId, commentId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.reportComment(commentId);
      },
      // Write Article (PR #9, decision #36). save/getMy*Posts run on PostCore
      // (authed agent → msg.caller = the writer); updatePostDraft/delete_ on
      // the post's bucket; getNewContentId/uploadBlob on the Storage canister.
      savePost: async (model) => {
        const actor = await postCorePromise;
        return actor.save(model);
      },
      updatePostDraft: async (bucketCanisterId, postId, isDraft) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.updatePostDraft(postId, isDraft);
      },
      deletePost: async (bucketCanisterId, postId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.delete_(postId);
      },
      getMyAllPosts: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getMyAllPosts(from, to);
      },
      getMyDraftPosts: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getMyDraftPosts(from, to);
      },
      getMyPublishedPosts: async (from, to) => {
        const actor = await postCorePromise;
        return actor.getMyPublishedPosts(from, to);
      },
      getNewContentId: async () => {
        const actor = await storagePromise;
        return actor.getNewContentId();
      },
      uploadBlob: async (content) => {
        const actor = await storagePromise;
        return actor.uploadBlob(content);
      },
      // Notifications (PR #10). Indices on the wire are decimal strings; the
      // hook layer takes numbers and converts here so consumers never see
      // string math.
      getUserNotifications: async (from, to) => {
        const actor = await notificationsPromise;
        return actor.getUserNotifications(String(from), String(to));
      },
      markNotificationsAsRead: async (notificationIds) => {
        const actor = await notificationsPromise;
        return actor.markNotificationsAsRead(notificationIds);
      },
    };
  }, [identity]);

  return <ActorsContext.Provider value={value}>{children}</ActorsContext.Provider>;
}
