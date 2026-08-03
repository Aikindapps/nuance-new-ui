import { useMemo, type ReactNode } from "react";
import type { HttpAgent } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  createExtV2Actor,
  createIcpIndexActor,
  createIcpLedgerActor,
  createIcrcIndexActor,
  createIcrc1Actor,
  createNotificationsActor,
  createPostBucketActor,
  createPostCoreActor,
  createPostRelationsActor,
  createSonicActor,
  createStorageActor,
  createSubscriptionActor,
  createUserActor,
} from "../lib/actors";
import { TOKENS } from "../config/tokens";
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
    const postRelationsPromise = agentPromise.then(createPostRelationsActor);
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

    // PR-1 (wallet/tipping): ICRC-1 ledger + Sonic pool actors are per-canister,
    // so they cache lazily by canisterId like buckets.
    const icrc1Actors = new Map<string, ReturnType<typeof createIcrc1Actor>>();
    const getIcrc1 = async (ledgerCanisterId: string) => {
      const cached = icrc1Actors.get(ledgerCanisterId);
      if (cached) return cached;
      const actor = createIcrc1Actor(await agentPromise, ledgerCanisterId);
      icrc1Actors.set(ledgerCanisterId, actor);
      return actor;
    };
    const sonicActors = new Map<string, ReturnType<typeof createSonicActor>>();
    const getSonic = async (poolCanisterId: string) => {
      const cached = sonicActors.get(poolCanisterId);
      if (cached) return cached;
      const actor = createSonicActor(await agentPromise, poolCanisterId);
      sonicActors.set(poolCanisterId, actor);
      return actor;
    };
    // PR #14 (Article Keys): one ext_v2 NFT canister per premium article —
    // dynamic ids from PostCore.getAllNftCanisters, cached like buckets.
    const extActors = new Map<string, ReturnType<typeof createExtV2Actor>>();
    const getExt = async (nftCanisterId: string) => {
      const cached = extActors.get(nftCanisterId);
      if (cached) return cached;
      const actor = createExtV2Actor(await agentPromise, nftCanisterId);
      extActors.set(nftCanisterId, actor);
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
      migratePostToPublication: async (bucketCanisterId, postId, publicationHandle, isDraft) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.migratePostToPublication(postId, publicationHandle, isDraft);
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
      // Wallet + Tipping (PR-1, decision #42). Balance/quote reads are anon-safe;
      // claim/spend/transfer route through the authed agent (msg.caller).
      getIcrc1Balance: async (ledgerCanisterId, owner, subaccount) => {
        const actor = await getIcrc1(ledgerCanisterId);
        return actor.icrc1_balance_of({ owner: Principal.fromText(owner), subaccount });
      },
      getSonicQuote: async (poolCanisterId, args) => {
        const actor = await getSonic(poolCanisterId);
        return actor.quote(args);
      },
      claimRestrictedTokens: async () => {
        const actor = await userPromise;
        return actor.claimRestrictedTokens();
      },
      // Arg order: (bucketCanisterId, postId, amount) — the raw actor's order.
      spendRestrictedTokensForTipping: async (bucketCanisterId, postId, amount) => {
        const actor = await userPromise;
        return actor.spendRestrictedTokensForTipping(bucketCanisterId, postId, amount);
      },
      transferIcrc1: async (ledgerCanisterId, to, amount, fee) => {
        const actor = await getIcrc1(ledgerCanisterId);
        return actor.icrc1_transfer({ to, amount, fee });
      },
      // Wallet History (PR #14, decision #43). Index actors are lazy — they
      // only materialize when the history section actually queries them.
      getIcpAccountTransactions: async (accountIdHex, maxResults) => {
        const actor = createIcpIndexActor(await agentPromise);
        return actor.get_account_identifier_transactions({
          account_identifier: accountIdHex,
          max_results: BigInt(maxResults),
        });
      },
      getIcrcAccountTransactions: async (
        indexCanisterId,
        owner,
        maxResults,
        subaccount,
      ) => {
        const actor = createIcrcIndexActor(await agentPromise, indexCanisterId);
        return actor.get_account_transactions({
          account: { owner: Principal.fromText(owner), subaccount },
          max_results: BigInt(maxResults),
        });
      },
      getBucketCanisters: async () => {
        const actor = await postCorePromise;
        return actor.getBucketCanisters();
      },
      getMyApplauds: async (bucketCanisterId) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.getMyApplauds();
      },
      getReaderSubscriptionDetails: async () => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.getReaderSubscriptionDetails();
      },
      getWriterSubscriptionDetails: async () => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.getWriterSubscriptionDetails(null);
      },
      // Subscription purchase flow (NIC-129 §3.5/§3.6).
      getWriterSubscriptionDetailsByPrincipalId: async (principalText) => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.getWriterSubscriptionDetailsByPrincipalId(principalText);
      },
      // Update subscription plan prices and payment receiver (NIC-130 §6.4).
      updateSubscriptionDetails: async (model) => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.updateSubscriptionDetails(model);
      },
      createPaymentRequestAsReader: async (writerPrincipalId, interval, amount) => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.createPaymentRequestAsReader(writerPrincipalId, interval, amount);
      },
      completeSubscriptionEvent: async (eventId) => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.completeSubscriptionEvent(eventId);
      },
      disperseTokensForSuccessfulSubscription: async (eventId) => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.disperseTokensForSuccessfulSubscription(eventId);
      },
      pendingStuckTokensHeartbeatExternal: async () => {
        const actor = createSubscriptionActor(await agentPromise);
        return actor.pendingStuckTokensHeartbeatExternal();
      },
      spendRestrictedTokensForSubscription: async (eventId, amount) => {
        const actor = await userPromise;
        return actor.spendRestrictedTokensForSubscription(eventId, amount);
      },
      getPublicationCanisters: async () => {
        const actor = await postCorePromise;
        return actor.getPublicationCanisters();
      },
      // Article Keys (PR #14, decision #43).
      getAllNftCanisters: async () => {
        const actor = await postCorePromise;
        return actor.getAllNftCanisters();
      },
      getOwnedExtTokens: async (nftCanisterId, accountIdHex) => {
        const actor = await getExt(nftCanisterId);
        return actor.tokens_ext(accountIdHex);
      },
      getExtSupply: async (nftCanisterId) => {
        const actor = await getExt(nftCanisterId);
        return actor.marketplaceTransactionsAndTotalSupply();
      },
      transferExtToken: async (nftCanisterId, request) => {
        const actor = await getExt(nftCanisterId);
        return actor.ext_transfer(request);
      },
      // NFT purchase flow (NIC-128 §3.4): read available token info. The
      // returned availableTokenIndex being undefined signals sold-out.
      getAvailableToken: async (nftCanisterId) => {
        const a = await getExt(nftCanisterId);
        return a.getAvailableToken();
      },
      // Lock the next available token for the buyer; returns the ICP payment
      // address on ok, a CommonError on err.
      lockExtToken: async (nftCanisterId, tokenId, price, buyerAccountIdHex) => {
        const a = await getExt(nftCanisterId);
        return a.lock(tokenId, price, buyerAccountIdHex, new Uint8Array(0));
      },
      // Settle after the ICP transfer lands — canister assigns the token.
      settleExtToken: async (nftCanisterId, tokenId) => {
        const a = await getExt(nftCanisterId);
        return a.settle(tokenId);
      },
      // Lazy actor: the legacy ledger interface is only needed when a user
      // actually withdraws ICP to an account-id receiver.
      transferIcp: async (toAccountId, amount) => {
        const actor = createIcpLedgerActor(await agentPromise);
        return actor.transfer({
          to: toAccountId,
          amount: { e8s: amount },
          fee: { e8s: TOKENS.ICP.fee },
          memo: 0n,
        });
      },
      checkTippingByTokenSymbol: async (bucketCanisterId, postId, symbol) => {
        const actor = await getBucket(bucketCanisterId);
        return actor.checkTippingByTokenSymbol(postId, symbol, "");
      },
      // Writer/Publication profile (NIC-42). All anon-safe queries.
      getUserListItemByHandle: async (handle) => {
        const actor = await userPromise;
        return actor.getUserListItemByHandle(handle);
      },
      getUserPosts: async (handle) => {
        const actor = await postCorePromise;
        return actor.getUserPosts(handle);
      },
      getPublicationPosts: async (from, to, handle) => {
        const actor = await postCorePromise;
        return actor.getPublicationPosts(from, to, handle);
      },
      isEditorPublic: async (handle, principal) => {
        const actor = await postCorePromise;
        return actor.isEditorPublic(handle, principal);
      },
      isWriterPublic: async (handle, principal) => {
        const actor = await postCorePromise;
        return actor.isWriterPublic(handle, principal);
      },
      getUserPostCounts: async (handle) => {
        const actor = await postCorePromise;
        return actor.getUserPostCounts(handle);
      },
      // NIC-41 Search Phase 1: PostRelations full-text search + PostCore
      // key-props fetch. searchPost is named differently from the PostBucket
      // method getPostsByPostIds (3-arg, bucket-scoped) to avoid collision.
      searchPost: async (query) => {
        const actor = await postRelationsPromise;
        return actor.searchPost(query);
      },
      searchByTag: async (tag) => {
        const actor = await postRelationsPromise;
        return actor.searchByTag(tag);
      },
      getPostKeyPropertiesByIds: async (postIds) => {
        const actor = await postCorePromise;
        return actor.getPostsByPostIds(postIds);
      },
    };
  }, [identity]);

  return <ActorsContext.Provider value={value}>{children}</ActorsContext.Provider>;
}
