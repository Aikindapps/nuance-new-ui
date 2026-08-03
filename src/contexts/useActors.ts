import { createContext, useContext } from "react";
import type {
  GetPostsByFollowers,
  PostKeyProperties,
  PostSaveModel,
  PostTagModel__1,
  Result_1 as FollowTagsResult,
  Result_4 as SavePostResult,
  Result_5 as PostKeyPropertiesResult,
  TagModel,
  UserPostCounts,
} from "../candid/PostCore/PostCore";
import type {
  PostBucketType__1,
  Result as CommentResult,
  Result_1 as UpdateDraftResult,
  Result_2 as ReportResult,
  Result_4 as DeletePostResult,
  Result_6 as GetPostResult,
  Result_11 as TippingResult,
  SaveCommentModel,
} from "../candid/PostBucket/PostBucket";
import type {
  RegisterUserReturn,
  Result as UserResult,
  Result_1 as SpendTipResult,
  Result_2 as UserSubSpendResult,
  Result_7 as UserListItemResult,
  UserListItem,
} from "../candid/User/User";
import type { Content, Result as StorageResult } from "../candid/Storage/Storage";
import type {
  GetUserNotificationsResponse,
} from "../candid/Notifications/Notifications";
import type {
  Account,
  Result as Icrc1TransferResult,
} from "../candid/Icrc1/Icrc1";
import type { TransferResult as IcpTransferResult } from "../candid/IcpLedger/IcpLedger";
import type { GetAccountIdentifierTransactionsResult } from "../candid/IcpIndex/IcpIndex";
import type { GetTransactionsResult as IcrcIndexTransactionsResult } from "../candid/CkBtcIndex/CkBtcIndex";
import type { Applaud } from "../candid/PostBucket/PostBucket";
import type {
  Result as WriterSubscriptionResult,
  Result_2 as ReaderSubscriptionResult,
  Result_5 as PaymentRequestResult,
  Result_1 as SubVoidResult,
  SubscriptionTimeInterval,
  UpdateSubscriptionDetailsModel,
} from "../candid/Subscription/Subscription";
import type {
  Result as ExtTokensResult,
  TransactionsAndSupply,
  TransferRequest as ExtTransferRequest,
  TransferResponse as ExtTransferResponse,
  PremiumArticleSellingInformation,
  Result_7 as ExtLockResult,
  Result_3 as ExtSettleResult,
} from "../candid/ExtV2/ExtV2";
import type {
  Result as SonicQuoteResult,
  SwapArgs,
} from "../candid/Sonic/Sonic";
import type { Principal } from "@icp-sdk/core/principal";

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
  // Hydrate a batch of UserListItem records by principal text. Comments
  // come back from PostBucket with `handle` and `avatar` blanked (only
  // `creator` is populated), so comment-thread hydration goes by-principal.
  getUsersByPrincipals: (principals: string[]) => Promise<Array<UserListItem>>;
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
  // --- Read Article (PR #7, decision #31) — all query / oneway, anon-safe.
  // The article body lives in a bucket canister whose ID is dynamic (carried
  // in the URL), so getPost takes the bucketCanisterId like getPostsByPostIds.
  // The Result variant is returned raw so the hook layer can map an `err`
  // (not found / unauthorized draft) to a not-found state vs a thrown error.
  getPost: (
    bucketCanisterId: string,
    postId: string,
  ) => Promise<GetPostResult>;
  // Views / claps / tags for a post. PostBucketType carries none of these —
  // they live on PostKeyProperties in PostCore.
  getPostKeyProperties: (postId: string) => Promise<PostKeyPropertiesResult>;
  // Fire-and-forget view registration. `oneway` in Motoko — no return, no
  // auth gate. Called once when an article opens.
  viewPost: (postId: string) => Promise<void>;
  // Up to 5 recent published posts per handle, excluding the current postId.
  // Key properties only — bodies hydrate via getPostsByPostIds. Drives the
  // "More from {author}" + "Recommended" rails and the 3.3 foldout.
  getMoreArticlesFromUsers: (
    postId: string,
    handles: string[],
  ) => Promise<Array<Array<PostKeyProperties>>>;
  // --- Article Enrichment (PR #8, decision #34) — interaction mutations on
  // the article page. All authed; logged-out calls open LoginModal at the
  // consumer layer rather than executing. Cache invalidation contract for
  // follow: both ["my-profile"] and ["article", bucketId, postId] are
  // invalidated/optimistically updated because the latter holds the target
  // author's UserListItem (with followersCount). ---
  // Adds the target handle to the caller's `followersArray` and bumps
  // the target's followersCount on success. Result.ok is the *updated*
  // caller's User record; surfaces canister `err` strings (e.g. self-follow
  // attempts, blocked relationships) to the mutation hook layer.
  followAuthor: (handle: string) => Promise<UserResult>;
  unfollowAuthor: (handle: string) => Promise<UserResult>;
  // Returns the full comment thread (with server-assembled `replies`
  // recursion) plus `totalNumberOfComments`. Anon-safe query.
  getPostComments: (
    bucketCanisterId: string,
    postId: string,
  ) => Promise<CommentResult>;
  // Creates a top-level comment when `replyToCommentId` is omitted; replies
  // when set. Edits in place when `commentId` is set (out of PR #8 scope —
  // no UI consumer yet, but the wrapper supports it). Returns the *updated*
  // full comment thread, so consumers can `setQueryData` without a refetch.
  saveComment: (
    bucketCanisterId: string,
    model: SaveCommentModel,
  ) => Promise<CommentResult>;
  // Adds the caller's principal to the comment's `upVotes` AND removes the
  // caller from `downVotes` (the canister enforces single-slot voting per
  // caller — see PostBucket.main.mo:2954-2982). Returns the updated thread.
  // Optimistic-flip + rollback at the consumer layer mirrors both arrays.
  upvoteComment: (
    bucketCanisterId: string,
    commentId: string,
  ) => Promise<CommentResult>;
  // Mirror of upvoteComment — adds to downVotes, removes from upVotes for
  // the caller.
  downvoteComment: (
    bucketCanisterId: string,
    commentId: string,
  ) => Promise<CommentResult>;
  // Removes the caller's vote from a comment in both directions.
  // Same return shape as upvoteComment.
  removeCommentVote: (
    bucketCanisterId: string,
    commentId: string,
  ) => Promise<CommentResult>;
  // Flags a comment for moderation review — server records the report and
  // (per production behaviour) fans out to an internal Slack notification.
  // Result_2 is `{ ok: text } | { err: text }`. Authed only; logged-out
  // callers open LoginModal at the consumer layer.
  reportComment: (
    bucketCanisterId: string,
    commentId: string,
  ) => Promise<ReportResult>;
  // --- Write Article (PR #9, decision #36) — first post-authoring writes +
  // the Storage canister's first use in the project. All mutations run on the
  // authed agent (msg.caller = the writer); Result variants returned raw so
  // the hook layer can surface canister `err` strings inline. ---
  // Create/edit/draft/publish in one call: empty postId = new, non-empty =
  // edit; isDraft toggles draft vs publish. content is HTML (<=300k). PostCore
  // validates, routes to a bucket, and returns the saved Post.
  savePost: (model: PostSaveModel) => Promise<SavePostResult>;
  // Publish (false) / unpublish (true) an existing post. PostBucket method, so
  // the bucketCanisterId (from the saved Post) is required.
  updatePostDraft: (
    bucketCanisterId: string,
    postId: string,
    isDraft: boolean,
  ) => Promise<UpdateDraftResult>;
  // Move an existing personal draft into a publication, recording the creator
  // unconditionally. Must be called AFTER an initial personal save so the post
  // exists in a bucket. Returns the migrated Post or an err string. Uses the
  // same Result_1 ({ok:Post}|{err:string}) as updatePostDraft.
  migratePostToPublication: (
    bucketCanisterId: string,
    postId: string,
    publicationHandle: string,
    isDraft: boolean,
  ) => Promise<UpdateDraftResult>;
  // Delete a post (PostBucket.delete_). Authors cannot delete premium posts —
  // the canister returns an err in that case.
  deletePost: (
    bucketCanisterId: string,
    postId: string,
  ) => Promise<DeletePostResult>;
  // The authed caller's posts for the My Articles list. Half-open (from, to)
  // range like every PostCore list method. PostKeyProperties only — bodies
  // hydrate separately via getPostsByPostIds.
  getMyAllPosts: (from: number, to: number) => Promise<Array<PostKeyProperties>>;
  getMyDraftPosts: (
    from: number,
    to: number,
  ) => Promise<Array<PostKeyProperties>>;
  getMyPublishedPosts: (
    from: number,
    to: number,
  ) => Promise<Array<PostKeyProperties>>;
  // Storage canister chunked upload (cover + in-body images). getNewContentId
  // allocates an upload id; uploadBlob sends one chunk and returns the
  // data-canister id (used to build the public asset URL).
  getNewContentId: () => Promise<StorageResult>;
  uploadBlob: (content: Content) => Promise<StorageResult>;
  // --- Notifications (PR #10) — bell foldout + /notifications route. Both
  // methods take/return string-encoded numerics: `from`/`to` are a half-open
  // index range, totalCount is a decimal string. Authed only — anon callers
  // see a permission err from the canister; hook layer guards on `isAuthed`
  // so we never call from logged-out. Settings endpoints (get/update) are
  // intentionally not exposed yet — no settings UI in PR #10.
  getUserNotifications: (
    from: number,
    to: number,
  ) => Promise<GetUserNotificationsResponse>;
  markNotificationsAsRead: (notificationIds: string[]) => Promise<void>;
  // --- Wallet + Tipping (PR-1, decision #42). Token balances + Sonic price
  // quotes are anon-safe ICRC-1/DEX queries (they read on whatever agent is
  // active). Claim/spend/transfer are authed — msg.caller must be the signed-in
  // principal; consumers guard logged-out clicks to open LoginModal so we never
  // fire a transfer from the anonymous identity. ---
  // ICRC-1 balance of `owner` (principal text) at an optional 32-byte
  // subaccount, on the given ledger. Used for NUA/ICP/ckBTC holdings and the
  // restricted-NUA balance (owner = USER canister, subaccount = claimInfo).
  getIcrc1Balance: (
    ledgerCanisterId: string,
    owner: string,
    subaccount?: Uint8Array,
  ) => Promise<bigint>;
  // Sonic DEX price quote (anon-safe query) for the "= N NUA" conversion. The
  // raw Result is returned so the hook can degrade silently on a pool error —
  // a missing quote hides the conversion line, never blocks the holdings render.
  getSonicQuote: (
    poolCanisterId: string,
    args: SwapArgs,
  ) => Promise<SonicQuoteResult>;
  // Claim restricted ("Free") NUA into the caller's User-canister subaccount.
  // Returns the updated User (fresh claimInfo.lastClaimDate → restarts the
  // 7-day countdown). Authed.
  claimRestrictedTokens: () => Promise<UserResult>;
  // Spend restricted (Free) NUA toward a tip — transfers from the caller's claim
  // subaccount into the per-post tip subaccount. ARG ORDER IS (bucketCanisterId,
  // postId, amount): the raw actor's positional order. Do NOT mirror the prod
  // clap-modal, which calls (postId, bucketId, …) because its store reorders.
  spendRestrictedTokensForTipping: (
    bucketCanisterId: string,
    postId: string,
    amount: bigint,
  ) => Promise<SpendTipResult>;
  // Generic ICRC-1 transfer on the authed agent — the regular-token tip path
  // (move tokens into a per-post subaccount). amount/fee are e8s bigints.
  transferIcrc1: (
    ledgerCanisterId: string,
    to: Account,
    amount: bigint,
    fee: bigint,
  ) => Promise<Icrc1TransferResult>;
  // --- Wallet History (PR #14, decision #43) — per-source reads merged
  // client-side (prod parity, see useWalletHistory). Index reads are anon-safe
  // queries on public ledger data; applaud/subscription reads are authed
  // (msg.caller). ---
  // ICP transactions for an account-id hex, newest first, via the ICP index
  // canister.
  getIcpAccountTransactions: (
    accountIdHex: string,
    maxResults: number,
  ) => Promise<GetAccountIdentifierTransactionsResult>;
  // ICRC token transactions for an owner(+subaccount), newest first, via the
  // token's index canister (ckBTC index / NUA SNS index — same interface).
  getIcrcAccountTransactions: (
    indexCanisterId: string,
    owner: string,
    maxResults: number,
    subaccount?: Uint8Array,
  ) => Promise<IcrcIndexTransactionsResult>;
  // Registry of all PostBucket canisters: [canisterId, isActive-ish] pairs —
  // only the first element is consumed.
  getBucketCanisters: () => Promise<Array<[string, string]>>;
  // The caller's applauds (sent and received) on one bucket canister.
  getMyApplauds: (bucketCanisterId: string) => Promise<Array<Applaud>>;
  // The caller's subscription history, both directions (reader payments and
  // writer earnings).
  getReaderSubscriptionDetails: () => Promise<ReaderSubscriptionResult>;
  getWriterSubscriptionDetails: () => Promise<WriterSubscriptionResult>;
  // --- Subscription purchase flow (NIC-129 §3.5/§3.6) ---
  // Lookup writer subscription plan details by their principal ID.
  getWriterSubscriptionDetailsByPrincipalId: (
    principalText: string,
  ) => Promise<WriterSubscriptionResult>;
  // Update subscription plan prices and payment receiver (NIC-130 §6.4).
  updateSubscriptionDetails: (model: UpdateSubscriptionDetailsModel) => Promise<WriterSubscriptionResult>;
  // Create a payment request for a subscription interval; returns the subaccount
  // to deposit into and the eventId to finalise with.
  createPaymentRequestAsReader: (
    writerPrincipalId: string,
    interval: SubscriptionTimeInterval,
    amount: bigint,
  ) => Promise<PaymentRequestResult>;
  // Finalise subscription after a pure-regular-NUA transfer.
  completeSubscriptionEvent: (eventId: string) => Promise<ReaderSubscriptionResult>;
  // Notify the canister that tokens have been dispersed to the writer.
  disperseTokensForSuccessfulSubscription: (eventId: string) => Promise<SubVoidResult>;
  // Trigger recovery heartbeat for stuck payment events (fire-and-forget).
  pendingStuckTokensHeartbeatExternal: () => Promise<void>;
  // Spend restricted ("Free") NUA toward a subscription — mirrors
  // spendRestrictedTokensForTipping but for the subscription flow.
  spendRestrictedTokensForSubscription: (
    eventId: string,
    amount: bigint,
  ) => Promise<UserSubSpendResult>;
  // Registry of publication canisters: [handle, canisterId] pairs.
  // Used to resolve the writer principal for a publication-based subscription.
  getPublicationCanisters: () => Promise<Array<[string, string]>>;

  // --- Article Keys (PR #14, decision #43) — ext_v2 NFT access keys for
  // premium articles. One ext_v2 canister per premium article; the registry
  // lives on PostCore. All reads are anon-safe queries; the transfer is authed
  // (the canister checks the caller controls the `from` address). ---
  // Registry of every premium-article NFT canister: [postId, canisterId] pairs.
  getAllNftCanisters: () => Promise<Array<[string, string]>>;
  // The caller's tokens on one ext_v2 canister, by account-id hex. `err` for
  // an account with no tokens is normal — the hook treats it as "none here".
  getOwnedExtTokens: (
    nftCanisterId: string,
    accountIdHex: string,
  ) => Promise<ExtTokensResult>;
  // Marketplace transactions + supply counters for one ext_v2 canister —
  // drives the "Key #N (of M)" supply denominator.
  getExtSupply: (nftCanisterId: string) => Promise<TransactionsAndSupply>;
  // EXT-standard NFT transfer (amount is always 1n for these keys). The token
  // field is the EXT token identifier — build it with extTokenIdentifier().
  transferExtToken: (
    nftCanisterId: string,
    request: ExtTransferRequest,
  ) => Promise<ExtTransferResponse>;
  // --- NFT purchase flow (NIC-128 §3.4) — lock → pay → settle sequence. ---
  // Returns the sale info for the premium article (price, supply, available
  // token index). availableTokenIndex === undefined means sold out.
  getAvailableToken: (
    nftCanisterId: string,
  ) => Promise<PremiumArticleSellingInformation>;
  // Lock the next available token for the buyer's account — returns the ICP
  // payment address (account-id hex) on success, a CommonError on failure.
  lockExtToken: (
    nftCanisterId: string,
    tokenId: string,
    price: bigint,
    buyerAccountIdHex: string,
  ) => Promise<ExtLockResult>;
  // Settle the purchase after payment — canister verifies the transfer landed
  // and assigns the token to the buyer. Returns ok:null on success.
  settleExtToken: (
    nftCanisterId: string,
    tokenId: string,
  ) => Promise<ExtSettleResult>;
  // Legacy ICP ledger transfer to a 32-byte account identifier (Withdraw,
  // PR #14, decision #43). Principal receivers go through transferIcrc1 on the
  // ICP ledger instead — both paths debit the same underlying account. amount
  // is e8s; the wrapper sets the ledger's fixed 10_000-e8s fee.
  transferIcp: (
    toAccountId: Uint8Array,
    amount: bigint,
  ) => Promise<IcpTransferResult>;
  // --- Search (NIC-41) — anon-safe queries. ---
  // Full-text search via PostRelations. Returns matching post IDs.
  searchPost: (query: string) => Promise<Array<string>>;
  // Anon-safe query; returns matching post IDs for a tag (case-sensitive exact match).
  searchByTag: (tag: string) => Promise<Array<string>>;
  // Fetch PostKeyProperties for a batch of post IDs from PostCore.
  // Named differently from the PostBucket-scoped getPostsByPostIds (3-arg).
  getPostKeyPropertiesByIds: (postIds: string[]) => Promise<Array<PostKeyProperties>>;
  // --- Writer/Publication profile (NIC-42) — anon-safe queries. ---
  // Returns the UserListItem for a given handle. Result_7 carries both
  // __kind__:"ok"|"err" — `err` means not-found; treat as null (don't throw).
  getUserListItemByHandle: (handle: string) => Promise<UserListItemResult>;
  // All published + draft PostKeyProperties for a writer handle — no range
  // argument; client-paginates newest-first.
  getUserPosts: (handle: string) => Promise<PostKeyProperties[]>;
  // Range-paginated published posts for a publication handle. Returns a bare
  // PostKeyProperties[] (no .posts wrapper, unlike getPopular*/getLatestPosts).
  getPublicationPosts: (
    from: number,
    to: number,
    handle: string,
  ) => Promise<PostKeyProperties[]>;
  // --- Manage Articles (NIC-40) — publication role checks. Anon-safe
  // PostCore queries; the principal is passed explicitly so they are
  // caller-independent. Drive the member-only route gate.
  isEditorPublic: (handle: string, principal: Principal) => Promise<boolean>;
  isWriterPublic: (handle: string, principal: Principal) => Promise<boolean>;
  // Published/draft/total counts for a handle. publishedCount + totalPostCount
  // are candid nat-as-text strings.
  getUserPostCounts: (handle: string) => Promise<UserPostCounts>;
  // Settle a tip: PostBucket reads the per-post subaccount balance, splits
  // 90% writer / 10% DAO, writes the Applaud record, and notifies the writer.
  // senderPrincipal is passed "" so the canister uses msg.caller. Called
  // fire-and-forget after the transfer lands.
  checkTippingByTokenSymbol: (
    bucketCanisterId: string,
    postId: string,
    symbol: string,
  ) => Promise<TippingResult>;
};

export const ActorsContext = createContext<ActorsValue | null>(null);

export function useActors(): ActorsValue {
  const v = useContext(ActorsContext);
  if (!v) {
    throw new Error("useActors() must be used inside <ActorsProvider>");
  }
  return v;
}
