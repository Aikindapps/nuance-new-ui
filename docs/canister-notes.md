# Canister Notes

Durable canister-shape facts for building against Nuance's live ICP backend. Maintained alongside the code; cross-references `docs/decisions.md` by number.

Nuance is an existing, live, SNS-governed ICP dapp (100% Motoko backend). This frontend talks to the **same mainnet canisters** — there is no local backend and no staging backend. Every write hits production data. These notes capture the canister-data-shape facts and gotchas that are NOT reconstructable from this repo's code or git history: things learned by reading the vendor Motoko and by probing mainnet directly.

The vendor monorepo (`github.com/aikindapps/Nuance`, cloned at `~/Projects/aikindapps-Nuance/` — per-machine, not in this repo) is the source of truth for Motoko behaviour and `.did` interfaces. The probe pattern (see below) is how ambiguities get settled against the live network.

---

## Where the interfaces live

- This repo's working copy of the interfaces is **`src/candid/`** — `.did` files plus generated TypeScript bindings (PostCore, PostBucket, User, Storage, Notifications, Subscription, Icrc1, Sonic, etc.). Generate bindings with `npx @icp-sdk/bindgen` against the `.did` files (decision #10 — `@icp-sdk/*`, not `@dfinity/*`; `dfx generate` emits the wrong imports).
- There is **no `src/declarations/`** in this repo.
- When you need a fresh or missing interface, pull it from the **vendor repo**: the real Nuance canister interfaces live at `~/Projects/aikindapps-Nuance/src/declarations/<Canister>/<Canister>.did`. Do **not** look in the vendor repo's `/candid/` — that directory only holds the SNS interfaces (`sns_governance`, `sns_ledger`, `sns_swap`, `sns_index`, `sns_root`), not the Nuance canisters.
- `PostIndex` has a canister-id entry but **no `.did`** in the vendor repo — there is no generated binding for it. Not needed for current UI work.
- Ledger / Sonic / index / ext_v2 bindings the new repo lacks can be copied from the vendor monorepo's bundled prod frontend at `~/Projects/aikindapps-Nuance/src/nuance_assets/services/` — they are generated against prod there.

## Authoritative prod-wiring reference

When mapping "how does nuance.xyz do feature X today," the source of truth is the **bundled production frontend inside the vendor monorepo**: `~/Projects/aikindapps-Nuance/src/nuance_assets/` (`store/` for canister-call wrappers, `screens/` for UI, `services/` for actor factories + ledger/Sonic declarations, `shared/` for utils). The standalone `aikindapps-nuance-frontend` repo (Sept 2025) is stale and thin — it has dead links without implementations. If recon reports "no backend method exists" for something demonstrably live in prod, treat it as a search miss and re-check against `src/nuance_assets/`.

## Canister roster

`canister_ids.json` defines **14 Nuance canisters** (mainnet `ic` IDs in `src/config/canister_ids.json` — this is the runtime backend map; the repo-root `canister_ids.json` is the dfx UAT asset canister only, unrelated):

`PostCore`, `PostBucket`, `PostIndex`, `PostRelations`, `User`, `Subscription`, `Storage`, `Notifications`, `NuaTransactionHistory`, `Metrics`, `CyclesDispenser`, `FastBlocks_EmailOptIn`, `KinicEndpoint`, `nuance_assets`.

