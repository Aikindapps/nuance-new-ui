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
