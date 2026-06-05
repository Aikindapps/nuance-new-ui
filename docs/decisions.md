# IC Dev — Decision Log

Significant decisions that shape the project. Append-only. If a decision is reversed, mark the old entry "Superseded by #N" rather than editing it.

Each entry captures: **what was chosen**, **what else was considered**, and **why** — so future-us (or anyone picking this up) understands the reasoning, not just the outcome.

---

## #42 — Page 7 (Funds) sequencing + PR-1 scope; standalone /wallet; bigint + both-legs tipping

**Date:** 2026-06-03

**Status:** Active.

**Decision:** Page 7 "Funds Overview" + Page 4 §4.2 "Tip Author" are built across multiple PRs, not one. **PR-1 = shared token infrastructure + Currency-holdings balances + Free-NUA claim + the §4.2 Tip Author modal.** Deferred to later PRs: the Wallet History table (a 7-source client-side aggregation), Article Keys (ext_v2 NFT), and the full Deposit/Withdraw flows (their buttons render but stay inert "Coming soon" per the decision #26 stub convention). Four sub-decisions inside PR-1:
1. **Standalone `/wallet` route**, not a profile tab. The Figma shows the wallet as one tab in a profile nav (`1:48372`/header `1:48373`), but no profile-tab infrastructure exists in the rebuild yet; building it would balloon PR-1. Ship `/wallet` as a flat lazy route with `HeaderLoggedIn`, exactly like `/notifications`. Profile-tab integration is a future PR.
2. **bigint end-to-end for all ledger amounts** (balances, transfers, fees); convert to `number` only at the display boundary (`fromE8s`/`formatToken`) and for the inherently-float Sonic cross-rate display. Prod uses `Number` throughout and risks precision loss on large e8s values — this is a deliberate improvement.
3. **Tipping requires both legs to succeed.** When Free-NUA partially covers a NUA tip, the restricted-spend and the regular-transfer run in `Promise.all`. Prod accepts success if *either* leg resolves (can leave a half-applied tip); PR-1 requires both and surfaces a precise partial-failure error.
4. **Token/ledger/Sonic config lives in a new `src/config/tokens.ts`** (typed module), not `canister_ids.json` — ledgers and Sonic pools are not Nuance canisters. `USER_CANISTER_ID` is re-exported from `canister_ids.json` to avoid drift.

**Inputs:**
- Initial recon wrongly concluded the funds/history/keys backend was missing. Mr Nick corrected: **all of it is live in production today** (except BNB, illustrative in the Figma). The authoritative wiring is the monorepo's bundled prod frontend at `~/Projects/aikindapps-Nuance/src/nuance_assets/` — verified call sites for balances (`icrc1_balance_of` per ledger; restricted NUA at `owner=USER_CANISTER, subaccount=claimInfo.subaccount`), claim (`User.claimRestrictedTokens`), tipping (`spendRestrictedTokensForTipping` + per-post-subaccount `icrc1_transfer` + `checkTippingByTokenSymbol` settlement), and Sonic price quotes.
- Full Page 7 is 5 blocks; History and Keys are each large and independent. Tipping shares the balance/Sonic/transfer infra with holdings, and was the original reason to do Page 7 — so it leads.
- `User`/`PostBucket` bindings for claim/tip already exist in `src/candid/`; only ICRC-1 + Sonic bindings are missing.

**Options considered (sequencing):** A. Infra+Balances+Tip+Claim first (**chosen**); B. whole Page 7 in one large PR (rejected — too big, History/Keys backend-heavy); C. tip-only first (rejected — wastes the shared balance work); D. wallet-page-first, tipping later (rejected — front-loads the heavy aggregation before the high-value feature).

**Trade-offs accepted:**
- Real-money risk: tip/claim are irreversible mainnet transfers and UAT shares prod backends. Mitigated by minimal-amount manual test protocol on a throwaway funded principal.
- `/wallet` lacks the Figma's profile-tab chrome until a later PR.

**How to apply:**
- Build per the approved plan (`~/.claude/plans/wild-jingling-honey.md`). Arg order for `spendRestrictedTokensForTipping` is `(bucketCanisterId, postId, amount)` at the raw-actor layer — do **not** copy the prod clap-modal's reordered call.
- Later PRs pick up Wallet History, Article Keys, and Deposit/Withdraw; this decision does not pre-commit their design.

**Update (2026-06-05) — Deposit promoted from inert stub to a read-only address view.** During PR-1 build the Deposit button graduated from the "Coming soon" stub (point 15 above) to `src/features/wallet/deposit/DepositModal.tsx`: a read-only modal showing the user's deposit address for the selected token — ICP by its legacy account-identifier (`principalToAccountIdentifier`), NUA/ckBTC by principal — with copy-to-clipboard. **No transfer call; it moves no money.** Withdraw stays deferred-inert. Account-identifier derivation is covered by `scripts/verify-account-id.ts` (CRC32 + independent SHA-224 self-consistency). Point 15 now reads: Withdraw inert "Coming soon"; Deposit = read-only address view; Wallet History + Article Keys still deferred.

---

## #1 — Scope: frontend only

**Date:** 2026-04-21
**Status:** Active

**Decision:** This project builds a new frontend for Nuance only. No Motoko backend work, no new canisters, no SNS changes.

**Options considered:**
- A. Fresh frontend talking to existing mainnet canisters. **Chosen.**
- B. Rebuild both frontend and backend.

**Rationale:** Nuance already exists — live at nuance.xyz, 100% Motoko, SNS-governed, ~7K users. The existing canisters work. The "UX overhaul" line item on the Nuance roadmap is a frontend problem, not a backend one. Touching Motoko would expand scope dramatically and require SNS governance.

---

## #2 — Stack: React + TypeScript + Vite

**Date:** 2026-04-21
**Status:** Active

**Decision:** Build with React + TypeScript, bundled by Vite.

**Options considered:**
- A. Match existing stack exactly (React + TS + webpack, dfx 0.14.3 era).
- B. React + TS + **Vite** — same language/framework, modern bundler. **Chosen.**
- C. Different framework entirely (Next.js, SvelteKit, etc.).

**Rationale:** React + TS matches the existing Nuance frontend, keeping familiarity for Aikin Dapps if code is ever shared back. Vite replaces the ~3.5-year-old webpack setup — faster dev loop, simpler config, current community default. No reason to pull in a framework like Next.js for an ICP asset-canister-hosted SPA.

---

## #3 — Scaffold approach: fresh, not fork

**Date:** 2026-04-21
**Status:** Active

**Decision:** Start a fresh Vite + React + TS project. Do not fork the existing `aikindapps/Nuance` monorepo or the standalone `aikindapps/nuance-frontend` repo.

**Options considered:**
- A. Fork `aikindapps/Nuance` monorepo and strip to frontend.
- B. Fork `aikindapps/nuance-frontend` standalone repo.
- C. Fresh scaffold, use the old repos as read-only reference. **Chosen.**

**Rationale:** `aikindapps/Nuance` uses webpack + dfx 0.14.3 (~3.5 years stale). `aikindapps/nuance-frontend` last updated Sept 2025 — also stale. Forking would inherit outdated tooling and irrelevant history. Fresh scaffold is cleaner; old repos stay as a `vendor/` reference for `.did` files, canister IDs, and architectural patterns.

---

## #4 — Figma access: hosted MCP plugin

**Date:** 2026-04-21
**Status:** Active

**Decision:** Use the hosted Figma MCP via the `figma@claude-plugins-official` plugin.

**Options considered:**
- A. Figma Desktop Dev Mode MCP (local).
- B. Hosted `figma@claude-plugins-official` plugin. **Chosen.**

**Rationale:** Mr Nick's Figma desktop was too old to expose the Dev Mode MCP toggle. Rather than fight a desktop upgrade, switched to the hosted plugin path. Works with Mr Nick's existing Figma Professional plan.

---

## #5 — Deployment: local only (for now)

**Date:** 2026-04-21
**Status:** Active

**Decision:** This project will deliver a fully working Nuance UI running locally against live mainnet canisters. **No production deploy from this project.**

**Options considered:**
- A. Ship to the existing Nuance asset canister (replaces nuance.xyz in place).
- B. Ship to a separate/staging asset canister, run in parallel.
- C. Local only; defer production deploy strategy. **Chosen.**

**Rationale:** Nuance is an SNS-governed DAO. Any production update requires an SNS proposal, community vote, and SNS/NNS-driven deployment — not something Mr Nick can push directly. Attempting to plan a prod deploy now is premature; the DAO would drive that. Local-first means we can prove out the full UX against real mainnet canisters without governance overhead. Production swap strategy revisited once the local build is screen-complete.

**Implications:**
- No preview canister, no staging, no DNS work
- No SNS proposal scaffolding in this repo
- `dfx start` + local replica is sufficient for end-to-end testing
- The UI still hits **live mainnet canisters** — only the static asset serving is local

---

## #6 — Folder structure: modernized (Option B)

**Date:** 2026-04-21
**Status:** Active

**Decision:** Use a modern React structure — roughly `/features` (vertical slices), `/components` (shared UI), `/lib` (agent, candid, utilities), `/routes` (page-level). Exact shape refined as the app grows.

**Options considered:**
- A. Carry forward the old `nuance-frontend` convention: `/modules`, `/ui`, `/services`, `/screens`, `/context`.
- B. Modernized vertical-slice structure. **Chosen.**
- C. Start minimal, add folders only under pressure.

**Rationale:** This is a fresh repo with no structural debt. Vertical-slice `/features` colocates the code that changes together (components, hooks, services for one feature) which scales better than horizontal `/services` + `/modules` as the app grows. Modern community patterns mean more matching examples when searching for help.

**Trade-offs accepted:**
- Cross-referencing `aikindapps/nuance-frontend` requires translating between conventions. Mitigated by treating that repo as architectural inspiration, not a copy source.
- "Feature" vs "shared" is a judgment call — expect minor reorganizations as real features land.
- Less familiar to Aikin Dapps if they ever inherit or reference this code. Accepted because the more modern structure is worth more than the familiarity cost.
- A few more opinionated choices (Context placement, canister client location) fall on Claude. Will document each as it comes up.

---

## #7 — Styling: Tailwind CSS

**Date:** 2026-04-21
**Status:** Active

**Decision:** Style with Tailwind CSS. Design tokens (colors, spacing, type, radii, etc.) will be configured in `tailwind.config` based on what the Figma file provides.

**Options considered:**
- A. **Tailwind CSS.** **Chosen.**
- B. CSS Modules.
- C. Vanilla CSS + custom properties.
- D. styled-components / emotion (CSS-in-JS).

**Rationale:** Tailwind is the current React community default, maps cleanly to Figma design tokens / variables (each token becomes a config entry), and gives a fast-to-build utility surface that matches how we'll work — one screen at a time, iterating visually. Mr Nick confirmed it as fine.

**Open follow-up:** whether `UX-Overhaul-2` has proper Figma variables that should drive the Tailwind config, or whether tokens need to be extracted/invented. Logged as next action — Claude will inspect the Figma file and report before scaffolding. **Resolved in #8.**

---

## #8 — Design tokens: extract-from-usage, not variable-driven

**Date:** 2026-04-21
**Status:** Active

**Decision:** Build the Tailwind design token set incrementally by extracting values from Figma components as we implement them. Do not expect a designer-provided token manifest.

**Inputs (what Claude found when inspecting `UX-Overhaul-2`):**
- The file has one team library subscribed: **Aikin team library**.
- Components are real and well-organized with a `NUR /` naming convention (e.g., `NUR / Button primary`, `NUR / Input / Text`, `NUR / Article summary`, `NUR / Header`, `NUR / Popup`, `NUR / Tag`, `NUR / Author block`, `NUR / Publication block`).
- `get_variable_defs` returned "nothing selected" errors; `search_design_system` across `color`, `NUR`, `nuance`, `spacing`, `typography` returned **no variables and no styles from the Aikin library**. All token-like results came from unrelated community libraries (iOS, Material 3, watchOS, visionOS).
- Conclusion: the Aikin library publishes **components**, not **variables/styles**. Color, spacing, and type values are embedded as raw hex/px/font values inside component frames.

**Options considered:**
- A. Drive `tailwind.config` from Figma Variables (Pattern A). **Not viable** — there are no variables to drive it from.
- B. Extract tokens from component frames as we implement each screen; grow `tailwind.config` incrementally. **Chosen.**
- C. Invent a token system up front and force the Figma designs to fit it.

**Rationale:** Option B matches the reality of the file. First few screens will set most of the palette, type scale, and spacing; subsequent screens mostly reuse with small additions. Keeps us honest to the design without inventing fiction.

**Trade-offs accepted:**
- Higher risk of inconsistency in the token set (e.g., two near-identical grays both ending up in config) — mitigated by pausing periodically to dedupe/normalize.
- Slower than if tokens were pre-defined, but only for the first 2-3 screens.
- If/when Aikin publishes variables to their library later, we should revisit and sync.

**How to apply:** For each component we build, call `get_design_context` on the Figma component, harvest colors/spacing/typography/radii, add to `tailwind.config` with semantic names (not raw hex names), reuse aggressively.

---

## #9 — Vendor repo lives outside iCloud, on this machine only

**Date:** 2026-04-21
**Status:** Active

**Decision:** Clone `aikindapps/Nuance` (the reference monorepo with `.did` files and canister IDs) to **`~/projects/aikindapps-Nuance/`** on this machine (hostname: `Mac`). Outside iCloud Drive. Full-history clone (no shallow), since iCloud isn't involved.

**Options considered:**
- A. **Outside iCloud, this machine only.** **Chosen.**
- B. Sibling to "IC Dev" but still in iCloud (e.g., `~/.../Claude/vendor-Nuance/`).
- C. Inside `./IC Dev/vendor/Nuance/` — colocated.
- D. C + `--depth 1` + editor excludes.

**Rationale:**
- The vendor repo is a **read-only reference** — `.did` files, canister IDs, architectural patterns. We don't edit it.
- Keeping it out of iCloud avoids the two real gotchas: hundreds of MB of sync load, and iCloud's poor handling of `.git` folders (thousands of tiny files → sync stalls, occasional corruption).
- Mr Nick accepted the trade-off explicitly: "I just need to make sure this activity continues on this machine."

**Trade-off accepted (important):**
- **This project now has machine-specific state.** If Mr Nick moves to another machine, the nuance-ui code comes with him via iCloud, but the vendor reference does not. Re-cloning is a one-line command (`git clone https://github.com/aikindapps/Nuance.git ~/projects/aikindapps-Nuance`), but it needs to happen before any work that reads `.did` files or canister IDs.
- `.did` files and `canister_ids.json` WILL be copied into `./nuance-ui/` (which is in iCloud), so the ongoing frontend work doesn't depend on the vendor repo being present. The vendor repo is only needed when we need to look things up, check new interfaces, or pull fresh `.did` files.

**How to apply:** At session start, if any vendor lookup is needed, check `~/projects/aikindapps-Nuance/` exists. If not, clone before proceeding. Future sessions on this same machine should find it already there.

---

## #10 — ICP client SDK: `@icp-sdk/core` + `@icp-sdk/auth`

**Date:** 2026-04-21
**Status:** Active

**Decision:** Use **`@icp-sdk/core`** (v5.x) for agent, candid, identity, and principal. Use **`@icp-sdk/auth`** for the AuthClient (Internet Identity flow). Do NOT use the classic `@dfinity/agent`, `@dfinity/auth-client`, `@dfinity/candid`, `@dfinity/principal`, `@dfinity/identity` — all deprecated as of 2026-04-14.

**Options considered:**
- A. Stay on `@dfinity/*` v3.4.3 (deprecated but working). Matches old Nuance code patterns.
- B. **Migrate to `@icp-sdk/core` + `@icp-sdk/auth`.** **Chosen.**
- C. Hybrid — use new core but keep classic auth-client. Rejected (auth-client also deprecated; hybrid adds peer-dep friction).

**Inputs:**
- `@icp-sdk/core` is first-party DFINITY (github.com/dfinity/icp-js-core), Apache-2.0, actively maintained by 7 DFINITY staff.
- Deprecation notices on all 5 `@dfinity/*` packages were published 2026-04-14 (~1 week before this decision).
- `@icp-sdk/core` v5.3.0 published 2026-04-16 (5 days ago); 9-month history from 1.0.0-beta to 5.x.
- Weekly downloads: 33K for `@icp-sdk/core`, 97K for legacy `@dfinity/agent` — crossover in motion, legacy still leads.
- `dfx generate` still emits bindings that import from `@dfinity/*`. DFINITY's answer is `@icp-sdk/bindgen` (v0.1+, Oct 2025) — emits bindings that import from `@icp-sdk/core`.

**Rationale:** Fresh project; migration cost is zero today and grows every day we build on deprecated packages. Single package with subpath exports (`@icp-sdk/core/agent`, `/candid`, etc.) is cleaner than juggling five peer-dep packages at matching versions.

**Trade-offs accepted:**
- Ecosystem is in transition — Plug and NFID wallet adapters may still require classic `@dfinity/auth-client` internals. Decision deferred: verify adapter compatibility when we actually wire Plug/NFID. Internet Identity via `@icp-sdk/auth/client` is expected to work cleanly.
- Fewer Stack Overflow answers and examples online. Official docs at `js.icp.build` are the primary resource.
- TypeScript binding generation will use `@icp-sdk/bindgen` rather than `dfx generate`.

**How to apply:**
- Imports: `@icp-sdk/core/agent` for HttpAgent + Actor; `@icp-sdk/core/principal` for Principal; `@icp-sdk/core/identity` for key identity; `@icp-sdk/auth/client` for AuthClient.
- Binding generation: `npx @icp-sdk/bindgen` pointed at `.did` files.
- If rolling back: reinstall five `@dfinity/*` packages and flip import paths. Straightforward but grows in cost with each file written.

---

## #11 — Tailwind CSS v4 with CSS-first config

**Date:** 2026-04-21
**Status:** Active

**Decision:** Use Tailwind CSS **v4.2.3** with the `@tailwindcss/vite` plugin. Configuration lives in CSS via `@theme` directives, not a `tailwind.config.js` file. No PostCSS / Autoprefixer needed.

**Options considered:**
- A. Downgrade to Tailwind v3 (more examples and docs online).
- B. **Stay on v4 (what npm installed by default).** **Chosen.**

**Rationale:**
- v4 is the current stable and what `npm i tailwindcss` resolves to in April 2026.
- CSS-first `@theme` configuration maps cleanly to decision #8 (tokens-from-usage) — we extract tokens from Figma and add them directly into the CSS `@theme` block as we implement screens. No context-switch to a JS config file.
- For Vite projects, `@tailwindcss/vite` replaces the PostCSS pipeline — simpler, faster HMR.
- Rollback to v3 is cheap if we hit walls (`npm install tailwindcss@^3 postcss autoprefixer` + regenerate config).

**How to apply:**
- `vite.config.ts` imports `@tailwindcss/vite` and adds `tailwindcss()` to the plugins array.
- `src/index.css` contains `@import "tailwindcss";` followed by an `@theme { ... }` block where tokens get added.
- No `tailwind.config.js`. No `postcss.config.js`.
- Token additions happen in the `@theme` block as each Figma screen is implemented.

---

## #12 — SEO-first architecture; React Router v7; mock-first data; scale-to-fit responsive posture

**Date:** 2026-04-21
**Status:** Active — **responsive-posture portion superseded by #13; data-strategy portion superseded by #14**

**Decision:** For the first real screen (Page 11 "Home - not logged in"), lock in a bundle of related architectural choices driven by SEO as a first-class constraint:

- **Routing:** `react-router-dom@^7` with real URLs. `/` = Popular tab, `/new` = New tab. `/probe` kept alive temporarily. No hash routes; no state-only tabs.
- **Per-route metadata:** React 19 native hoisting of `<title>` / `<meta>` / `<link>` from JSX. No `react-helmet-async` dependency.
- **Data strategy for first pass:** mock fixtures for all cards (articles, authors, publications). Live `PostCore` / `User` wiring is a separate follow-up chunk so layout and data reviews stay independent.
- **Responsive posture:** scale-to-fit from a 1920px Figma reference. No mobile layout (the Figma file has no mobile variant). Accept visible breakage below ~1024px for now.
- **Scope:** both Popular + New tabs are in scope for this screen's plan.

**Inputs:**
- Mr Nick flagged SEO as a first-class constraint: "SEO is important. So our design choices need to ensure that crawlers have no friction."
- Nuance is a content platform (~16K articles, 300K views) — organic discovery matters.
- Figma file has no mobile variant and no Figma Variables (confirmed 2026-04-21). All tokens extracted from usage (decision #8).
- Probe already confirmed live `PostCore.getLatestPosts` works — deferring live data is a choice, not a technical limit.
- Scaffold was already minimal (just `Probe`), so adding a router now has near-zero migration cost.

**Options considered:**
- Routing: A) state-only tabs — rejected (SEO-hostile); B) hash routes — rejected (crawler-unfriendly); C) query param `?tab=`; D) **React Router real URLs.** **D chosen.**
- Metadata: A) **React 19 native.** **Chosen.** B) react-helmet-async; C) defer infrastructure.
- Data: A) **mock-first, live follow-up.** **Chosen.** B) hybrid (PostCore for articles, mock rest); C) live everywhere.
- Responsive: A) **scale-to-fit.** **Chosen.** B) strict 1920 fixed; C) mobile-first responsive (invent what Figma doesn't show).
- Scope: Popular only vs **both tabs in plan** → both chosen.

**Rationale:** SEO rules out state-only tabs entirely. With that constraint, a real router is the cleanest path and pays for itself on every subsequent screen. Mock-first separates concerns — layout bugs won't tangle with data-shape bugs during review. Scale-to-fit matches Figma pixel fidelity at the design reference width while not locking us out of a future mobile pass.

**Trade-offs accepted:**
- Client-side rendering still means crawlers without JS execution won't see content. Mitigated by architecting URLs / semantic HTML / metadata correctly now so a future pre-rendering / SSR layer slots in without rework. Full SEO (pre-rendering) is a production-handoff concern deferred to the DAO (decision #5).
- Two routes double-render a lot of the same layout. Acceptable — the component-level code is shared; only fixtures differ.
- Mock data will need to be replaced; we're explicitly choosing this cost up front for faster layout iteration.
- Below ~1024px the layout visibly breaks. Accepted because the Figma file has no mobile design to match.

**How to apply:**
- New screens default to a new route with a unique `<title>` + `<meta description>`.
- Tab-like UI states become sibling routes, not React state toggles, unless there's an explicit reason (ephemeral, non-indexable UI state).
- For cards/lists that eventually need canister data: build with mocks first, wire live data in a distinct follow-up commit.
- When in doubt about a pattern's SEO impact, re-check the "SEO is a first-class design constraint" project memory before adopting it.

---

## #13 — Responsive strategy: mobile-first with Tailwind breakpoints

**Date:** 2026-04-21
**Status:** Active. Supersedes the responsive-posture portion of #12.

**Decision:** Build every screen mobile-first using Tailwind's default breakpoints (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536). The Figma design at 1920 is the reference for `lg:` and above. Below `lg:`, we design responsive behavior ourselves (since the Figma file has no mobile variants).

**Inputs:**
- Mr Nick's intent from the start was to use Tailwind breakpoints for responsive layouts. My earlier option framing in #12 ambiguously bundled "use Tailwind's container + flex/grid" (which Mr Nick read as "breakpoints") with "no mobile-specific code" (which was my intended meaning). The ambiguity wasn't caught until the Hero rendered on a narrower viewport and nothing restacked.
- SEO weighs mobile usability (Google's mobile-first indexing) — a non-responsive site hurts rankings. This strengthens the case for proper responsive.
- Tailwind breakpoints are industry standard for this pattern; no need for a custom system.

**Options reconsidered:**
- A. No responsive code (previous #12 wording). **Rejected** after Mr Nick clarified intent.
- B. **Mobile-first with Tailwind breakpoints.** **Chosen.**
- C. Desktop-first (max-width queries). Rejected — inverts Tailwind's default convention and makes the unprefixed classes mean "widest screen", which is non-idiomatic.

**Rationale:** Building mobile-first matches Tailwind's grain, keeps SEO posture strong (mobile usability counts), and matches how every comparable content platform (Substack, Medium, Ghost) handles the same screen shape.

**Trade-offs accepted:**
- Mobile designs are invented by Claude since Figma doesn't provide them. Mr Nick reviews each chunk visually — any mobile rendering he doesn't like gets course-corrected inline rather than pre-specified.
- More classes per element (`class="... md:... lg:..."`) — verbose but standard.
- Mobile breakage before lg+ is no longer acceptable; we design the mobile versions as we build.

**How to apply:**
- Default / unprefixed classes = mobile (smallest intended viewport, effectively ~360px)
- `md:` (768+) = tablet-ish; introduce horizontal layouts, reveal previously-stacked items
- `lg:` (1024+) = approaches desktop; show full nav, etc.
- `xl:` / `2xl:` (1280 / 1536+) = match Figma proportions
- For invented mobile patterns (hamburger menus, search-as-icon, stacked grids), use common patterns from substack/medium/ghost as reference unless Mr Nick specifies otherwise.
- Any pattern that can't be made mobile-responsive without breaking the design intent gets flagged to Mr Nick before shipping.

---

## #14 — Live mainnet data from day one; TanStack Query; three-canister hydration

**Date:** 2026-04-21
**Status:** Active. Supersedes the data-strategy portion of #12.

**Decision:** Every screen fetches real mainnet data via canister calls. No hard-coded mock fixtures. Use **TanStack Query** (`@tanstack/react-query`) for all data fetching, caching, loading, and error states. For the Popular / New home screens, the pipeline is three canister calls in sequence: `PostCore.getPopular` / `getLatestPosts` → group postIds by bucket → `PostBucket(bucketId).getPostsByPostIds` → collect handles → `User.getUsersByHandles` to hydrate author avatars/display names and publication names.

**Inputs:**
- Mr Nick's correction mid-Chunk C: "The images from the articles need to be displayed. I thought we agreed this would link to production backend so that included all content?"
- The earlier "mock first" option (in #12) used ambiguous terminology; Mr Nick read "mock fixtures" as "mock scaffolding with real backend content" — the ambiguity is captured in the project lessons file.
- The probe already confirmed PostCore calls work in production. Wiring additional canisters is straightforward incremental work.
- Alternative simpler paths (PostCore-only, no image data) deliver essentially no article content, so they're not viable for the home screen.

**Options considered:**
- A. Mock fixtures first (original #12 wording). **Rejected** after Mr Nick clarified intent.
- B. **Live mainnet data from day one via TanStack Query + 3-canister fetch.** **Chosen.**
- C. Live article data only; skip author/publication hydration. Rejected — avatars/publication names are visible on the card and would look broken without them.

**Rationale:**
- Layout + data mature together; no "wire the data later" step that drags once screens pile up.
- TanStack Query gives stale-while-revalidate caching, retry, loading states, and request deduplication out of the box. Matches what `aikindapps/nuance-frontend` uses; familiar to anyone looking at both codebases.
- Grouping by `bucketCanisterId` keeps bucket calls O(buckets), not O(posts).

**Trade-offs accepted:**
- First page load is slower — three sequential canister calls on the critical render path. Mitigated by React Query caching; subsequent visits are cached for 2 minutes (`staleTime`).
- Real mainnet data is whatever's on chain — titles/images/excerpts will look different from the pristine Figma mockup. Accepted; it's the honest representation.
- Generated bindings for PostBucket didn't include `// @ts-nocheck` by default and required a manual patch (newer bindgen version changed the behavior).
- Bundle size jumped from ~515kB → ~590kB after adding React Query + PostBucket bindings. Acceptable for an SPA of this scope; revisit if mobile Lighthouse scores suffer.

**How to apply:**
- New data-fetching screens: write a `useX` hook in `src/features/<feature>/hooks/` that wraps `useQuery`. Put actor helpers in `src/lib/actors.ts` (singleton actors for fixed canisters; factory for variable-ID canisters like PostBucket).
- Always handle the four React Query states explicitly: `isLoading`, `isError`, empty `data.length === 0`, and populated.
- Use `staleTime` not `cacheTime` for "how long until refetch" — default 2 min works for home/explore type pages; tune per use case.
- For cross-canister hydration (like authors), collect handles/IDs into a Set, batch-fetch, then map back.

---

## #15 — Manrope as the permanent GT Walsheim substitute

**Date:** 2026-04-22

**Status:** Active

**Decision:** Use **Manrope** (Google Fonts, free) as the project's type face. Supersedes the earlier Poppins substitute. GT Walsheim licensing is explicitly not pursued.

**Inputs:**
- Figma spec: "GT Walsheim Trial" (Grilli Type, commercial license, ~$200-500 one-off for web use).
- Mr Nick's direction during Chunk 4 of Bucket A polish: "swap to a closer free alternative" — explicitly rejecting both GT Walsheim licensing AND keeping Poppins permanently.
- Poppins was close-enough for the initial build but drifts on character shapes (lower-case `a`, `g`, counter widths) that make it feel distinctly different from GT Walsheim.

**Options considered:**
- A. License GT Walsheim (commercial, ~$200-500). **Rejected** — cost without proportional brand benefit at this stage; SNS DAO would also need the license if/when production handoff happens.
- B. Keep Poppins permanently. **Rejected** — visible drift from Figma.
- C. **Manrope** (Google Fonts). Geometric sans, tall x-height, open counters, 8 weights (200-800). Closest tonal match to GT Walsheim among free options. Widely battle-tested (GitHub, Vercel). **Chosen.**
- D. Figtree (Google Fonts). Newer, friendly geometric. Very close visually, but less battle-tested and fewer weights.
- E. Rubik (Google Fonts). Geometric with rounded terminals. A step "softer" than GT Walsheim; good for display but less neutral at body.

**Rationale:**
- Manrope's x-height and counter shapes land closer to GT Walsheim than Poppins' compressed proportions.
- Google Fonts hosting = zero ops cost, fast CDN, familiar to contributors.
- Four weights loaded (400/500/600/700) cover every `font-medium` / `font-bold` / default use in the code today plus one headroom weight.

**Trade-offs accepted:**
- Not a perfect GT Walsheim match; a careful eye can still see the difference at display sizes.
- Swap affects rendering on every page. Manual visual review needed at mobile / tablet / desktop.
- If the DAO ever decides to pay for GT Walsheim, the swap is one `@theme --font-sans` change away.

**How to apply:**
- Font family is set in exactly two places: `nuance-ui/index.html` (Google Fonts `<link>`) and `nuance-ui/src/index.css` (`@theme --font-sans`). All components reference `var(--font-sans)` through Tailwind's default `font-sans` utility.
- Do not introduce additional fonts without a new decision entry.
- When adding weights outside 400-700, update both the Google Fonts URL in `index.html` and whatever component needs it.

---

## #16 — nuance-new-ui source tree lives outside iCloud, this machine only

**Date:** 2026-04-22 (move-out decision) / 2026-04-23 (final location chosen and executed)

**Status:** Active

**Decision:** The `nuance-new-ui` repo lives at **`~/Projects/nuance-new-ui/`** on this machine (hostname: `Mac`). Outside iCloud Drive. Mirrors the pattern of decision #9 for the vendor repo.

**Inputs:**
- Mr Nick observed iCloud sync issues on 2026-04-22 while the repo was tracked in iCloud (`IC Dev/nuance-ui/`).
- Specific pain: `.git/` contains thousands of small files; iCloud serializes metadata operations and can evict or partially sync `.git/objects/*`, which corrupts git state.
- Same class of risk flagged in decision #9 but not acted on for nuance-ui at the time — it was accepted there because the frontend tree was expected to be small.

**Options considered:**
- A. Keep in iCloud, accept occasional sync glitches. **Rejected** — active development, corruption risk is real.
- B. Keep in iCloud, but exclude `.git/` via `.nosync` convention. **Rejected** — iCloud ignores non-Apple exclusion mechanisms; only `.icloud` placeholder files work, and those can't be applied retroactively to `.git`.
- C. Move to a sibling folder outside iCloud on this machine only (`~/Projects/nuance-new-ui/`). **Chosen.** Matches decision #9; predictable; zero sync involvement.
- D. Use a git worktree outside iCloud with `.git` elsewhere. **Rejected** — complexity without meaningful benefit.

**Rationale:**
- iCloud + `.git/` is a known-bad combination across the industry. Moving out is the lowest-friction fix.
- Project-level state (`CLAUDE.md`, `decisions.md`, `memory.md`, `icp-skills.md`, `tasks/`) stays in iCloud — those are small, text-only, and benefit from cross-machine sync. Only the code tree moves.
- `~/Projects/` aligns with decision #9 (vendor repo at `~/Projects/aikindapps-Nuance/`). Consistent mental model.

**Trade-offs accepted:**
- **Code is now machine-specific.** Cross-machine resumption requires a fresh `git clone` — scripted as a one-liner:
  ```
  git clone https://github.com/Aikindapps/nuance-new-ui.git ~/Projects/nuance-new-ui
  ```
- Build artifacts (`node_modules/`, `dist/`) also machine-specific. Requires `npm install` on new machine.
- Project-level state (this file, CLAUDE.md, memory.md) remains in iCloud — Mr Nick accepts that the mental model now has two homes (project state in iCloud, code on disk).

**How to apply:**
- Any session working on the frontend: `cd ~/Projects/nuance-new-ui`. **Do not** expect code at `IC Dev/nuance-ui/`.
- The old iCloud `nuance-ui/` folder is retained as a stub with a README pointing to the new location (see README at `IC Dev/nuance-ui/README.md`). If Claude ever finds code there, assume it's stale and investigate before editing.
- On a new machine: first clone the repo to `~/Projects/nuance-new-ui/` before any work that reads or edits source files.

---

## #17 — Canonical decision log lives in this repo (`docs/decisions.md`)

**Date:** 2026-04-23

**Status:** Active

**Decision:** This file — `docs/decisions.md` inside the `nuance-new-ui` repo — is the single source of truth for project decisions. The duplicate at `IC Dev/decisions.md` (in iCloud) is retired and replaced with a stub pointing here.

**Inputs:**
- During decision #16 write-up (2026-04-23), noticed the two files had diverged zero times only because they'd both been updated manually in the same session. Maintenance smell flagged.
- Mr Nick chose Option A from three presented: repo-only, project-root-only, or split-by-scope.

**Options considered:**
- A. **Repo-only, stub in iCloud pointing here.** **Chosen.**
- B. Project-root-only in iCloud; no decision log in repo.
- C. Split by scope — repo-level decisions in repo, meta decisions at project root.

**Rationale:**
- 16 of 16 existing decisions are about the code (stack, architecture, deps, tokens) or the code's physical location (#9, #16). They belong next to the code.
- Git history upgrades the log: every edit becomes a dated, attributed commit. Rationale can live in commit messages when the diff itself is enough.
- PR workflow naturally updates the log when architecture changes — the dep bump and its decision land in the same diff.
- Public collaborators who clone the repo see the reasoning for every choice — consistent with the ADR (architecture decision record) convention most OSS projects follow.
- The one cross-machine concern (reading decisions without a repo clone) is weak: any substantive work requires the clone anyway.

**Trade-offs accepted:**
- The decision log is no longer readable on a machine without the repo cloned. Mitigated: clone is a one-liner documented in `CLAUDE.md`.
- Future process-level decisions (e.g., new tooling, workflow changes) will need to fit inside the repo's decision log even when the scope is broader than code. Acceptable — the alternative (splitting) created a harder problem of scope judgment at write time.

**How to apply:**
- All future decisions go here, as `## #N — Title`, with full metadata (Date, Status, Decision, Inputs, Options considered, Rationale, Trade-offs, How to apply).
- The stub at `IC Dev/decisions.md` exists only to redirect a session that naively looks there. If that stub ever acquires content beyond the pointer, treat it as stale.
- Session-start reading: Claude reads this file (`~/Projects/nuance-new-ui/docs/decisions.md`) alongside `CLAUDE.md`, `memory.md`, and `icp-skills.md`.

---

## #18 — Backend calls exported via React Context; React Query layered on top for caching

**Date:** 2026-04-30

**Status:** Active

**Decision:** All canister/backend calls are declared and exported through **React Context** providers. Components and hooks consume the context-exposed call surface — they do not import from `src/lib/actors.ts` directly. **React Query** wraps these context calls when caching, deduplication, or stale-while-revalidate behavior is needed. When caching would be counterproductive (e.g., a one-shot mutation, or a call whose result must not pollute the cache), components call the context-exposed function directly. **Exception:** authentication state lives in context state (not just function exports), because it must be readable everywhere in the app at minimal latency.

**Inputs:**
- Human engineer review of PR #1 (2026-04-30) flagged the architectural problem: the existing Nuance frontend uses **Zustand**, where backend calls mutate large amounts of local state, making it hard to reason about which call touches what. The team has decided not to repeat that pattern.
- Mr Nick endorsed the engineer's recommendation directly.
- Current PR #1 hooks (`useArticles.ts`, `usePopularDiscovery.ts`) call `getActor*()` from `src/lib/actors.ts` directly inside `useQuery` `queryFn`. That works but bypasses the new architectural boundary — every hook becomes its own ad-hoc binding to the canister surface.

**Options considered:**
- A. Keep current pattern (direct singleton actor imports inside React Query hooks). **Rejected** — no central place to swap, mock, or instrument backend calls.
- B. **Context-exported call surface; React Query wraps it for caching; auth state is the documented exception.** **Chosen.**
- C. Zustand (matches existing Nuance frontend). **Rejected** — explicitly the pattern the human engineer wants to move away from.
- D. Plain singletons + React Query (no context). Rejected — loses the swap/mock/instrument seam that Context provides.

**Rationale:**
- Context as the **declaration boundary** for backend calls means every backend dependency in the app is reachable from a single tree of providers. Tests, mocks, and instrumentation slot in via provider replacement.
- React Query as the **caching layer** keeps cache logic out of the call definitions themselves — a function can be cached or not depending on how a consumer chooses to call it.
- Auth in context state (rather than as a query) avoids the per-component subscription cost of "is the user logged in" — every screen needs that answer, fast.
- This separation is the inverse of Zustand's "calls mutate state" pattern, which is the explicit thing being avoided.

**Trade-offs accepted:**
- Slightly more ceremony than direct imports — every backend call surface needs a provider and a hook (`useXContext`).
- Context re-renders are coarser than Zustand selectors. Mitigated by keeping Context values to function references (stable across renders) and minimal state (auth only).
- Existing PR #1 hooks predate this decision and will be migrated in PR #2 (the MUI + Context migration PR). Not a blocker for landing PR #1.

**How to apply:**
- Backend call surfaces live under `src/contexts/` (e.g., `PostCoreContext.tsx`, `UserContext.tsx`, `PostBucketContext.tsx`). Each provider exposes call functions and any minimal shared state.
- Hooks that need caching: `useQuery({ queryFn: () => useXContext().getY(...) })` — the `queryFn` calls into context, React Query owns the cache.
- Hooks that don't need caching: call the context function directly (mutations, side-effecting calls, or anywhere caching would mislead).
- Auth context (`AuthContext`) holds identity/principal/login state directly — read everywhere via `useAuth()`.
- Do not add new direct imports from `src/lib/actors.ts` outside `src/contexts/`. The actors module becomes the transport layer that contexts consume; everything else consumes contexts.

---

## #19 — Component library: MUI (replaces bare Tailwind components)

**Date:** 2026-04-30

**Status:** Active. Partially supersedes the implicit "build components from scratch with Tailwind utilities" stance in #7 / #11.

**Decision:** Use **Material UI (MUI)** as the component library. Skeleton loading is provided by MUI's `Skeleton`. Tailwind v4 + `@theme` tokens (decisions #7, #8, #11) remain for layout, spacing, and one-off styling, but interactive components (buttons, inputs, modals, menus, etc.) come from MUI.

**Inputs:**
- Human engineer review of PR #1 (2026-04-30) listed MUI as a baseline architectural commitment alongside React Query, React Router, React Context, centralized colors, and a service catalog (modal, toast, image processing, QR, reload, toolbar).
- The current PR #1 ships hand-rolled `Tab`, `ArticleSummary`, `Header`, etc. as bare Tailwind divs. They look right for the home page but provide none of the a11y/keyboard/focus baseline that MUI components ship with.

**Options considered:**
- A. Bare Tailwind components, hand-rolled. **Rejected** — every component re-implements a11y, focus, keyboard, theming.
- B. Headless UI (Radix / Headless UI / Ark UI) + Tailwind. Rejected — capable but doesn't match the engineer's stated direction.
- C. **MUI for components + Tailwind for layout.** **Chosen.**
- D. shadcn/ui registry. Rejected — same reason as B.

**Rationale:**
- MUI ships skeleton loading, modals, toasts, toolbars, and form controls out of the box — directly maps to several items on the engineer's service-catalog list.
- A11y and keyboard behavior are MUI's strongest selling point; the four blocking issues in the PR review include two a11y bugs that MUI components would not have shipped with.
- Tailwind v4 stays for layout (`flex`, `grid`, spacing, breakpoints) — MUI doesn't compete there.
- Theming via MUI's theme system aligns with the "centralized colors / radii / line widths / font sizes" mandate.

**Trade-offs accepted:**
- Bundle size grows. Acceptable for an SPA; revisit if Lighthouse mobile suffers.
- MUI's default look is opinionated — every component will need theme overrides to match Figma's `NUR/` component set. Manageable; MUI's theme system is the right place to centralize that.
- Existing PR #1 components (`Tab`, `ArticleSummary`, `AuthorBlock`, `PublicationBlock`, `Header`, `CtaBanner`, `Hero`) will be rebuilt on MUI in PR #2. Hand-rolled versions stay only long enough to land the blocking-fix PR.
- Tailwind `@theme` tokens and MUI theme tokens overlap. Resolution: MUI theme is the source of truth for component-level tokens (colors, radii, type scale); Tailwind `@theme` mirrors them for utility-class consumption. Defined once, exported both directions.

**How to apply:**
- New components: prefer MUI primitives. If MUI doesn't have what's needed, build with Tailwind utilities and a `<Box>` / `<Stack>` shell.
- Skeleton loading uses `<Skeleton variant="..." />` everywhere a query is loading.
- MUI theme lives in `src/theme/` (created in PR #2). Color, radius, typography tokens declared once and consumed by both MUI's `ThemeProvider` and Tailwind's `@theme` block.
- Centralized colors / standard radii / line widths / font sizes (engineer mandate) live in this MUI theme. Hardcoded `[Npx]` values in JSX become theme references.

---

## #20 — Authentication: Identity Kit (replaces direct II/Plug/NFID wiring)

**Date:** 2026-04-30

**Status:** Active. Supersedes the auth approach declared in `CLAUDE.md` ("Internet Identity (also Plug and NFID — matches existing Nuance login options)") interpreted as direct integration.

**Decision:** Authentication is implemented via **Identity Kit** (the multi-provider ICP wallet/auth abstraction that handles II, Plug, NFID, and other ICP-compatible signers behind a single API). Direct wiring of `@icp-sdk/auth/client` for II and direct Plug/NFID adapter integration is **not** the path — Identity Kit replaces both.

**Inputs:**
- Human engineer mandate (2026-04-30): "Use identity kit."
- Mr Nick confirmed Identity Kit **replaces** the previous direct-integration plan, not wraps it.
- Decision #10 deferred the Plug/NFID adapter compatibility question ("verify adapter compatibility when we actually wire Plug/NFID") — Identity Kit moots that question by abstracting it.

**Options considered:**
- A. Direct integration: `@icp-sdk/auth/client` for II + manual Plug/NFID adapters. **Rejected** — multi-provider integration cost, every new wallet means new code.
- B. **Identity Kit, single integration covers all supported wallets.** **Chosen.**

**Rationale:**
- Identity Kit is the community-adopted "log in with any ICP wallet" layer. Centralizes the provider-selection UI and the principal/identity surface.
- The auth context (decision #18 exception) consumes whatever Identity Kit returns — the rest of the app sees `principal`, `agent`, `isAuthenticated` regardless of provider.
- Removes the open follow-up from decision #10 (Plug/NFID adapter compatibility with `@icp-sdk/core`) — Identity Kit handles provider compatibility.

**Trade-offs accepted:**
- Adds a dependency that wraps `@icp-sdk/core`. Need to verify Identity Kit's `@icp-sdk/core` (vs deprecated `@dfinity/*`) compatibility before wiring — flagged as a pre-implementation check in PR #2.
- Less control over provider-selection UX. Acceptable; matches what the engineer wants.
- If Identity Kit lags behind a new wallet or breaks on a `@icp-sdk/core` upgrade, we inherit that lag. Mitigated by: Identity Kit is actively maintained by the ICP community; we revisit if it stalls.

**How to apply:**
- PR #2 wires Identity Kit into `AuthContext`. The provider-selection modal and login/logout flow live behind `useAuth()`.
- No direct `AuthClient` (from `@icp-sdk/auth/client`) instantiation in app code — Identity Kit owns the auth client.
- Logged-in screens read `principal`, `identity`, `isAuthenticated` from `useAuth()`. Authenticated canister calls get the `identity` from context, pass to `HttpAgent.create({ identity })`.
- Pre-implementation check (PR #2 step 1): confirm Identity Kit's installed version is compatible with `@icp-sdk/core` (decision #10). If not, decision #10 or #20 needs re-evaluation; flag immediately.

---

## #21 — Centralization standards: colors, copy, images, dimensional tokens

**Date:** 2026-04-30

**Status:** Active

**Decision:** Project-wide centralization rules:
- **Colors** centralized (in MUI theme — see decision #19).
- **Landing page copy** in a constants file (`src/constants/copy.ts` or per-page equivalent).
- **Images** all referenced through `src/images.ts` (re-exports / imports of every image used in the app).
- **Standard dimensional tokens** — radii, line widths, font sizes — centralized (in MUI theme + Tailwind `@theme`, single source per decision #19).

**Inputs:**
- Human engineer mandate (2026-04-30) explicitly listed all four as baseline standards.
- Current PR #1 inlines copy in JSX, references images via direct `import` per file, and uses raw `[Npx]` values in components — every one of these is the pattern being phased out.

**Options considered:**
- A. Inline copy/images/values per component (current PR #1 pattern). **Rejected.**
- B. **Centralize all four into named modules / theme tokens.** **Chosen.**

**Rationale:**
- Copy in a constants file lets non-engineers (Mr Nick) edit headlines without touching JSX, and unblocks future i18n with zero refactor.
- A single `images.ts` makes it obvious which images are referenced, simplifies bundle splitting, and gives one place to swap a logo or hero image.
- Dimensional tokens centralized in MUI theme (mirrored into Tailwind `@theme`) directly address PR #1 review item: "Raw pixel values in JSX that should be `@theme` tokens."

**Trade-offs accepted:**
- One-time refactor cost (PR #2 absorbs it).
- Constants files can drift from usage. Mitigated by: every JSX literal that's user-facing copy goes through the constants file; lint rule could be added later if drift becomes a problem.

**How to apply:**
- Copy: create `src/constants/copy.ts` (or feature-scoped equivalents like `src/features/home/copy.ts`). All landing-page strings live there. Components import named exports.
- Images: create `src/images.ts` that imports every used image and re-exports as named values. Components import from `images.ts`, not from `assets/` directly.
- Dimensional tokens: defined in MUI theme (`src/theme/`); mirrored into Tailwind `@theme` block. JSX references theme values, not raw pixels.

---

## #22 — Service catalog as backlog (modal, toast, image processing, QR, reload, toolbar, save-state, error reporting, lazy load)

**Date:** 2026-04-30

**Status:** Active — backlog only; nothing built until a screen needs it.

**Decision:** A set of cross-cutting services is committed-to architecturally but built **on demand** as the first screen needing each lands. The catalog:

- **Modal service** — programmatic modal/dialog API on top of MUI `Dialog`.
- **Toast service** — programmatic toast/snackbar API on top of MUI `Snackbar`.
- **Image processing service** — cropping (and likely resizing/format) for user-uploaded images (article cover images, avatars).
- **QR service** — primarily for wallet flows (e.g., displaying a wallet address as a QR for mobile signing).
- **Reload service** — detects stale frontend cache after backend/frontend upgrades; prompts re-login or hard reload. Exists because canister upgrades can invalidate session state.
- **Toolbar service** — the new design uses a toolbar in multiple screens; centralize its mount points.
- **Browser save-state for articles/comments** — drafts persist in browser storage so a refresh doesn't lose work. Pairs with the article editor (Lexical) and comment fields (Quill).
- **Frontend error reporting** — anonymous frontend errors reported to a canister via the toast service path; doubles as usage stats. Tip-off mechanism for production bugs.
- **Lazy load / service workers** — bundle splitting + offline support / asset caching.

**Editor stack** (related to save-state):
- **Lexical** for the long-form article editor.
- **Quill** for shorter text fields. Both must work in offline mode and persist state.

**Inputs:**
- Human engineer mandate (2026-04-30) listed all of these as architectural commitments alongside React Context, MUI, and Identity Kit.
- None are needed for the current home page (PR #1) or the immediate MUI/Context migration (PR #2). They're committed direction but not committed scope.

**Options considered:**
- A. Build the full service catalog now. **Rejected** — scope balloon, and several services have no consumer yet.
- B. **Treat as backlog; build each when its first consumer screen arrives.** **Chosen.**
- C. Build only what's used today. Rejected — leaves no architectural commitment in writing; future sessions will re-debate each one.

**Rationale:**
- Each service has a clear future consumer screen (article editor → Lexical + save-state; login → QR for wallet flows; any screen with mutations → toast; canister upgrades → reload service). No premature abstraction.
- Recording them in the decision log now means future sessions don't reinvent the choice — they implement against a committed direction.

**Trade-offs accepted:**
- Risk: a service gets built ad-hoc inside a feature when it should have been factored out from the start. Mitigated by: when a screen needs a service from this catalog, build the service in `src/services/<name>/` and consume it, rather than inlining the logic into the feature.
- Catalog will likely grow as more screens land. Each addition gets its own mini-decision (or appended to this one with a date) so the rationale stays visible.

**How to apply:**
- When a new screen needs one of these services, build it under `src/services/` (or `src/contexts/` if it's primarily a Context-based surface) at first use. Don't pre-build.
- Lexical + Quill: install when the first writing surface lands (article editor screen, comment composer). Both wired to the browser save-state service.
- Frontend error reporting: anonymous by default. Surface in the UI via toast ("something went wrong; reported to Nuance team"). The reporting canister is TBD — flag at first need.
- Lazy load: enable Vite's route-level code splitting once there are 3+ routes. Service workers wait until offline mode is a real requirement (likely the article editor).

---

## #23 — Token source-of-truth: CSS variables in `@theme`; MUI references via `var(--*)`

**Date:** 2026-04-30

**Status:** Active. Clarifies #19's "defined once, exported both directions."

**Decision:** Token values (colors, type scale, radii, shadows, spacing) live as CSS custom properties in the `@theme { ... }` block in `src/index.css`. The MUI theme in `src/theme/index.ts` references the same values via `var(--color-brand-purple)`, `var(--text-body)`, `var(--radius-card)`, etc. — it does not re-declare them. Both layers consume the single CSS-variables source.

**Inputs:**
- Decision #19 framed MUI theme as "the source of truth for component-level tokens" with Tailwind `@theme` mirroring it.
- Implementing that literally would require either (a) defining values in TS and codegen-ing them into CSS, or (b) defining values twice and policing drift. Both are friction not justified by the benefit.
- Tailwind v4's `@theme` directive already produces real CSS custom properties at runtime. MUI theme objects accept any CSS-valid value, including `var(--*)` references.

**Options considered:**
- A. Define tokens in TS, codegen `@theme` CSS at build time. Rejected — overengineered for a 4-person codebase; adds a build step.
- B. Define tokens twice (once in `@theme`, once in TS for MUI). Rejected — drift is inevitable.
- C. **Define once in `@theme`; MUI references via `var(--*)`.** Chosen.

**Rationale:**
- Tailwind utilities that consume `--color-brand-purple` and MUI theme entries that consume `var(--color-brand-purple)` resolve to the same CSS-variable value at runtime. There is exactly one place to change a token.
- Honors decision #19's "defined once, exported both directions" intent without inventing a TS→CSS pipeline.
- Cheap to revisit: if we later want a TS source of truth (e.g., for design-token tooling), we can flip direction with codegen and the consumers don't change.

**Trade-offs accepted:**
- **Palette is the documented exception.** MUI's `createPalette` calls `darken()`/`lighten()` on every `main` to derive `dark`/`light` variants, and color-manipulator throws on CSS-variable strings ("Unsupported `var(--*)` color"). So `palette.primary.main`, `palette.text.*`, `palette.background.*`, and `palette.divider` are hardcoded hex/rgba values that mirror the `@theme` block by hand. Keep these in sync — there is no automated check.
- Typography, shape, and component style overrides DO use `var(--*)` references successfully (MUI passes those through to CSS unchanged).
- Slightly less ergonomic IDE autocomplete on MUI theme values vs. native MUI hex tokens.

**How to apply:**
- New tokens get added to `src/index.css` `@theme` first.
- MUI components reference them via `var(--token-name)` in `sx` / `styleOverrides` / theme entries.
- Tailwind utilities that need the token are derived automatically from the `@theme` declaration (e.g., `--color-brand-purple` → `bg-brand-purple`).
- Do not add token values directly to the MUI theme literal except for values that are exclusively MUI-internal (e.g., breakpoint definitions where MUI's `breakpoints.values` differs from Tailwind's `screens`).

---

## #24 — Auth: @icp-sdk/auth@7.0.0 with II 2.0 + OpenID (Google, Apple, Microsoft); supersedes #20

**Date:** 2026-05-09

**Status:** Active. Supersedes #20.

**Decision:** Authentication uses **`@icp-sdk/auth@7.0.0`** with Internet Identity 2.0 as the sole identity provider. End users see four sign-in options surfaced through the same `AuthClient` API: classic II (passkey/WebAuthn) and three OpenID providers — **Google, Apple, Microsoft** — bridged through II 2.0's OpenID flow. **Plug, NFID, Stoic, and other ICP wallets are out of scope** for this rebuild. Identity Kit (decision #20) is rejected.

**Inputs:**

- Decision #20 (2026-04-30) committed to Identity Kit conditional on a pre-implementation compatibility check with `@icp-sdk/core` (decision #10).
- Compatibility check executed 2026-05-06: Identity Kit `@nfid/identitykit@1.0.18` declares peer dependencies on the deprecated `@dfinity/*` family (`@dfinity/auth-client`, `@dfinity/agent`, `@dfinity/identity`, `@dfinity/candid`, `@dfinity/principal`, `@dfinity/ledger-icp`, all `>=2.4.0`). Adopting it would install the legacy SDK alongside `@icp-sdk/core` — duplicate cryptography + agent code in the bundle, two parallel actor APIs in the codebase, and a direct conflict with decision #10's "no `@dfinity/agent`" stance.
- `@icp-sdk/auth` source inspection (v7.0.0): `type OpenIdProvider = 'google' | 'apple' | 'microsoft'` — the three providers map exactly to the three OpenID slots the package supports.
- The `internet-identity` skill at skills.internetcomputer.org explicitly recommends `@icp-sdk/auth >= 5.0.0` for II integration in modern ICP frontends.
- Mr Nick's scope direction (2026-05-08): "I am interested only in implementing Internet Identity 2.0" + "Open ID and include google, apple and microsoft."

**Options considered:**

- A. Identity Kit (decision #20). **Rejected** — peer-dep on legacy `@dfinity/*` conflicts with decision #10; bundle bloat; dual actor APIs.
- B. **`@icp-sdk/auth@7.0.0` with II 2.0 + OpenID (Google, Apple, Microsoft).** **Chosen.** Clean compat with decision #10 (peer-dep is `@icp-sdk/core@5.x`); minimal bundle footprint (`@icp-sdk/auth` + `idb` + `@icp-sdk/signer` only); matches the official skill recommendation; covers four sign-in paths through one library.
- C. `@icp-sdk/auth` for II only, defer OpenID to a follow-up PR. **Rejected** — Mr Nick wants OpenID providers in PR #3; reduces UX regression vs old Nuance by giving non-crypto users (Google/Apple/Microsoft) a viable login path.
- D. `@dfinity/oisy-wallet-signer` for ICRC-25 wallets (Plug/NFID/OISY) + `@icp-sdk/auth` for II. **Rejected** — Mr Nick excluded wallets from scope.

**Rationale:**

- Decision #10 stays intact: no legacy `@dfinity/*` packages.
- Four sign-in paths (II + Google + Apple + Microsoft) map exactly to the Figma Login popup's four primary-button slots — no layout redesign needed on Page 8's `1:50034` popup.
- `@icp-sdk/auth@7.0.0` is the version that ships II 2.0 OpenID support (`OpenIdProvider` type alias + `OPENID_PROVIDER_URLS` constant); 6.x predates it. The 6.1.0 → 7.0.0 bump is necessary for OpenID, not optional.
- Bundle impact is minimal — `@icp-sdk/auth` itself is ~104kB unpacked; its only added dependencies are `idb` and `@icp-sdk/signer`, both small.

**Trade-offs accepted:**

- **Wallet support is a regression vs old Nuance.** Old nuance.xyz supports Internet Identity, Plug, and NFID. The rebuild ships II + OpenID only. Plug/NFID/Stoic users who want to keep their on-chain identity model can still log in via classic II (their II principal is the same). Users who authenticated through Plug/NFID directly will need to migrate or use a different login path. Acceptable given Mr Nick's explicit scope direction; re-evaluate if the SNS DAO requests wallet parity for production handoff.
- **Microsoft tenant ID hardcoded to `common`** — accepts personal Microsoft accounts and any work/school accounts. Alternative was `consumers` (personal only). `common` is the right default for a public dapp.
- **Major version bump 6.1.0 → 7.0.0** — incurs the 7.0 breaking changes cost up front. Necessary because OpenID support landed in 7.0.
- One AuthClient instance per provider button (or reconstruction on click), because `openIdProvider` is set at AuthClient construction time, not at `signIn()` time. Implementation detail; encapsulated inside AuthContext.

**How to apply:**

- Imports: `@icp-sdk/auth/client` for `AuthClient`. Do not introduce `@nfid/identitykit` or any `@dfinity/*` package.
- `AuthContext` exposes `login(provider?: 'google' | 'apple' | 'microsoft')` where `undefined` = classic II passkey. Internal implementation: construct a fresh `AuthClient` per `login()` call with the appropriate `openIdProvider` set, await `signIn()`, store the resulting `Identity` in context state.
- **Microsoft tenant resolution happens server-side at id.ai.** `@icp-sdk/auth` passes the `{tid}` placeholder in `OPENID_PROVIDER_URLS.microsoft` verbatim to id.ai as the `openid` search param; no client-side substitution. `AuthContext` stays config-free for this. (Confirmed working in runtime test 2026-05-11 per `tasks/todo.md`. Earlier wording of this bullet implied our code did the substitution — corrected during PR #3 senior-review fix-up.)
- Auth state lives in context state (decision #18 exception): `principal`, `identity`, `isAuthenticated`. Read everywhere via `useAuth()`.
- When a future PR (PR #4 or later) introduces canister calls that require authentication, the `ActorsContext` per-method wrappers refactor to take `identity` from `AuthContext` and construct an authenticated `HttpAgent`. PR #3 leaves `ActorsContext` on the anonymous agent — no consumer yet.
- If Plug/NFID parity is later requested, the path is `@dfinity/oisy-wallet-signer` (peer-dep on `@icp-sdk/core@5.x` — clean compat), not Identity Kit.

---

## #25 — Figma writes via the Plugin API use Manrope; GT Walsheim Trial is not loadable

**Date:** 2026-05-11

**Status:** Active. Companion to #15.

**Decision:** Any text edit on the `UX-Overhaul-2` Figma file performed via the `use_figma` Plugin API path uses **Manrope** on the affected text nodes, not GT Walsheim Trial. The Figma file's intended design font (GT Walsheim Trial) is not loadable from the Plugin API runtime — `listAvailableFontsAsync()` returns zero matches against 7,739 available fonts. Manrope is already the project's documented permanent substitute (#15), available in seven weights including Medium.

**Inputs:**

- During PR #3 senior-review fix-up (2026-05-11), tried to update three button text nodes inside `1:50034` (NFID/Stoic/Bitfinity → Google/Apple/Microsoft per #24's auth provider scope).
- `figma.loadFontAsync({ family: "GT Walsheim Trial", style: "Md" })` failed with: *"The font 'GT Walsheim Trial Md' could not be loaded… call figma.listAvailableFontsAsync() to see the list of available fonts."* The Plugin API runtime does not have GT Walsheim Trial installed. The font is present in the design because the original designer's machine has it; the runtime that executes `use_figma` does not share that font set.
- Manrope's available styles (Regular, Medium, SemiBold, Bold, ExtraBold, Light, ExtraLight) cover every weight the Figma file uses on text.

**Options considered:**

- A. Abandon the Figma edit and add a `docs/page-8-audit.md` note. **Rejected** — leaves the Figma drift uncorrected. Every future Page 8 `get_design_context` call generates stale code that contradicts #24.
- B. **Replace just the affected text nodes with Manrope.** **Chosen.** Edits succeed; introduces a visible per-edit font inconsistency until a wider Figma migration happens. Aligns the touched nodes incidentally with #15.
- C. Wider Manrope migration across the entire popup (or the whole file). Rejected for the moment — bigger scope, deserves its own planning session and a follow-up decision entry. Captured as deferred work.
- D. License GT Walsheim proper so the runtime can load it. Rejected — same cost/benefit logic as #15 (no proportional brand benefit at this stage; SNS DAO would also need the license).

**Rationale:**

- The Plugin API's font runtime is the binding constraint; we cannot load a font the runtime does not have. Fighting this would mean either avoiding Figma writes entirely or paying for GT Walsheim, neither of which is justified for the current scope.
- The code already uses Manrope as the GT Walsheim substitute (#15). Per-node Manrope adoption in Figma at least does not introduce a *new* font into the design — it is the same substitute decided upon for the code.
- The visible inconsistency is the honest cost of accepting reality over fighting it. It will compound across future edits and create the right pressure for a deliberate migration decision.

**Trade-offs accepted:**

- The three buttons inside `1:50034` (Google/Apple/Microsoft) now render in Manrope; the title, body, link, and the "Continue with internet identity" button still render in GT Walsheim Trial. Visible inconsistency inside one popup. Permanent until a wider Figma font migration.
- Future Figma edits to other frames will create more Manrope/GT Walsheim drift unless an explicit migration pass happens.
- If/when Aikin Dapps installs GT Walsheim Trial across the Figma plan or licenses GT Walsheim, revisit and revert by re-running edits with the proper family.

**How to apply:**

- Any `use_figma` text edit on this file: load the appropriate `Manrope / <weight>` and set both `fontName` and `characters`. Map GT Walsheim Trial styles to Manrope weights by the closest match (`Md` → `Medium`, `Bd` → `Bold`, `Rg` → `Regular`).
- Do not attempt `loadFontAsync` on any GT Walsheim Trial style — it will throw and abort the script (atomic, no partial state).
- If a single edit will introduce inconsistency in a previously-uniform frame, surface the trade-off to Mr Nick before writing. Same protocol as the "demand elegance" / "present options when there are trade-offs" guidance.
- When the migration question comes up again, capture the broader plan in a new decision entry rather than amending this one.

---

## #26 — Auth-aware route branching + stub-routes for deferred features

**Date:** 2026-05-11

**Status:** Active. Partially superseded by #29 — the `/your-mix` stub-route is removed and "Following is the default authed landing" is reversed (`/` now serves Popular for both audiences). The auth-aware route-branching and stub-route *pattern* itself remains active.

**Decision:** The home route(s) — `/` and `/new` — branch on `useAuth().isAuthenticated` at the route level, rendering `HomeLoggedOut` for anonymous visitors and `HomeLoggedIn` for authenticated ones. Tabs inside `HomeLoggedIn` are real URLs (per decision #12), not React state. When the design includes a feature whose implementation is deferred (Your mix tab content depends on the recs algorithm; the article editor depends on Lexical from the decision #22 backlog), the route still exists and the affiliated UI surface stays visible — the route renders a minimal stub message instead of being hidden or disabled. This is the project-wide pattern for "design ships ahead of implementation."

**Inputs:**

- PR #3 merged 2026-05-11 with auth + LoginModal. PR #4 starts on the logged-in home (Figma `1:50044`).
- Figma recon of `1:50044` revealed the screen has three sections that depend on personalization (Your mix tab content, Recommended writers row, Recommended publications row) and a Recommended article highlight, plus a prominent "Create a new article" write-CTA whose destination (Lexical article editor) is in the decision #22 backlog.
- No canister-side recommendation API exists (project lesson 2026-05-11). Recs must be implemented client-side, with the algorithm choice itself worth its own decision entry. Bundling that algorithm work into PR #4 was rejected during scoping — it bloats the PR and conflates layout from recommendation strategy.
- The earlier PR #3 review (2026-05-11) flagged a "broken `Link to="/about"`" as a Minor — a real route that points to a non-existent destination. The opposite failure mode (a feature in the Figma that the code refuses to acknowledge exists) is just as bad for users and worse for design-drift detection.

**Options considered:**

- A. Single `/` route, internally branches in JSX to render the right tree. **Rejected** — couples auth-state inspection deeply into the home component; harder to reason about which surface is rendering at any URL.
- B. **Auth-aware route branching at the router level; deferred features get their own real routes that render stub content.** **Chosen.** `/` and `/new` switch at the route level. `/your-mix` and `/write` exist as real routes whose components render a "Coming soon" surface.
- C. Hide deferred features entirely until they ship. **Rejected** — drifts the running code from the canonical Figma design; future sessions encountering `1:50044` see 3 tabs and have to rediscover that one is "hidden in code." Forces unnecessary diff churn when PR #5 lands.
- D. Disabled-but-visible buttons/tabs without dedicated routes. **Rejected** — feels hostile (visibly invites a click that does nothing); also doesn't fix the SEO concern (no real URL for the deferred surface).

**Rationale:**

- Auth-state-aware route branching keeps `HomeLoggedOut` and `HomeLoggedIn` as independent React trees, each with its own data dependencies. The router file becomes the single place to read what URL serves which audience.
- Stub-routes preserve the design fidelity at the URL level. Future sessions can navigate to `/your-mix` and see the design intent (the tab exists, the URL is stable, the route is named) without confusion about whether the feature is "missing" or "deferred." When PR #5 ships, the stub component is replaced and no consumer-facing URL changes.
- Real URLs for deferred surfaces preserve the decision #12 SEO posture: every indexable piece of the product is URL-addressable. Even "Coming soon" pages are valid landing pages — they just communicate state instead of content.
- The pattern is reusable. Future deferred features (the article editor, notification panel, settings screen) follow the same shape: real route, minimal stub component, replace when implementation lands.

**Trade-offs accepted:**

- Stub-routes mean users discover features that don't yet work. Acceptable because the stub messaging explicitly says "coming soon" — better than silent absence in the running code while the Figma shows the feature, which is the failure mode that bites future sessions hardest.
- Two trees (HomeLoggedOut, HomeLoggedIn) share a non-trivial amount of structure (Header, Topics, infinite-scroll grid). Some duplication accepted; refactor toward shared composition only when the second/third instance proves the abstraction is right. Premature "Home base class" rejected.
- The auth-aware router branch fires a re-render on login/logout — the route component swaps even though the URL is unchanged. Acceptable; React Router handles this cleanly.
- Following tab is the default landing for an authed user (resolved 2026-05-11 in the PR #4 scope conversation). Cold-start users with 0 follows land on an empty tab. Mitigated by an explicit empty-state message ("You are not yet following any writers, publications or topics. When you do, they will show up here.") rather than a blank screen.

**How to apply:**

- The router file (`src/main.tsx` or wherever routes are declared) is the source of truth for which audience sees which surface at each URL. A new route serving both audiences gets a `<Home />`-style branch component; a route serving only one audience gets a guard that redirects the other audience to the closest meaningful URL (e.g., `/your-mix` is auth-gated → anon visitors redirect to `/`).
- When a Figma frame contains a feature that depends on un-built infrastructure: add a real route, a minimal stub component (`<Stub message="..." />` or feature-specific), and put the actual implementation file path on the stub as a TODO so the next session knows where to land. Do not hide the feature from the UI.
- When PR #N ships the deferred implementation: replace the stub component import in the route declaration, delete the stub file, run the build. No URL changes, no callers to update.
- Companion to decision #12 (SEO + real URLs): stub-routes count as real URLs and get the same per-route `<title>` + `<meta description>` treatment. A "Coming soon" page still tells crawlers and users what the URL is about.

---

## #27 — `derivationOrigin` wired to the production asset canister; prod handoff preserves existing user principals

**Date:** 2026-05-12

**Status:** Active

**Decision:** All `AuthClient` constructions in this project pass `derivationOrigin = "https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app"` (the production Nuance asset canister URL) in production builds, and pass `undefined` in local dev. Production users who already have a nuance.xyz account therefore get the **same II-derived principal** under the new frontend as under the old one — their User canister profile, articles, follows, NUA balance, and on-chain history carry across the prod handoff with **zero migration**. Local-dev principals stay fresh-per-device (test identities).

**Inputs:**

- During PR #4 Phase 2 (2026-05-12), Mr Nick's WelcomeBanner showed "Welcome to Nuance!" with no name — the User canister returned `#err("User not found for PrincipalId ...")` for his authed principal. Investigation traced the cause to the principal-per-app derivation behavior of II 2.0: every distinct origin gets a distinct principal unless `derivationOrigin` is set.
- The old `aikindapps/nuance-frontend` (`src/nuance_assets_v2_frontend/src/main.tsx`) sets `derivationOrigin` conditionally: a localhost-served origin for local development, a UAT canister URL for UAT, and `https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app` for production. Every existing nuance.xyz user has been authenticating against that production derivation origin for the lifetime of the platform.
- The production asset canister exposes a `.well-known/ii-alternative-origins` file (mirror of `aikindapps/nuance-frontend/src/nuance_assets_v2_frontend/well-known/.well-known/ii-alternative-origins`) whitelisting `https://nuance.xyz`, `https://www.nuance.xyz`, the `.raw.ic0.app` mirror of the canister, and a handful of partner origins (distrikt.app, etc.). `http://localhost:5173` is intentionally NOT whitelisted — local dev would fail the alternative-origins check if it tried to use the production derivation origin.
- Decision #5 (local-only deploy; production handoff is SNS-governed) means we cannot today modify the alternative-origins file on the production asset canister to add a non-production origin.

**Options considered:**

- A. Leave `derivationOrigin` unset (current PR #3 default). Every install gets a fresh principal. Prod handoff would orphan every existing user from their on-chain data. **Rejected.**
- B. Wire `derivationOrigin = PROD_DERIVATION_ORIGIN` unconditionally. Prod works; local dev fails because localhost isn't in alternative-origins. **Rejected.**
- C. **Wire `derivationOrigin = PROD_DERIVATION_ORIGIN` only in production builds; leave it undefined in local dev.** **Chosen.** Mirrors the old frontend's pattern (`isLocal`-conditional) using Vite's `import.meta.env.PROD` build-time flag.
- D. Run a local II / local alternative-origins file (the full old-frontend setup). Rejected — significantly more local-dev infrastructure for a marginal gain (testing with "real" nuance.xyz identities locally). Test-identity-only local dev is sufficient and arguably safer.

**Rationale:**

- **Production user data preservation is non-negotiable.** Nuance has ~7K users with on-chain history (articles, follows, NUA balance, NFT articles). A handoff that orphans them from their data is unacceptable. C is the standard ICP pattern for this.
- The build-time `import.meta.env.PROD` flag is the canonical Vite mechanism for production-only configuration. Tree-shakes cleanly; no runtime origin string-matching.
- Local-dev principal isolation is a feature, not a bug. Developers don't accidentally pollute their real Nuance accounts with test articles, follow noise, or experiments. They authenticate as fresh identities on every machine. The "Welcome to Nuance!" copy (vs "Welcome back, {name}!") is the WelcomeBanner's honest signal that the current session is on a test identity.
- The trade-off — local dev cannot reproduce prod user behaviour — is acceptable. Anything that requires real-prod-principal exercise (e.g., regression testing a follow-graph rendering against a real account) gets a manual prod-style test post-deploy, or a future preview-deploy scheme (likely covered by an extension of #5 when the DAO handoff is planned).

**Trade-offs accepted:**

- **Local dev users see "Welcome to Nuance!" not "Welcome back, {name}!".** Their User canister profile lookup returns `#err(User not found)`. Hooks treat this as a valid "unregistered" state — surfaces fall back to anonymous/no-profile rendering paths. Future PRs that add registration UI will surface the "complete your registration" CTA at this boundary.
- **Authed canister calls in local dev are made by a principal that has no Nuance history.** Following queries return empty; tipping/clapping wouldn't work even if wired; any user-action mutations would be from-the-perspective-of a brand-new account. PR #4's Following tab will show an empty state in local dev for this reason.
- **Adding a new prod-eligible origin (e.g., a preview deploy URL) requires an SNS proposal** to update the alternative-origins file on the production asset canister. Not a concern at PR #4 / local-only scope; surfaces when DAO handoff strategy is planned.
- **A different prod-eligible origin (e.g., the UAT canister URL) would need its own conditional branch** if/when UAT becomes part of the workflow. Mirrors the old frontend's three-way `isLocal ? local : isUat ? uat : prod` pattern. Easy to add later; not needed today.

**How to apply:**

- `AuthClient` construction in `src/contexts/AuthContext.tsx` reads a module-level `DERIVATION_ORIGIN` constant: `import.meta.env.PROD ? "https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app" : undefined`. Every `new AuthClient({...})` call passes this — both the lazy singleton's construction and the per-OpenID fresh-construction path.
- If we later add a UAT deploy or any other prod-eligible origin, extend the constant to a function that branches on `window.location.origin` (or a build-time env var) — mirroring the old frontend's three-way conditional. Add a new alternative-origins entry to the canonical production list via SNS proposal at the same time.
- The WelcomeBanner UI (Phase 2) explicitly distinguishes "Welcome back, {name}!" (registered) from "Welcome to Nuance!" (unregistered) so the principal-mismatch state is visually obvious during local dev. This is intentional — it's the canary that confirms derivation is working as expected.
- Any future canister method that mutates state on behalf of the user (publishing, following, tipping) must be aware that the local-dev caller is a fresh principal — local-dev testing of such flows is fundamentally limited. Plan for prod-style verification post-deploy.

---

## #28 — Following feed: fetch-once + client-side pagination, with a per-source depth cap

**Date:** 2026-05-18

**Status:** Active

**Decision:** The Following feed (`useFollowing`) does NOT paginate its two canister sources incrementally. It fetches the full keyProps list from each source once — `PostCore.getPostsByFollowers` (writers/publications you follow) and `PostCore.getMyFollowingTagsPostKeyProperties` (topics you follow) — capped at `FEED_DEPTH_PER_SOURCE = 120` per source, merges + dedupes by `postId` + sorts by `publishedDate` desc into a single global list, then paginates that list **client-side**. The merged list is built on page 0 and carried forward in the React Query `pageParam` so later pages slice it without re-fetching. Hydration (the expensive `getPostsByPostIds` bucket calls + `getUsersByHandles`) stays lazy — one page-sized slice at a time.

**Inputs:**

- PR #4's first implementation of `useFollowing` paginated both sources with a single shared cursor derived from the merged post count. The two PostCore methods have **independent index spaces** — `getPostsByFollowers` indexes the writer-union, `getMyFollowingTagsPostKeyProperties` the tag-union. Advancing one cursor (the merged count) past both meant each source's items between its per-source consumed count and the merged count were never requested. Confirmed in PR #4 review (2026-05-18): on any account with more than one page of followed content, a growing slice of the feed is silently dropped on scroll. Not caught earlier because every local-dev identity is cold-start (0 follows — decision #27), so `useFollowing` is `enabled: false` locally.
- A naive two-cursor patch (one cursor per source, each advanced by that source's returned count) fixes the *skipping* but introduces **cross-page duplicates** — a post that is both by a followed writer AND in a followed topic lands in different page-windows of the two sources, and a per-page dedupe `Set` cannot catch it.
- `PostKeyProperties` is lightweight metadata (postId, bucketCanisterId, claps, dates) — not article bodies. Fetching a few hundred of them in one query call is cheap. ICP query responses cap at ~2MB.

**Options considered:**

- A. Single shared cursor over the merged count (the shipped-then-reverted PR #4 approach). **Rejected** — skips articles.
- B. Two independent cursors, one per source. **Rejected** — fixes skipping but causes cross-page duplicates; deduping across pages needs global state that doesn't fit `useInfiniteQuery`'s per-page model cleanly.
- C. **Fetch the full keyProps list from each source once (capped), merge + dedupe + sort globally, paginate the result client-side.** **Chosen.** Correct by construction — one global sorted deduped list, sliced. No skips, no duplicates, globally-correct chronology. `ArticleFeed` and `FollowingTab` need no changes (each page is exactly one `count`-sized slice).
- D. Option C uncapped — probe `totalCount` and fetch exactly what exists. **Rejected for now** — unbounded; a heavy follower could approach the response-size limit. The cap is a cheap, safe bound and PR #5 reworks the logged-in feed anyway.

**Rationale:**

- The merge-of-two-independently-indexed-sources problem only has a correct incremental-pagination solution with carry-over buffers across pages — significant complexity for an infinite query. Fetching once and paginating client-side dissolves the problem: the cheap part (keyProps metadata) is fetched eagerly, the expensive part (hydration) stays lazy.
- `FEED_DEPTH_PER_SOURCE = 120` → merged feed up to ~240 articles deep (minus dedupe overlap). Comfortably under the 2MB query-response limit for `PostKeyProperties` payloads; deep enough that scroll-exhaustion is a non-issue for nearly all users.
- Keeps `useFollowing` a `useInfiniteQuery` so the shared `ArticleFeed` renderer works unchanged.

**Trade-offs accepted:**

- A user following enough prolific writers to exceed ~120 posts from one source sees only the most-recent 120 from that source; older followed articles are not reachable by scroll. Acceptable for v1 — PR #5 reworks the logged-in feed (recommendations) and can revisit depth then.
- The full keyProps fetch happens up front on first render of the Following tab (one query call per source). Slightly more eager than incremental pagination, but the payload is small and it is cached (`staleTime` 2 min).

**How to apply:**

- `useFollowing` (`src/features/home/hooks/useFollowing.ts`): page 0's `queryFn` builds the merged list; `getNextPageParam` carries it forward in the `pageParam` and stops when the next slice would start at/past `merged.length`.
- Any future feed that unions two or more independently-indexed canister sources should follow the same shape — fetch metadata once, merge globally, paginate client-side — rather than attempting a shared incremental cursor.
- If feed depth becomes a real user complaint, revisit as option D (probe `totalCount`) or raise the cap — but measure the keyProps payload size against the 2MB limit first.

---

## #29 — "Your mix" tab replaced with "Popular"; recommendations deferred out of project scope

**Date:** 2026-05-18

**Status:** Active

**Decision:** The logged-in home's three-tab bar becomes **Popular / Following / New** — the "Your mix" personalized-recommendations tab is dropped. The recommendation feature is deferred entirely out of this project's scope; it is not built in any form here. Route shape: `/` serves Popular for both anonymous and authenticated visitors (the shared default), `/following` is a new auth-gated route serving the Following feed (anon → redirect `/`), `/new` serves New for both. The `/your-mix` stub-route is removed. The logged-in Popular tab is a plain infinite `ArticleFeed` over `useArticles("popular")`, matching the shipped logged-in New tab (not the rich Hero/Featured layout of the logged-out home).

**Inputs:**

- PR #5 was scoped as "recommendation algorithm + Your mix tab content." Before implementation, the recommendation work was analysed at three tiers: (1) client-side only — follow-graph/topic-overlap heuristics composed from existing canister query methods; (2) a separate, Aikin-controlled side-car recommendation canister that precomputes rankings and ingests implicit read signals (does NOT require an SNS proposal to stand up — the SNS governs only the existing Nuance canisters); (3) modifying the existing SNS-governed Nuance canisters (requires an SNS proposal + community vote).
- Mr Nick's call (2026-05-18): a recommendation feature should be "built properly" — i.e. Tier 2/3, server-side — and is therefore out of scope for a frontend-only project. Tier 1 client-side heuristics were rejected as throwaway work: their ceiling is low (explicit signals only — no read history; cold-start users, the majority, get filtered-popular indistinguishable from the logged-out home) and a Tier 2/3 engine would replace them wholesale.
- With recommendations deferred, the "Your mix" tab has no content. Leaving it as a "coming soon" stub (the decision #26 pattern) was rejected for an indefinitely-deferred feature: a stub is appropriate when implementation is imminent, not when it is punted to a future project. Replacing the tab with Popular gives signed-in users a working, content-full default instead of a dead tab.
- The recon of the stale `aikindapps-nuance-frontend` repo (Sept 2025) confirmed there is no original recommendation design to inherit: its `useRecommendedWriters`/`useRecommendedPublications` are `Math.random()` shuffles of hardcoded dummy arrays, and "Your mix" was a `// TODO` falling back to latest posts.

**Options considered:**

- A. Build Tier 1 client-side recommendations now (PR #5 as originally scoped). **Rejected** — throwaway; a proper Tier 2/3 engine replaces it entirely.
- B. Build a Tier 2 side-car recommendation canister as part of this project. **Rejected for now** — reopens the locked "frontend only, no canisters" scope; revisit as a separate future project.
- C. Keep the "Your mix" tab as a "coming soon" stub indefinitely. **Rejected** — a dead tab in the marquee position; stub-routes (decision #26) suit imminent features, not indefinitely-deferred ones.
- D. **Replace "Your mix" with "Popular"; defer recommendations out of scope entirely.** **Chosen.** Signed-in users get Popular/Following/New — all three working feeds. The logged-in home loses its personalized surface until recommendations return as a separate project; accepted as an interim state.

**Rationale:**

- A proper recommendation system needs server-side precompute and implicit-signal capture (read history, dwell time) — none of which exists on the current canister surface and none of which a frontend-only project can add well. Half-building it client-side produces a weak feature that gets thrown away. Better to ship nothing than ship throwaway.
- Popular is the natural replacement: `getPopularThisWeek` is an anonymous query (no auth needed), the feed already exists for the logged-out home, and `useArticles("popular")` + the shared `ArticleFeed` renderer make the logged-in Popular tab a three-line component.
- `/` = Popular for both audiences makes the root URL serve identical content regardless of auth — consistent, SEO-clean, and it gives cold-start users (who follow nobody — the majority) a full feed as their default landing instead of an empty Following tab. This reverses decision #26's "Following is the default authed landing" trade-off, which only made sense when "Your mix" was the intended marquee tab.

**Trade-offs accepted:**

- The logged-in home has no personalized surface. A signed-in user gets Popular (identical to logged-out) + Following + New — the only thing the logged-in experience adds over the logged-out one is the Following tab. This diverges from Figma `1:50044`, which built "Your mix" as the marquee logged-in feature. Accepted as an interim state until recommendations return as a Tier 2/3 project.
- `/following` is a new URL with no analogue in `1:50044` (Figma keeps Following at the home root). The Figma file is now ahead of the code in one place and behind it in another (no "Your mix").

**How to apply:**

- Logged-in tab bar (`HomeTabBar.tsx`): Popular → `/`, Following → `/following`, New → `/new`.
- `Home.tsx` auth gate: `/following` is auth-gated — anon visitors redirect to `/`. `/` and `/new` serve `HomeLoggedOut` for anon (unchanged).
- The logged-in Popular tab reuses `useArticles("popular")` + `ArticleFeed` — uniform with the New and Following tabs (all plain infinite feeds). The rich Hero/Featured/Writers/Publications layout stays exclusive to the logged-out home.
- When recommendations return: they come back as their own tab/surface in a separate project, not by reviving `/your-mix`. Decision #26's stub-route pattern still stands for genuinely imminent features.

## #30 — Create Account onboarding flow: two modals, avatar deferred, cancel = logout, first mainnet mutations

**Date:** 2026-05-19

**Status:** Active

**Decision:** PR #6 builds the "Create Account" screen (Figma Page 2, `0:1`) as a post-authentication **onboarding flow**, not a standalone page. The genuinely new work is two Modal-service popups — `RegisterModal` ("Nice to meet you!", Figma `1:1366`) and `TopicsModal` ("What Interests You?", Figma `1:1519`) — plus an `OnboardingGate` that sequences them. The gate fires when a user authenticates with a principal that has no `User`-canister profile (the decision #27 dead-end). Three sub-decisions are locked: (a) **avatar upload is deferred** — `RegisterModal` omits the avatar selector block and calls `registerUser` with an empty avatar string; (b) **Cancel / close on `RegisterModal` logs the user out** — no authenticated-but-unregistered limbo state; `TopicsModal` "Maybe later" / close just skips topics (registration has already succeeded); (c) this is the **first PR that writes to the live mainnet canisters** — `registerUser` and `followTags` are mutations.

**Inputs:**

- Page 2 metadata recon (2026-05-19): the page is a seven-frame *flow*. Five frames are already built or external — logged-out home (PR #1), the join/login popup `1:50034` shipped as `LoginModal` (PR #3), the "Extern site" frame (the II/OpenID redirect, handled entirely by `@icp-sdk/auth`), and the logged-in home (PR #4/#5). Only the register and topics popups are new.
- `User.registerUser(handle, displayName, avatar)` takes a `text` avatar (a URL). Setting it requires uploading an image to the `Storage` canister first — the decision #22 "image processing" service, not yet built. `User.updateAvatar(text)` exists separately, and `avatar` is empty for many existing users (the `Avatar` component already falls back to a branded gradient) — so avatar is genuinely optional on the data model.
- The project has no local backend (frontend-only, live mainnet canisters). Every prior PR used anonymous-safe query methods. Registration is a mutation; there is nowhere to send it except the production `User` canister.

**Options considered:**

- Avatar: **A.** build the Storage image-upload service inside PR #6 — pixel-complete register popup but a materially larger PR bundling a reusable subsystem. **B. Defer avatar, ship the flow — chosen** (Mr Nick, 2026-05-19): smaller, focused PR; avatar upload becomes its own follow-up when the Storage upload service is built.
- Cancel behaviour: **A. Cancel = log out — chosen** (Mr Nick): a user is either fully registered or fully logged out. **B.** stay logged in with a "complete your profile" re-entry point — rejected: adds an authed-unregistered limbo state to support everywhere. **C.** drop the Cancel button entirely — rejected: deviates from Figma, which shows a Cancel button.
- Surface: modal vs route — **modal, chosen.** Both popups are authed-only and non-indexable; they are Modal-service consumers like `LoginModal`. No new URL routes, no `<meta>` work. Does not conflict with the SEO/real-URL constraint (decision #12), which governs *content*.

**Rationale:**

- Most of Page 2 already exists; treating it as a flow rather than a screen keeps PR #6 scoped to the two real gaps.
- Avatar upload is a reusable subsystem (the decision #22 image-processing service). Bundling it with the onboarding flow would couple two unrelated concerns and inflate the PR; the data model treats avatar as optional, so the flow is fully functional without it.
- The authed-but-unregistered state (decision #27) is a genuine dead-end — `WelcomeBanner` already special-cases it with "Welcome to Nuance!". Making Cancel log out removes the limbo rather than building UI to live with it.

**Trade-offs accepted:**

- The shipped `RegisterModal` will not match Figma `1:1366` — the avatar selector block is absent until the follow-up avatar PR.
- Local-dev testing of registration creates real user records on the production Nuance `User` canister; there is no staging backend. Mitigated by using obvious throwaway test handles. This is the structural cost of the frontend-only / live-mainnet architecture and applies to every mutation from here on.

**How to apply:**

- New feature folder `src/features/onboarding/` — `RegisterModal`, `TopicsModal`, `OnboardingGate`.
- `ActorsContext` gains per-method wrappers (decision #18 allowlist) for `registerUser`, `getAllTags`, `followTags` — the first mutation wrappers; they run on the PR #4 authed agent.
- `RegisterModal` calls `registerUser(handle, displayName, "")`. Cancel / close → `useAuth().logout()`.
- A shared `Popup` shell (`src/components/ui/Popup.tsx`) is extracted from `LoginModal`'s hand-rolled chrome and all three modals use it.

## #31 — Read Article (PR #7): build Page 3 sections 3.2 + 3.3; defer comments and interactions to Page 4

**Date:** 2026-05-19

**Status:** Active

**Decision:** PR #7 builds the "Read Article" screen — Figma Page 3 (`1:4440`) — scoped to **two of its six sections**: 3.2 "View Article content" (`1:5285`) and 3.3 "View related articles" (`1:5524`). The article body, stored on the canister as an **HTML string**, is rendered with `dangerouslySetInnerHTML` after sanitization by **DOMPurify** (a new dependency). The article gets a real route, `/:handle/:postIdAndBucket/:slug` (URL shape governed by decision #32). Three things are explicitly deferred to the future Page 4 "Article Enrichment" PR: (a) the **comments block** entirely — list display and interactions; (b) the floating **action bar's interactions** (applause, comment, bookmark) — the bar ships as a visual shell with only "Copy link" wired; (c) the author **Follow button** — rendered inert.

**Inputs:**

- Page 3 metadata recon (2026-05-19): the page is a six-section *flow*, not one screen. 3.1 is a full search experience; 3.2 is the core article page; 3.3 adds a related/next-article foldout; 3.4 is an NFT/limited-edition paywall; 3.5/3.6 are publication/author subscription purchase flows. 3.4–3.6 require NUA token transfers (`icrc-ledger`) and the Subscription canister; 3.1 is its own feature.
- Data-layer research against the vendor Motoko: article content is HTML (`content: Text`, confirmed by `U.calculate_total_word_count` which only counts inside `<...>` tag pairs). `PostBucket.getPost(postId)` (query) returns the body; `PostCore.getPostKeyProperties(postId)` returns views/claps/tags; `PostCore.viewPost(postId)` (oneway) registers a view; `PostCore.getMoreArticlesFromUsers(postId, handles)` feeds the related rails. Comment handle/avatar come back empty from the canister and need User-canister hydration — i.e. comments are real work, not a freebie.
- Page 4 is named "Article Enrichment" and explicitly covers favourites, tip/claps, follow, share, and comment interactions — those interactions are that PR's identity.

**Options considered:**

- PR scope: **A.** core article page only (3.2). **B. article page + related articles (3.2 + 3.3) — chosen** (Mr Nick, 2026-05-19): 3.3 shares the 3.2 article-detail layout, so the marginal cost is moderate. **C.** all six sections — rejected: the monetization flows pull in token transfers and a second canister; far too large for one PR.
- Comments: **A.** render the comment list read-only now (indexable content). **B. defer the whole comments section to Page 4 — chosen** (Mr Nick, 2026-05-19): a read-only comments block you cannot interact with is a half-state; comment hydration is real work; cleaner scope boundary.
- HTML sanitizer: **DOMPurify — chosen.** Article HTML is user-authored and the canister does not sanitize on write, so rendering it raw is a stored-XSS vector. The alternative — a hand-rolled allowlist sanitizer — is more code and easy to get subtly wrong.

**Rationale:**

- Treating Page 3 as a flow (as Page 2 was) keeps the PR scoped to what genuinely belongs together: reading an article and discovering the next one.
- Bundling the action-bar/comment/follow *interactions* here would duplicate Page 4's purpose and inflate the PR; the visual shells are cheap and let Page 4 wire behaviour onto a finished surface.

**Trade-offs accepted:**

- The shipped article page omits the comments block present in Figma `1:5287` — and with it the comment text, which is indexable content. Accepted: the SEO-critical payload is the article body, and the crawlable surface is the proxy anyway (decision #32).
- The floating action bar is non-functional except "Copy link" until Page 4.

**How to apply:**

- New feature folder `src/features/article/` (hooks, sections, lib); route component `src/routes/ReadArticle.tsx`.
- `ActorsContext` gains per-method wrappers (decision #18 allowlist): `getPost`, `getPostKeyProperties`, `viewPost`, `getMoreArticlesFromUsers`.
- Home `ArticleSummary` cards now link to the canonical article URL via `src/lib/articleUrl.ts` (`buildArticleUrl`).
- When Page 4 is built: it wires applause/bookmark/share/comment onto the existing action-bar shell, builds the comments block, and makes the author Follow button live.

## #32 — Article SEO is served by an out-of-band crawler proxy; the frontend's obligation is URL-scheme preservation

**Date:** 2026-05-19

**Status:** Active

**Decision:** Search-engine and link-preview SEO for Nuance articles is **not** the responsibility of this React SPA and will not be solved inside it. Production nuance.xyz is fronted by a standalone Node.js reverse proxy (`aikindapps-Nuance/proxy/`) that sniffs the request User-Agent: known crawlers (Googlebot, Bingbot, Twitterbot, `facebookexternalhit`, LinkedInBot, Slackbot, WhatsApp, Applebot, …) are served server-rendered HTML built live from the canisters — full `<title>`/meta/OG plus the article body inlined — while human traffic is transparently proxied through to the SPA. The new frontend has exactly **two obligations** to keep that pipeline working: (1) **emit the article URL exactly** as `/{handle}/{postId}-{bucketCanisterId}/{slug}` — the proxy recovers `postId` and `bucketCanisterId` by splitting URL segment 2 on its first `-`; (2) keep shipping the build to the same `nuance_assets` asset canister so the proxy's passthrough target stays valid. No prerender/SSR/SSG layer is added to this project — consistent with decision #5 deferring the production rendering-mode question to the DAO handoff.

**Inputs:**

- SEO research spike (2026-05-19) into `~/Projects/aikindapps-Nuance/`. The `proxy/` directory is a plain Node + `http-proxy` server (`server.ts` listens on `:8080`), not a canister, not an edge function. `isCrawler()` matches a hardcoded User-Agent list; `buildPostSEO` (`proxy/src/screens/post.ts`) fetches `getPostCompositeQuery` + `getPostKeyProperties` per request and emits a full HTML document with `<main>${post.content}</main>`. Nothing is precomputed or cached — the "plain-text copy" is generated live per crawler hit.
- The proxy parses the URL: `pathSegments[1].indexOf('-')` splits postId / bucketCanisterId. A changed URL shape makes the parse fail silently and the proxy falls through to proxying the empty SPA shell to the crawler.
- The proxy is hand-deployed out-of-band — no Dockerfile, no CI workflow, not in the canister repo's build, not under SNS governance. `robots.txt` + `sitemap.xml` ship inside the `nuance_assets` canister (`src/SEO/`); `sitemap.xml` is generated by a manual `BuildSitemap.sh` run. The `KinicEndpoint` canister is a separate Kinic-search integration, unrelated to general SEO (Mr Nick, 2026-05-19).

**Options considered:**

- **A. Add a prerender/SSR layer to this frontend** — rejected: articles are live mainnet data and cannot be enumerated at a local build (no SSG manifest); an SSR server contradicts the local-only / SNS-gated-deploy reality of decision #5; and it would duplicate what the proxy already does.
- **B. Treat the SPA as the crawlable surface** — rejected: it never has been; client-rendered React is invisible to non-JS crawlers and link-preview scrapers.
- **C. Keep the proxy as the crawlable surface; the frontend just stays compatible — chosen.**

**Rationale:**

- The crawler pipeline already exists and works; the new frontend's job is not to reinvent it but to avoid breaking it. URL-scheme fidelity is the single hard contract.
- This vindicates decision #5: there is no SPA-SEO crisis to solve in this project.

**Trade-offs accepted:**

- The proxy is a parallel reimplementation of article rendering — its SEO HTML and the new SPA can drift, and "who operates and updates the proxy" is a genuine open question for the DAO handoff (the proxy is outside SNS governance and canister CI/CD).
- Human-facing and JS-capable-crawler SEO still depends on the SPA doing its part well — semantic HTML, dynamic `<title>`/meta/OG, JSON-LD, fast code-split loading — which PR #7 Phase 10 delivers. But true crawlability remains the proxy's job.
- The proxy's `reservedPaths` and crawler list are unaware of the new frontend's route set (`/new`, `/following`, `/write`); reconciling them is a DAO-handoff task, not PR #7 work.

**How to apply:**

- `src/lib/articleUrl.ts` is the single source of the URL shape — `buildArticleUrl` to emit, `parseArticleSegment` to read. Never hand-format an article URL elsewhere.
- At the eventual production handoff: keep shipping `robots.txt` + `sitemap.xml` (or their successors) inside the asset canister, and flag proxy maintenance/ownership as a handoff item.

## #33 — Desktop layout is fluid-scaled to the 1920 Figma; partially supersedes #13

**Date:** 2026-05-19

**Status:** Active

**Decision:** The desktop UI (≥1024px) **fluidly scales** the 1920-px Figma design: pixel-exact at a 1920 viewport, scaled down proportionally at narrower desktop widths so the page always looks like the Figma — just smaller. Below 1024px the existing mobile-first breakpoint layouts are unchanged (decision #13 still governs there). Implemented with one CSS custom property — `--fpx`, a "design pixel": `1px` by default (so the sub-1024 breakpoint layouts render exactly as before) and `min(1px, 100vw / 1920)` inside an `@media (min-width: 1024px)` rule. Every dimension is expressed as `N × --fpx`: Tailwind's spacing unit (`--spacing: calc(4 * var(--fpx))`), every type-scale token, every radius token, and every literal `[Npx]` utility value across the app (converted to `[calc(N*var(--fpx))]`). Applies to **all screens** — home logged-out/in, the modals, the article page.

**Inputs:**

- PR #7 review (2026-05-19): Mr Nick compared the built article page against the Figma and it read as "too big" with too little whitespace. Diagnosis: the build used the Figma's absolute pixel values (60px title, 932px column, 88px header) — correct, but those are values for a *1920-px-wide* page. At a narrower browser window the same elements fill proportionally more of the screen. The build only matches the Figma 1:1 at a 1920 viewport.
- A Figma frame is a single fixed width; "how it scales between 1920 and mobile" is not a measurement the file contains — it is a design decision.
- Mr Nick chose fluid scaling over (a) pure breakpoints — stepped, never proportional between steps — and (b) `transform`-scale-to-fit — text shrinks unboundedly, breaks `position: fixed` descendants, unusual for a reading site.

**Options considered:**

- **A. Pure breakpoints (decision #13 as-is)** — desktop = the Figma 1920 sizes applied at `lg`+; cramped at 1024–1900, exact only at 1920. Rejected: it is the cause of the "too big" report.
- **B. `transform: scale` the page** — rejected: breaks the article's `position: fixed` overlays (ActionBar, related-articles foldout), can blur text, shrinks text unboundedly.
- **C. Fluid scaling via a `--fpx` design-pixel — chosen.** Real CSS sizes (no transform), pixel-exact at 1920, proportional below, and `position: fixed` keeps working. The mobile breakpoint layouts are untouched because `--fpx` only goes fluid at ≥1024px.

**Rationale:**

- One variable (`--fpx`) drives the whole system, so the desktop UI scales as a single coherent piece — there is no per-component scaling logic to maintain.
- Anchoring to `--fpx` rather than the root `font-size` keeps Tailwind's px-based breakpoints and the user's browser-zoom/accessibility settings unaffected.
- Gating the fluid behaviour behind `@media (min-width: 1024px)` means decision #13's mobile-first breakpoint layouts render byte-identical below 1024px — the change is purely additive for desktop.

**Trade-offs accepted:**

- The 1024px boundary is a hard switch: just below it the (current/eventual mobile) layout renders at 1:1, just above it the desktop layout renders at ~0.53 scale. This is a layout breakpoint, so a visual change there is expected; once the Phase 9 mobile layout exists, ≤1023 is the mobile layout and ≥1024 the fluid desktop.
- `box-shadow` blur/offset values written as multi-part arbitrary utilities (e.g. `shadow-[0px_3px_5px_...]`) do not scale — a negligible fidelity gap.
- The mobile range will need its own scaling anchor (to the ~393px mobile Figma) when Phase 9 builds the mobile layouts — `--fpx` will get a second, media-queried definition there.

**How to apply:**

- The system lives entirely in `src/index.css`: `--fpx` (default + the `@media` override), `--spacing`, and the `--text-*` / `--radius-*` tokens as `calc(N * var(--fpx))`.
- New components: size everything in design pixels. Tailwind spacing/size utilities and the type/radius tokens already scale automatically. For a literal value, write `[calc(N*var(--fpx))]` (font sizes need the `length:` hint — `text-[length:calc(N*var(--fpx))]`). Never hard-code a bare `[Npx]`.
- This is how the build is verified against Figma: it is pixel-exact at a 1920px viewport. Compare there.

## #34 — Article Enrichment (PR #8): 6 of 10 sections; toast service first consumer; logged-out interactions open LoginModal; optimistic flips with rollback

**Date:** 2026-05-21

**Status:** Active

**Decision:** PR #8 wires the four inert-shell interactions left over from PR #7 (Applause / Comment / Share / Follow) and adds a comments block — but only the six sections of Figma Page 4 (`1:15424`) that have designed flows and a viable canister surface. Four sections are deferred or out of scope:

| § | Figma node | In PR #8? | Why / why not |
|---|---|---|---|
| 4.1 Favourites | `1:15512` | No | Figma marks the section with a "Not in scope" overlay; no canister surface for favourites. |
| 4.2 Tip author | `1:16133` | No | Tipping is multi-token (NUA / ICP / ckBTC / others) and depends on Page 7 (Funds Overview) primitives — a balance display + sender-token selection are prerequisites. Lives in a future PR alongside Page 7. **Project-wide implication:** every "applause/clap" on Nuance is a paid token tip, not a free Medium-style multi-clap. `PostCore.clapPost` exists but is not the user-facing path. The user-facing path is `User.spendRestrictedTokensForTipping` (for NUA) or an ICRC-1 ledger transfer + `PostBucket.checkTippingByTokenSymbol(token, …)` (for other tokens), then `PostBucket` writes the `Applaud` record (with `currency: text`). |
| 4.3 (un)Follow author | `1:17074` | Yes | `User.followAuthor(handle)` / `unfollowAuthor(handle)`. |
| 4.4 Share article | `1:18426` | Yes | Client-only; social URLs + `navigator.clipboard`. |
| 4.5 Comment on article | `1:19747` | Yes | `PostBucket.saveComment(SaveCommentModel)` + `getPostComments(postId)`. |
| 4.6 Reply to comment | `1:18887` | Yes | Same `saveComment` with `replyToCommentId`. |
| 4.7 (un)Like comment | `1:19461` | Yes | `PostBucket.upvoteComment(commentId)` / `removeCommentVote(commentId)`. Like-only — Figma shows no downvote UI even though `Comment.downVotes` exists on the canister. |
| 4.8 (un)Follow tag | `1:20284` | No | Figma placeholder only (cover thumbnail, no flow frames). `PostCore.followTag` / `unfollowTag` exist but the UX is undesigned. |
| 4.9 Follow publication | `1:20286` | Yes | `User.followAuthor(publicationHandle)` — publications are `User` records with `isPublication=true`. Mounted as a dark **hover popover** anchored to the publication name in the existing `Breadcrumb` (not a new section). |
| 4.10 Report article | `1:21246` | No | Figma placeholder only + no obvious canister method. |

**Inputs:**

- PR #7 deferred the comment block and the four interaction shells (`decision #31`) on the basis that Page 4 designs the wiring. PR #8 is that wiring.
- Page 4 metadata recon (2026-05-21): 10 sections enumerated; 4.1 is covered by a "Not in scope" overlay; 4.8/4.10 are placeholder-only frames with no designed flows.
- Canister surface audit: every method needed for the six in-scope sections exists today on `User` and `PostBucket`; no new Motoko required.
- Mr Nick's correction on tipping (2026-05-21): there are no free claps on Nuance, and tipping is multi-currency. This puts 4.2 firmly behind Page 7 funds work.
- Page 4 has **no mobile frames** in this Figma snapshot. PR #7's mobile shells stay in service; PR #8's new behaviour is wired identically into MobileBar and reflows the comments list/composer to single column at <1024px.

**Locked sub-decisions:**

1. **Logged-out click on any new mutation → opens `LoginModal`.** Matches the Header/CtaBanner pattern from PR #3. The user re-clicks the mutation post-login; intent does not auto-resume (an "intent queue" is deferred — not in PR #8 scope).
2. **"N comments" added to `ArticleMasthead` meta row.** Reverses the comment-count deferral in decision #31. Count source is `useComments().data.totalNumberOfComments`.
3. **Toast service is minimal: success + error.** MUI `Snackbar` + `Alert`. 4s autohide. API: `useToast().show(msg, 'success' | 'error')`. First consumer is the follow mutation (Phase 3a). This is the decision #22 toast-service slot finally being filled, by its first real consumer rather than pre-built.
4. **Mobile mirrors desktop inline.** No separate mobile design pass for Page 4 (Figma has none); the inherited PR #7 mobile shells get the same handlers, and the comments list/composer reflows to single column.
5. **Optimistic updates for follow + like; invalidate-only for comment post.** Follow/like need instant flip — `onMutate` snapshot → `onError` rollback → `onSettled` invalidate. Comment posting must be server-confirmed because the canister assigns the `commentId`; optimistic insertion would race with the server-assigned id.
6. **Cache invalidation on follow:** both `["my-profile"]` AND `["article", bucketCanisterId, postId]`. The latter holds the target author's `UserListItem`, whose `followersCount` would otherwise go stale until the article query naturally refetches.
7. **`deleteComment` and comment edit are out of PR #8.** Figma shows no UI for either on Page 4. The methods are not added to the `ActorsContext` allowlist (per decision #18) until a real consumer exists.

**Options considered:**

- **A. Build all 10 sections.** Rejected: four of them lack either a designed flow (4.8/4.10) or the prerequisite token-spending plumbing (4.2). 4.1 is annotated "Not in scope" in the file itself.
- **B. Defer comments to a separate PR.** Rejected: the four inert shells, the comments block, and the Like/Reply interactions are all part of the same article-page reading experience; a comments-only PR would land an article page with applause/follow/share still inert.
- **C. Build the six in-scope sections in one PR with phased commits — chosen.** Mirrors the PR #4 / PR #7 cadence; reviewer can step phase-by-phase; merge friction concentrated in a single rebase if main moves.

**Rationale:**

- One PR covers the *complete* article-page interaction surface that Figma actually designs today — easier review than a slice that leaves Applause / Share inert while comments land.
- Toast service is built alongside its first real consumer per decision #22 (no pre-builds).
- The deferred-tipping decision pushes a substantial multi-canister concern (NUA/ICP/ckBTC, balance display, sender-token selection) into the right home — a PR alongside Page 7's wallet/funds work — rather than splitting it across two PRs.

**Trade-offs accepted:**

- Applause/Tipping (the most user-visible interaction Figma designs) remains inert after PR #8. The current inert "Applause (N)" pill still shows the live count from `PostCore`, so visually the user sees there is *some* engagement signal; the *action* of applauding is wired in the post-Page-7 PR.
- Optimistic follow/like updates require careful rollback bookkeeping in two query caches per mutation. Mitigated by isolating the snapshot/rollback to `onMutate` / `onError` and using `onSettled` to force a server reconciliation regardless of outcome.
- The popover-style publication-follow surface (4.9) introduces the project's second MUI `Popper`-based primitive (first is the Share popover in PR #8 Phase 2). Both stay as ad-hoc compositions rather than being factored into a shared `<Popover/>` primitive — extract on third consumer.

**How to apply:**

- For new interactions on the article page: extract a small wrapper component (e.g. `<FollowButton/>`, `<ShareButton/>`) that owns auth gating, mutation state, optimistic flip, and toast feedback. Mount it inside the existing inert shells in `ActionBar.tsx` / `AuthorBlock.tsx`. The shells stay dumb presentation; the wrappers carry the behaviour.
- For multi-cache mutations: snapshot every cache the optimistic update touches inside `onMutate`, restore them in `onError`, invalidate them in `onSettled`. Document the cache surface in the hook's docstring.
- For tipping (when it lands): build against the multi-currency `checkTippingByTokenSymbol(token, …)` path, not the NUA-only `spendRestrictedTokensForTipping`. The `Applaud` record carries `currency: text` precisely because the canister supports multiple ledgers.
- For new auth-gated interactions: a single `onClick` handler that branches on `useAuth().isAuthenticated` — logged-out opens the `LoginModal` via the existing modal service; logged-in calls the mutation. Don't introduce an intent-resume mechanism in PR #8.

---

## #35 — PR #8 review sweep: fix-ups + m5 expansion (full comment action surface)

**Date:** 2026-05-21
**Status:** Active. Extends #18 (ActorsContext allowlist) and #34 (cache contract).

**Decision:** Address the senior reviewer's 2 Major + 7 Minor items from the PR #8 review pre-merge as a single sweep. Of the 7 minors, **m5** ('the inline heart is hand-drawn — pull an asset, or defer') expands meaningfully past 'swap one icon': Figma §4.7 (`1:19534`) actually specifies thumbs up + thumbs down (not heart, not like-only), and Mr Nick confirmed both Edit and Report must be functional to match production behaviour. The original PR #8 implementation (heart-shaped like-only button) was a misread of the Figma spec — fold that correction in here rather than ship the regression.

**Action items folded into this sweep:**

| # | Severity | What | Where |
|---|---|---|---|
| M1 | Major | Gate global `scroll-behavior: smooth` on `prefers-reduced-motion: no-preference` | `src/index.css` |
| M2 | Major | Unmount cleanup for `pubCloseTimer` (deferred `setPubOpen(false)`) | `ArticleMasthead.tsx` |
| m1 | Minor | Converge all 8 Result-discriminating hooks on `result.__kind__ === 'err'` (drop the `'err' in result` shape in 4 read hooks) | `useArticle`/`usePostMeta`/`useComments`/`useMyProfile` |
| m2 | Minor | Hide `(0)` on ActionBar's desktop "Comment" button — match ArticleMasthead's hide-when-zero treatment | `ActionBar.tsx` |
| m3 | Minor | Replace broad `['article']` invalidation in follow/unfollow with an in-cache patch of `followersCount` by handle (no refetch) | new `patchFollowerCount.ts` |
| m4 | Minor | Lowercase the optimistically-appended handle in `useFollowAuthor.onMutate` so it mirrors the canister's reverse-index shape | `useFollowAuthor.ts` |
| **m5** | **Minor (expanded)** | **Full comment action surface — see below** | **multiple files** |
| m6 | Minor | Fix misleading 'fixed bar's clearance' comment in ActionBar (the fixed bar at *top* is the Header, not the bottom ActionBar) | `ActionBar.tsx` |
| m7 | Minor | Drop `hide` from public `ToastContextValue` (consumers never call it; `Snackbar`'s internal `onClose` handles it) | `useToast.ts` |

**m5 — locked sub-decisions:**

1. **Like/Dislike via thumbs, not heart.** Figma §4.7 (`1:19534`) specifies `NUR / Icon / Thumbs up` (asset `203:434`) and `Thumbs down` (asset `203:447`). PR #8 Phase 7's hand-drawn heart was a misread of the Figma 'Liked by @X' status indicator (a separate component) for the action button.
2. **Owner vs other action sets diverge:**
   - **Owner:** `Edit` + `Reply` + `Share` (no voting on your own comment — Figma)
   - **Other:** `Like` + `Dislike` + `Reply` + `Share` + `Flag` (Figma + production)
3. **Keep per-comment Share** (production has it; Figma omits it). Implementation mirrors prod: single-click copy of `${origin}${pathname}?comment=${commentId}` to clipboard with a success toast. Uses the existing `IconShare` glyph + label 'Share'. Deviation from Figma documented.
4. **Single `VoteButtons` component owns the up/down pair** + cross-removal optimism. Per-caller mutual exclusion: the canister's `upvoteComment` adds the caller to `upVotes` and removes them from `downVotes` in one call (`PostBucket.main.mo:2954-2982`); `downvoteComment` is the mirror; `removeCommentVote` clears both arrays for the caller. The hook's optimistic update mirrors that — a click on Like while currently downvoted flips counts by +1 / −1 in a single state change. Two separate `LikeButton` + `DislikeButton` components would have split that invariant across two mutation onMutates and risked race conditions.
5. **`removeCommentVote` is symmetric — rename `useUnlikeComment` → `useUnvoteComment`.** The previous name implied like-direction-only and would mislead the next reader.
6. **Edit reuses `useSaveComment`** with the existing `commentId` parameter (the canister's `saveComment` is the unified create/edit method via optional `commentId` in `SaveCommentModel`). No new hook. CommentComposer gains an `editCommentId` + `initialDraft` mode; inline-swaps into the comment body when the owner clicks Edit.
7. **Flag is a one-click report** — matches production. Optimistic `isCensored: true` flip; `reportComment` returns `Result_2`; on success a 'Comment reported.' toast. Subsequent click on an already-censored comment short-circuits with an 'already reported' toast (mirrors production guard).
8. **Logged-out flag click opens `LoginModal`** (consistent with all other auth-gated mutations per decision #34 sub-decision 1). Share works without auth (just a clipboard copy).

**ActorsContext additions (extending decision #18):** `downvoteComment(bucketId, commentId)` and `reportComment(bucketId, commentId)`. Both are `PostBucket` methods, both authed; gated at the consumer layer.

**Cache contract additions (extending decision #34):**
- `useDownvoteComment` and `useLikeComment` both filter the caller's principal out of the *other* vote array on optimistic update.
- `useUnvoteComment` filters from both arrays.
- `useReportComment` optimistically flips `isCensored: true`.
- Follow/unfollow no longer invalidate `['article']`; they patch `author.followersCount` / `publication.followersCount` directly by handle.

**Options considered for m5 scope:**

- **A. Match Figma exactly — no per-comment Share.** Rejected: removes a production affordance Mr Nick wants preserved.
- **B. Match production — show Like/Dislike on own comments + per-comment Share for all.** Rejected: voting on your own comment is a UX wart Figma deliberately cleans up.
- **C. Figma + keep per-comment Share — chosen.** Cleanest hybrid: Figma's ownership-aware action set, with the prod Share affordance preserved. One documented deviation from Figma rather than two.
- **D. Defer m5 to a follow-up PR.** Rejected: PR #8 *already* ships a comment-like button, just with the wrong icon and the wrong action surface. Punting m5 leaves the regression in main.

**Rationale:**

- Sweeping the whole review into one fix-up commit-set keeps the merge boundary clean: PR #8 either lands with all reviewer-flagged items addressed, or it doesn't land.
- The m5 expansion is the right place to correct the underlying misread; pretending it's a one-line icon swap would defer the real fix and accumulate scope debt against the rebuild.
- Reusing `useSaveComment` (instead of a new `useEditComment` hook) keeps the comment-mutation surface honest about the canister's unified `saveComment` model. Adding a parallel hook for what is one canister method would introduce drift.
- Direct in-cache follower-count patch is preferable to a refetch in this rebuild: the delta is exactly +/− 1, every cached article query can be patched in microseconds, and we save one network round-trip per follow click.

**Trade-offs accepted:**

- **The Share button on per-comment is a Figma deviation.** Logged in the comment of the `onShare` handler. If a future Figma refresh decides Share belongs only at article level, we drop it here in one line.
- **Censored comment's body is replaced by a 'content rules' placeholder, but the action row is hidden.** This means Like / Dislike / Reply / Flag are unreachable on a censored comment — matches production semantics (reported comments are read-only). A moderator-driven un-censor would require a fresh canister state, not a frontend toggle.
- **`useReportComment` does an optimistic `isCensored` flip even though the canister sets censorship only after moderator review.** This is a slight optimistic-pessimism trade — the user gets immediate visual confirmation ('this comment is now under review'), and the `onSettled` invalidate reconciles with the server-truth flag (which may stay `false` until human review). Erring on the user-confidence side.

**How to apply:**

- When adding a new comment-level action: branch ownership at `CommentBlock` and add the button via the existing `InlineButton` shape. Auth-gate via `useAuth().isAuthenticated` → `useModal().open(<LoginModal />)` pattern.
- When adding a new vote semantic: extend `VoteButtons` rather than creating a parallel pair — the cross-removal invariant lives in one place by design.
- When adding a new ActorsContext method that touches `Comment`: extend the decision #34 cache contract docstring to specify the optimistic shape *before* writing the hook.


**Post-merge fix (folded into the same PR before merge): comment hydration goes by-principal, not by-handle.**

Verified against mainnet 2026-05-21 via `scripts/probe-comments.ts`: `PostBucket.getPostComments` returns `comment.handle = ""` and `comment.avatar = ""` for every comment — only `comment.creator` (principal text) is populated. PR #8's original `useComments` hydration collected handles and called `User.getUsersByHandles`, which always built an empty userMap on this data shape. Every comment rendered with `?` avatar and bare `@` — the rebuild's regression vs production.

Switched to:
- `useComments.collectCreators(...)` (principals)
- `User.getUsersByPrincipals(creators)` (added to the ActorsContext allowlist alongside `downvoteComment` / `reportComment`)
- `userMap` keyed by `principal`, lookup in `CommentBlock` via `userMap.get(comment.creator)`
- Display fields read from `user.handle` / `user.displayName` / `user.avatar` / `user.isVerified` — `comment.handle` and `comment.avatar` are deliberately ignored as unreliable.

Ownership check (`isOwner`) is also principal-based: `principal?.toText() === comment.creator`. This was a deliberate choice anyway, but is now load-bearing — a handle-based check would have failed identically.

The `scripts/probe-comments.ts` diagnostic is kept under `scripts/` (outside `src/`, eslint-disabled) as a reusable canister-shape probe for the next surprise.

---

## #36 — Article editor: Lexical (reaffirms #22; supersedes #22's Quill-for-short-fields clause); TipTap evaluated and declined

**Date:** 2026-05-23

**Status:** Active. Reaffirms the editor portion of #22.

**Decision:** The Write Article rich-text editor (Page 5 / PR #9) uses **Lexical**, as committed in #22. **TipTap** (ProseMirror) was evaluated as an alternative and not adopted. The article body remains **HTML** in the canister `content` field (unchanged from PR #7); Lexical converts via `@lexical/html` (`$generateHtmlFromNodes` on save, `$generateNodesFromDOM` on load). Local autosave stores Lexical's native `editorState` JSON losslessly (browser-only), converting to HTML only on canister Save/Publish.

**Inputs:**
- #22 (2026-04-30, the senior engineer's service catalog) committed Lexical for the long-form editor — but predated PR #7's finding that the body is stored as **HTML**, which is the dominant input to the editor choice.
- TipTap's case: HTML-native model (no JSON↔HTML conversion seam), and `BubbleMenu` / `FloatingMenu` map directly onto the two Page-5 popups (selection toolbar + "+" block menu) with less custom code.
- The counter-case that decided it: Lexical has **no paid tier** (fully MIT, Meta-backed); TipTap is **freemium** (Tiptap Pro/Cloud) with features moved behind a paywall over time — relevant for an SNS-governed DAO avoiding cost/lock-in. Editor choice has **zero SEO/indexing effect** (indexing is owned by the read-side `ArticleHead` + the crawler proxy, decision #32) — so SEO was explicitly NOT a differentiator (a framing Claude corrected after over-attributing an SEO edge to TipTap).
- Round-trip de-risk (read-only mainnet probe, 25 real articles): the legacy editor was **Quill**, not Lexical. The stored-HTML tag universe is exactly `a, blockquote, br, em, h1, h2, h3, img, li, ol, p, pre, span, strong, ul` — no `<hr>`, no `<figure>`, no inline `style=`. Lexical's node set covers all of it on import; minor re-save drift only on empty `<p><br></p>` spacers and old Quill code blocks (both cosmetic, outside authoring scope).
- Mr Nick consulted the senior human engineer for a second opinion before confirming Lexical.

**Options considered:**
- A. **Lexical** (keep #22). **Chosen.**
- B. TipTap (override #22). Rejected — its advantages don't pay off for an HTML-storing rebuild, and it adds a freemium dependency.

**Trade-offs accepted:**
- Lexical's JSON model means HTML in/out goes through `@lexical/html` conversion (the round-trip seam) — mitigated by the narrow, known Quill tag set and an early de-risk chunk that round-trips real articles before building UI.
- A custom `ImageNode` is required (Lexical has no built-in image node); its `exportDOM` must emit a bare `<img>` to match the read renderer's `.article-prose img`.

**How to apply:**
- Register every node the legacy Quill markup uses (+ the custom `ImageNode`). Register `CodeNode` for import-only (never offered in the menus).
- Lazy-load the `/write` + `/my-articles` routes so all `@lexical/*` stays out of the home/article bundles.
- The read side (PR #7 renderer + crawler proxy) is unchanged and remains the security boundary (DOMPurify on read).
- **Supersedes the Quill-for-short-fields clause of #22.** Lexical is the project's *only* rich-text editor; every other field (title, subtitle, bio, comments) is a plain input / `<textarea>`. Verified 2026-05-23: comments shipped plain in PR #8 (`CommentComposer.tsx:158`) and no Quill exists in the repo — the clause was never acted on. Two libraries = two bundles + two serialization formats + double maintenance for no payoff. If a short field ever needs rich text, use a minimal Lexical config, not a second library.

---

## #37 — Drafts require a topic (backend-enforced); accepted for this project

**Date:** 2026-05-24

**Status:** Active.

**Decision:** Saving an article as a draft requires a non-empty body AND 1–3 topics — exactly like publishing. This is enforced by `PostCore.save` on the live canister: the `content == ""` and `tagIds.size() == 0/ > 3` checks run **unconditionally**, not gated by `isDraft` (`~/Projects/aikindapps-Nuance/src/PostCore/main.mo`, in `save`). The frontend accepts this rather than working around it — the topic picker gates both Save-as-draft and Publish (picked once per article; afterwards "Save as draft" saves directly).

**Inputs:**
- Mr Nick wanted topic-free drafts (topics only at publish). Verified the constraint is **backend**, not the frontend check.
- Frontend-only project (#1) against the SNS-governed mainnet canister (#5) — the validation can't be changed here. There's only one save method (no separate draft path).

**Options considered:**
- A. Local-only tag-less drafts (browser autosave only). Rejected — won't appear in My Articles / cross-device; a confusing two-tier draft system.
- B. **Accept the backend rule.** **Chosen** (Mr Nick, 2026-05-24).
- C. Relax the canister `tagIds.size() == 0` check for `isDraft` posts. Deferred — a Motoko change requiring an SNS proposal; out of this frontend project. Revisit if topic-free drafts become a product goal.

**How to apply:**
- Keep the topic picker gating both draft and publish. If topic-free drafts are wanted later, that's backend task C, not a frontend tweak.

---

## #38 — Editing a published article saves in place ("Save changes")

**Date:** 2026-05-27

**Status:** Active.

**Decision:** When a user edits an article that is already published, the editor saves the changes **in place** — the article stays published, and the primary action is labeled "Save changes" (not "Publish"). The old Nuance frontend's flow required unpublishing first, editing as a draft, then republishing; the rebuild does not. Premium articles are out of PR #9 scope and are not covered by this decision.

**Inputs:**
- The legacy frontend's unpublish-first workflow was a UX choice, not a canister constraint. Verified against the vendor monorepo: `PostBucket.save` (`~/Projects/aikindapps-Nuance/src/PostBucket/main.mo`, ~line 1389+) accepts an in-place update of a regular published post. The only canister-side editability lock is `ArticleNotEditable`, which fires for **premium** published posts — premium is out of PR #9 scope.
- PR #9's `useEditArticle` already carries an `isPublished` flag through the editor; the only remaining question was the policy + label, not the wiring.
- Mr Nick wants the rebuild's authoring UX to feel modern (Substack / Medium semantics), not modal-heavy.

**Options considered:**
- **A. "Save changes" preserves published.** Single button, label flips by status, no extra dialogs. **Chosen.** Recommended.
- B. Warn-before-unpublish dialog on edit of a published article. Rejected — replicates the legacy friction without a canister-side reason.
- C. "Save changes" + a separate explicit "Unpublish" action. Deferred — there's no Figma for an Unpublish affordance in PR #9, and the canister supports it via a future `setPostDraft` / equivalent if/when it's needed.

**Trade-offs accepted:**
- No "unpublish" path in this PR. If a user wants to take an article down, they currently can't from the editor — they would need to delete. Acceptable for PR #9 (Figma doesn't show Unpublish); revisit when Page 5 gets a follow-up pass or when My Articles grows article-level actions.
- The status pill (Draft / Published) becomes the only signal of state during editing. Mitigated by flipping the primary button label in sync ("Save as draft" vs "Save changes").

**How to apply:**
- `useEditArticle` is the source of truth for `isPublished`. The save handler branches on it: `isDraft: !isPublished` on the canister payload.
- Primary button label is derived from `isPublished` — never hard-coded. If a new editor surface is built (e.g. a different write screen), it must read the same flag, not duplicate the logic.
- The leave-guard respects published state (a published edit with unsaved changes prompts on navigation, same as a draft).
- If premium editing is ever wired in, this decision does **not** extend to it — the `ArticleNotEditable` canister error must be handled explicitly (likely a read-only state + explainer toast).

---

## #39 — Notifications hydrate by-principal (extends #35 to a second canister type)

**Date:** 2026-06-02

**Status:** Active.

**Decision:** Notification rows are hydrated **by-principal**, not by handle. The Notifications canister's `Notification.content` carries `*Principal*` text fields for every actor (commenter, tipper, follower, subscriber, post writer, etc.) but no handles or avatars. After a page fetch, every principal appearing on the page is collected and resolved batch-style via `User.getUsersByPrincipals`; the resulting `Map<principalText, UserListItem>` rides along with the page object (`NotificationsPage.userMap`) so the renderer never issues its own lookup. This extends decision #35 (PR #8 comments hydrate by-principal because `Comment.handle`/`avatar` come back blank) from comments to a second canister type.

**Inputs:**
- Verified against the vendor monorepo (`~/Projects/aikindapps-Nuance/src/NotificationsV3/main.mo`): `getUserNotifications(from, to)` returns `Notification` records whose content variants hold principal-id text, never resolved handles.
- PR #8 already established the by-principal pattern + `getUsersByPrincipals` batch call; the User canister method and `UserListItem` shape were already wired in `useActors`.
- Notifications paginate, and each page contains a different (small) set of principals — a per-page batch resolve is cheap and avoids an N+1 of per-row lookups.

**Options considered:**
- **A. Per-page batch resolve via `getUsersByPrincipals`, map rides with the page.** **Chosen.** Mirrors #35, one extra call per page, renderer stays pure.
- B. Resolve each principal lazily per row (N calls per page). Rejected — N+1 fan-out, worse latency, no upside.
- C. Hope the canister returns handles. Rejected — it doesn't.

**Trade-offs accepted:**
- The bell-dot/header path (`useUnreadCount` → foldout query) and the `/notifications` route query each resolve their own page's principals, so on `/notifications` two notification queries + two `getUsersByPrincipals` calls fire. Accepted as the documented cost of the shared-cache design (PR #10 review m6).
- A principal the batch misses renders as a graceful `@someone` fallback rather than a raw principal hash (`Handle` component).

**How to apply:**
- `collectPrincipals(content)` (pure util in `lib/collectPrincipals.ts`) is the single place that enumerates which principal fields each of the 14 variants carries. A new variant with a new actor field must be added there **and** in `notificationLabel.tsx`.
- The renderer reads `userMap.get(principalText)?.handle ?? "@someone"` — never the raw principal.
- Caller pattern: `fetchPage` in `hooks/useNotifications.ts` builds the map; the route merges per-page maps via `mergeUserMaps`.

---

## #40 — Notification rendering & read-state policy (generic inline template; money deferred; snapshot-at-open unread styling)

**Date:** 2026-06-02

**Status:** Active.

**Decision:** Three linked policy calls for how notifications render:

1. **One generic inline template per variant** — `@actor + verb + target`, no per-type icons, no avatars. All 14 `NotificationContent` variants render through a single `NotificationBody` switch (`notificationLabel.tsx`) with an exhaustive fallback (`"You have a new notification"`) so an unrecognized canister-side variant degrades safely instead of crashing the foldout. Matches the depicted Figma row shape (1:51584) and keeps foldout rows single-line dense.

2. **Money / token amounts are deliberately omitted** from notification copy. Amount-bearing variants (`TipReceived`, `PremiumArticleSold`, `AuthorGainsNewSubscriber`, …) show *what happened* without an amount ("@actor tipped you on '…'"). Exact balances/amounts belong on Page 7 (Funds Overview); duplicating them here would either go stale or fight the unread-count refresh. Settings endpoints (`getUserNotificationSettings`, `updateNotificationSettings`) exist in the candid but are intentionally **not** exposed in `useActors` — no settings UI in PR #10.

3. **Read-state styling uses a snapshot-at-open, not the live `read` flag** (PR #10 review M2, option A). Opening a surface fires a bulk mark-read whose optimistic update flips `read=true` to clear the bell dot. If row styling read `notification.read` directly, the designed unread accent (Figma 1:51584) would vanish within a frame of opening. Instead `useUnreadSnapshot` freezes which ids were unread the first time the surface saw them; the dot clears immediately while the row accent persists until the surface is closed/reopened.

**Inputs:**
- Figma 1:51584 is a draft: it depicts a generic row shape with read/unread states, no per-type iconography, and is silent on the `/notifications` route and money display.
- The Notifications canister exposes settings endpoints and amount data, but Page 7 (Funds) is the planned home for balances/amounts.
- Senior review of PR #10 surfaced that mark-read-on-open instantly destroyed the unread treatment (M2); the by-principal/optimistic-cache machinery (#39, M1) made a clean read-state freeze the right fix.

**Options considered:**
- Rendering: **A. generic inline template, no icons/avatars** (chosen) vs B. per-type icons (no Figma, more surface, defer).
- Money: **A. omit, defer to Page 7** (chosen) vs B. inline amounts (stale-risk, fights refresh).
- Read-state (M2): **A. snapshot-at-open — dot clears, accent persists** (chosen) vs B. mark-read on close (fuzzier on the route) vs C. accept instant-clear (the Figma read/unread states would be effectively unused).

**Trade-offs accepted:**
- No per-type visual differentiation; all notifications look alike except for the verb/target text. Revisit if a future Figma adds iconography.
- The bell dot reflects only the foldout's first page of unread (PR #10 review m1) — with more unread than `FOLDOUT_PAGE_SIZE`, opening marks page 1 read and the dot dims while later pages still hold unread. A true unread count needs a canister endpoint that doesn't exist; out of scope.
- `useUnreadSnapshot` implements the freeze via React's setState-during-render derived-state pattern (not a ref-during-render — the latter tripped 6 `react-hooks/refs` lint errors and was rejected).

**How to apply:**
- Adding a new notification type: extend `collectPrincipals` (#39), add a `NotificationBody` branch, and rely on the exhaustive fallback until then.
- Do **not** add amounts to notification copy — that surface is Page 7. If settings UI is ever built, wire the two settings endpoints into `useActors` first.
- Row unread styling must come from `useUnreadSnapshot`, never `notification.read` directly; `NotificationItem` takes `unread` as a prop.

---

## #41 — UAT mainnet asset canister (`nuance_uat`), operator-controlled, outside the SNS

**Date:** 2026-06-02

**Status:** Active. **Re-scopes the "deployment scope: local only" lock-in** — operator-controlled mainnet UAT is now in scope; the SNS-controlled prod canister (`nuance.xyz`) remains out of scope. (Decision #1 "frontend only" is unaffected and still holds.)

**Decision:** Deploy a fresh, dfx-managed mainnet **asset** canister `nuance_uat` to validate the rebuild in a real boundary-node + certified-response + cross-origin-agent environment before the SNS-gated prod swap. The canister is controlled by Mr Nick's personal `nick-mainnet` identity (password-protected PEM) — **not** the Nuance DAO — so it needs no SNS proposal. Served at `https://<canister-id>.icp0.io/`, deployed via `npm run deploy:uat`.

**Inputs:**
- The rebuild had only ever run as `vite dev` against live mainnet backends. That never exercises the boundary node, certified asset responses, or the true cross-origin agent path (`<id>.icp0.io` → `icp-api.io`) that prod will use.
- Backend canisters cannot be isolated without parallel Motoko canisters (out of scope, ~15× cycle cost). UAT therefore shares prod backends.
- II 2.0 binds the principal to `derivationOrigin || frontend_origin`; the UAT origin is not in prod's `.well-known/ii-alternative-origins` whitelist.
- dfx 0.30.2 (already installed, matches the vendor/SNS deploy mechanism) uses the cycles ledger directly — no wallet canister needed.

**Options considered:**
- A. Vercel/Netlify preview — rejected (doesn't exercise an asset canister or the IC boundary node).
- B. Local replica only (`dfx start`) — rejected (no boundary node / cross-origin agent path).
- C. Add the UAT origin to prod's `ii-alternative-origins` — rejected (requires an SNS proposal, defeats the "no-SNS" goal).
- D. Parallel mainnet UAT backends — rejected (out of scope, ~15× cycles).
- **E. Fresh mainnet asset canister, accept fresh principal + shared prod backends.** **Chosen.**

**Trade-offs accepted (do not relitigate):**
- **UAT writes mutate real production data** on nuance.xyz. UAT is "new UI on a separate URL against prod backends," not a sandbox.
- **UAT login ≠ nuance.xyz login.** Same Google account → different principal per origin; OpenID does not unify principals across canisters.
- **Single-controller lock-in risk.** A lost PEM = an ungovernable canister. Mitigated by adding a backup controller immediately after the first deploy.

**Implementation notes:**
- `AuthContext.tsx` switched from `import.meta.env.PROD` to `VITE_DEPLOY_TARGET` (`dev | uat | prod`). Only `prod` opts into `derivationOrigin`; `dev` and `uat` both stay `undefined` (fresh principal). The old toggle would have mis-fired for any `vite build` (UAT included) by deriving against prod, breaking auth on the UAT origin.
- `dfx.json` omits the vendor's `well-known/` + `SEO/` source dirs — UAT deliberately does not host its own `ii-alternative-origins` (keeps the principal split explicit); SEO meta + JSON-LD come from the SPA shell (PR #7).
- `public/.ic-assets.json5` sets `enable_aliasing: true` (SPA deep-link fallback — load-bearing for React Router), long-cache for hashed `assets/**`, `security_policy: "standard"`.
- `public/robots.txt` disallows all indexing.
- `scripts/deploy-uat.sh` guards the active identity and creates the canister with an **explicit `--with-cycles` allocation (default 1 TC)** rather than relying on dfx's undocumented default — chosen because the funding balance is modest (see below), not the assumed 10 TC.
- `canister_ids.json` (repo root, dfx-generated) is committed; `.dfx/` and `.env.dfx` are gitignored. Distinct from `src/config/canister_ids.json` (runtime backend map).

**Funding (deviation from the approved plan):** the plan assumed the one-per-lifetime ~10 TC developer faucet coupon. Mr Nick had no coupon, so cycles came from **converting ICP** (`dfx cycles convert --amount <ICP> --ic`) → **2.054 TC** in the `nick-mainnet` cycles-ledger account. Sufficient: an idle ~1.5 MB asset canister burns ~150–300 B cycles/month, so 1 TC runs for decades; the deploy script allocates 1 TC and keeps the rest as reserve.

**Concrete deploy artifacts** (first deploy 2026-06-03):
- Canister ID: `t7yut-2iaaa-aaaah-quu3a-cai`
- URL: https://t7yut-2iaaa-aaaah-quu3a-cai.icp0.io/
- Controller principal (`nick-mainnet`, sole controller): `stmaa-4xjxj-5nqul-e3i2o-knf4c-4rbjz-233ky-3xdb3-d7pua-qr34f-6ae`
- Module hash: `0x63d122d0149a29f4e48603efdd7d2bce656a6a83bac1e3207897c68e8e225bb6`
- Cycles: created with a 1 TC `--with-cycles` allocation out of the 2.054 TC balance (~1 TC reserve retained).
- Backup controller principal: _(TBD — single-controller lock-in risk still open; add via `dfx canister update-settings … --add-controller` from a backup identity)_

**Post-deploy verification (2026-06-03) — all 8 gates green:** gate 1 (asset serve + `ic-certificate`) ✅, gate 3 (SPA deep-link fallback via `enable_aliasing`) ✅, gate 4 (login on the UAT origin → fresh per-canister principal → onboarding, confirming the derivationOrigin split) ✅, gate 5 (cross-origin backend round-trip — articles + storage images load) ✅, gate 6 (authed follow/unfollow write round-trips) ✅, gates 7/8 covered by 3+5 + clean console on the 4/6 paths, robots.txt ✅. **Risk #3 materialized and was fixed:** the standard policy's `img-src 'self' data:` blocked all Nuance imagery (`*.raw.icp0.io` thumbnails / covers / avatars); overridden to `img-src 'self' data: https:` (single CSP header, `connect-src` agent endpoint preserved — verified on the live canister). The AuthContext `VITE_DEPLOY_TARGET` change is validated end-to-end: UAT auth works and produces a distinct principal from nuance.xyz, exactly as intended.

**Still open (Risk #5):** the canister has a single controller. A backup controller must be added (`dfx canister update-settings t7yut-2iaaa-aaaah-quu3a-cai --network ic --add-controller <BACKUP_PRINCIPAL>`) from an identity on another device — tracked, not a code change, can land post-merge.
