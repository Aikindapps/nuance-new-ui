# IC Dev — Decision Log

Significant decisions that shape the project. Append-only. If a decision is reversed, mark the old entry "Superseded by #N" rather than editing it.

Each entry captures: **what was chosen**, **what else was considered**, and **why** — so future-us (or anyone picking this up) understands the reasoning, not just the outcome.

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