Plus the production asset canister `nuance_assets` = `exwqn-uaaaa-aaaaf-qaeaa-cai` (also the production `derivationOrigin` — decision #27).

Authoritative-canister ambiguities:
- **`Notifications` vs `NotificationsV3`.** The vendor `src/` contains both, but only `Notifications` has an entry in `canister_ids.json` — that is the live one (`qrlrq-biaaa-aaaaf-qal2q-cai`). `NotificationsV3` is work-in-progress / pending deployment. Confusingly, the **behaviour to build against** (the `Notification` record shape, `getUserNotifications`) matches `NotificationsV3/main.mo` in the vendor repo — read that for the Motoko truth, but call the `Notifications` canister id.
- These are **multi-canister, auto-scaling** backends: `PostBucket` is one of an array of bucket canisters. A post's body lives in a specific bucket identified by `bucketCanisterId` on its key-properties record; you must construct a `PostBucket` actor for that id (factory, not singleton). `PostCore` is the single index/coordinator.
- Token ledgers, Sonic pools, and ledger index canisters are **not** Nuance canisters and are not in `canister_ids.json`; their config lives in `src/config/tokens.ts` (decision #42).

## Data-shape gotchas

- **`Comment.handle` and `Comment.avatar` come back blank on the wire.** `PostBucket.getPostComments` returns both as `""` for every comment even though the `.did` types them as `text` (not `opt text`). Only `comment.creator` (principal text) is reliably populated. Hydrate display fields (handle, displayName, avatar, isVerified) from the User canister keyed on the **principal** via `User.getUsersByPrincipals`, and do ownership checks on `principal`, never on handle. (Captured as the by-principal pattern in decision #35; this is the raw shape fact behind it.)

- **`Notification.content` carries principal-id text for every actor, never handles or avatars.** Same hydrate-by-principal requirement as comments, extended to a second canister type (decision #39). `collectPrincipals` is the single place enumerating which principal fields each of the 14 `NotificationContent` variants carries.

- **`User.followersArray` is the list of HANDLES the user FOLLOWS (forward direction), not the user's followers.** Misleadingly named. Internally the canister stores principals in `followersArrayHashMap`, but `buildUser` runs `buildHandlesFromPrincipalIdsArray` before returning the record — so the **wire shape is handles**, already lowercased and ready to pass to `PostCore.getPostsByFollowers`. For the reverse direction ("people who follow me") use `User.getMyFollowers()`, which reads a completely separate `myFollowersHashMap`.

- **User-canister handle lookups are case-sensitive via a lowercase reverse index.** Every `User` method that takes a handle (`getUsersByHandles`, `getUserListItemByHandle`, follow/unfollow) routes through `lowercaseHandleReverseHashMap`. Always `.toLowerCase()` a handle before passing it; a case mismatch returns a silently-missing entry (no error). The `handle` field on the returned `UserListItem` is the **case-preserved** form — use it for display, never for further lookups. Key any `Map<handle, UserListItem>` by `u.handle.toLowerCase()`.

- **`Post.category` can be the empty string**; `Post.avatar` is a URL string when set, `""` when the user never uploaded one.

- The article body is stored as an **HTML string** in the canister `content` field (legacy editor was Quill). The observed stored-HTML tag universe across real articles is exactly `a, blockquote, br, em, h1, h2, h3, img, li, ol, p, pre, span, strong, ul` — no `<hr>`, no `<figure>`, no inline `style=`. The canister does **not** sanitize on write, so rendered HTML is a stored-XSS vector — sanitize on read (decision #31).

## Tipping / token model

- **Every "clap" / "applause" on Nuance is a PAID multi-token tip — there are no free claps.** Despite `PostCore.clapPost: (text) -> () oneway` and a `claps: text` counter existing on every post, there is no Medium-style free multi-clap. `clapPost` is a legacy/internal path and is **not** the user-facing action.
- The user-facing tip is **multi-token**: NUA via `User.spendRestrictedTokensForTipping: (text, text, nat) -> (Result)`, or ICP / ckBTC / other ICRC-1 ledgers via a direct ICRC-1 transfer to a per-post subaccount + `PostBucket.checkTippingByTokenSymbol: (text, text, text) -> (Result)` to validate the transfer and write the `Applaud` record. For raw-actor argument order of `spendRestrictedTokensForTipping` and the both-legs-must-succeed partial-NUA rule, see decision #42 — do not copy the prod clap-modal's reordered call.
- The `Applaud` record on `PostBucket` (`getPostApplauds(postId)`, `getMyApplauds`, …) is the source of truth for tips on a post. It carries **`currency: text`** — never assume NUA. The post's `claps` counter reflects the aggregate of tips received.
- **Restricted (Free) NUA balances live at `owner = USER_CANISTER, subaccount = claimInfo.subaccount`** (queried via `icrc1_balance_of` on the NUA ledger with that owner/subaccount). Regular token balances are `icrc1_balance_of` per ledger on the user's own principal.
- **`User.claimRestrictedTokens` (Free NUA) requires a DecideAI-verified account** (`isVerified = true` in `isVerifiedUsersHashMap`, proof-of-humanity). A fresh per-origin principal (dev/UAT) is always unverified, so claim returns `#err("User is not verified. Cannot claim restricted tokens.")` — that is expected, not a wiring bug. Same precondition blocks restricted-NUA tipping. The full rejection ladder (claim inactive → blocked → not verified → claimed-within-a-week → daily cap → per-minute lock → already at max) is in the vendor `User/main.mo`. Surface the canister's own `err` string on claim/tip/transfer failures rather than generic copy — the real reason is otherwise invisible.

## Timestamps

- **Nuance Post timestamps are MILLISECONDS since epoch, stored as `Text`** — NOT the ICP nanosecond convention. `Post.publishedDate`, `Post.created`, `Post.modified` all pass straight to `new Date(parseInt(ms))`; do **not** divide by 1_000_000. There are three distinct date fields: `created` (draft creation), `publishedDate` (first publish), `modified` (last save). For "published" UI use `publishedDate || created` (legacy posts have `publishedDate == "0"`).
- **Notification timestamps are also milliseconds.** In the vendor `NotificationsV3/main.mo`, `epochTime() = Time.now() / 1_000_000`, so `Notification.timestamp` is ms.
- This unit is **per-canister** — do not assume it for other canisters (User, Storage, etc.). Check the Motoko for what each one persists before converting.

## Pagination semantics

- **Nuance paginated queries take `(indexFrom, indexTo)` as a half-open range `[from, to)`, NOT `(skip, count)`.** Applies to `PostCore.getPopularThisWeek` / `getLatestPosts` / `getPostsByFollowers` / `getMyFollowingTagsPostKeyProperties` and similar list-returning methods. The generated TS signature is just `(arg0: number, arg1: number)` and gives no hint — compute `indexTo = indexFrom + count` at the call site. The on-canister popularity formula is `(claps + applauds + 1) × (views + 1)`.
- **`Notifications.getUserNotifications(from, to)` is also half-open** (returns `to - from` items) and is a **non-certified `query`** — relevant if you ever rely on response certification, and relevant to optimistic-cache races (a `refetchOnWindowFocus` mid-flight can clobber an optimistic mark-read; cancel queries first).

## Home / article data pipeline (canister-call shape)

The standard list→hydrate pipeline (for any feed screen):
1. `PostCore.getPopularThisWeek(from, to)` or `getLatestPosts(from, to)` → returns `PostKeyProperties` (lightweight metadata: postId, `bucketCanisterId`, claps, dates, **tags**). Tags live on `PostKeyProperties`, not on the bucket post.
2. Group postIds by `bucketCanisterId`, then per bucket `PostBucket(bucketId).getPostsByPostIds(ids, includeDraft: false)` for full posts. Keeps bucket calls O(buckets), not O(posts).
3. Collect unique handles from the posts, **lowercase every handle**, one `User.getUsersByHandles([...])` to hydrate avatars / displayNames / verified / follower counts. Key the resulting map by `u.handle.toLowerCase()`.
4. Publications are `User` records with `isPublication = true`, looked up the same way.

`PostKeyProperties` payloads are small; ICP query responses cap at ~2MB. Fetching a few hundred keyProps in one call is cheap (basis for the decision #28 fetch-once-paginate-client-side approach for unioned sources).

## Wallet History / Article Keys (PR #14 — decision #43)

Shipped in PR #14 (`7bc6d31`) and logged as **decision #43**. Implementing code lives in `src/features/wallet/{keys,history}/` and `src/config/tokens.ts`. The one live caveat is the stale **vendor** `IcpIndex` / `ExtV2` declarations (the live `IcpIndex` has a `timestamp` field the vendor `.did` lacks) — regenerate against the live canisters when touching these paths:
- **Article Keys are ext_v2 NFTs.** There is no owner index. To list a user's keys you must sweep **every** ext_v2 canister returned by `PostCore.getAllNftCanisters` and call `tokens_ext` on each (prod parity). Key transfer is `ext_transfer`; EXT token-identifier encoding is needed to address a token. There is **no canister surface to claim a key by resale code** — that input is necessarily an inert stub.
- **Wallet History is a client-side merge of 7 sources** (no single history endpoint): applauds across buckets, ext_v2 key buys/sells, ICP via its index canister, **NUA via the SNS index canister `q5mdq-biaaa-aaaaq-aabuq-cai`** (the rebuild reads the SNS index deliberately instead of prod's full-ledger scan), ckBTC via its index, Free-NUA claim deposits, and subscriptions. Ledger rows are deduped against tip-escrow / NFT-seller / canister counterparties. The vendor's `IcpIndex` and `ExtV2` declarations are stale (the live `IcpIndex` has a `timestamp` field the vendor `.did` lacks); re-pull / regenerate against the live canisters.
- The `Subscription` canister rows carry `paymentMethod`; Stripe-paid rows are skipped (no on-chain counterpart).

## Address / withdrawal facts

- **ICP deposit address is the legacy account-identifier** derived from the principal (`principalToAccountIdentifier`); NUA and ckBTC deposit addresses are the bare principal. Account-id derivation is CRC32 + SHA-224 (self-consistency checkable via the `scripts/verify-account-id.ts` probe).
- ICP withdrawal accepts **either** a checksum-validated 64-hex account-id (legacy ledger `transfer`) **or** a principal (`icrc1_transfer`); NUA/ckBTC are principal-only. Self-send must be rejected in both address forms. Max withdrawable = `balance − fee`, floored (not rounded).

## Verification pattern (data problem vs code problem)

When a canister-returned record renders blank/wrong, or you are unsure of a field's real wire shape, **do not theorize against the `.did` types** — probe mainnet directly. The reusable template is `scripts/probe-*.ts` (e.g. `scripts/probe-comments.ts`): an anonymous `HttpAgent` → real canister call → dump the JSON shape. This is how `Comment.handle`/`avatar` being blank was settled, and how `getUsersByPrincipals` was confirmed to return fully-populated records. Probes live under `scripts/` (outside `src/`, eslint-disabled); adapt one for the next surprise. Runtime React errors from canister-shape mismatches often surface only in the **Vite dev-server log** (`[Unhandled error]`), not the browser console — read that log before guessing.
