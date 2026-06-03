# Nuance UI (new)

Fresh frontend for [Nuance](https://nuance.xyz), the on-chain blogging platform by
Aikin Dapps. A ground-up rebuild of the user interface against the `UX-Overhaul-2`
Figma design. Talks to the existing live mainnet canisters — no backend changes.

Lives alongside the canister monorepo at
[`aikindapps/Nuance`](https://github.com/aikindapps/Nuance) and supersedes the earlier
standalone [`aikindapps/nuance-frontend`](https://github.com/aikindapps/nuance-frontend).

## Scope

- **Frontend only.** No Motoko changes.
- **Local development + a personal UAT mainnet canister** (see [Deployment](#deployment)).
  No production (`nuance.xyz`) deploys from this repository. `nuance.xyz` is
  SNS-governed; any production update requires a community proposal + vote, and
  the DAO performs the deploy.

## Stack

| Concern      | Choice                                                         |
|--------------|----------------------------------------------------------------|
| Build        | Vite 8                                                         |
| Framework    | React 19 + TypeScript                                          |
| Styling      | Tailwind v4 (CSS-first, `@theme` in `src/index.css`)           |
| Routing      | React Router v7                                                |
| Data         | TanStack Query over `@icp-sdk/core` + generated Candid bindings |
| Font         | Manrope (Google Fonts — free substitute for Figma's GT Walsheim) |
| Auth (soon)  | Internet Identity + Plug + NFID                                |

## Running it

Requires Node 20+ and a modern browser.

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` — the page fetches live mainnet data from the
canisters listed in `src/config/canister_ids.json` via `https://icp-api.io`.

Routes currently implemented:

- `/` — Popular home (backed by `PostCore.getPopularThisWeek`)
- `/new` — Latest home (backed by `PostCore.getLatestPosts`)

## Layout

```
src/
  routes/          Page-level components (one per URL)
  features/
    home/
      sections/    Hero, TabBar, ArticleGrid, CtaBanner, PopularWriters,
                   PopularPublications
      hooks/       useArticles (infinite scroll), usePopularDiscovery
                   (writers + publications + topics from one shared sample)
      types.ts     Article
  components/ui/   Reusable primitives: Header, Tag, Tab, SectionHeading,
                   Avatar, AuthorBlock, PublicationBlock, ArticleSummary/,
                   icons/ (LogoNuance, IconSearch, IconClaps, IconVerified,
                   IconNft)
  lib/             HTTP agent + actor factories, formatCount, useInView
  candid/          Generated TypeScript bindings per canister
                   (PostCore, PostBucket, User, Storage + root .did files)
  config/          canister_ids.json — mainnet canister IDs
  assets/          SVG assets pulled from Figma
  index.css        @theme design tokens (colors, typography, radii,
                   purple-glow shadows, brand gradient)
```

## Data flow

Home page (both `/` and `/new`) runs this pipeline per page of results:

1. `PostCore.getPopularThisWeek(from, to)` or `getLatestPosts(from, to)` —
   returns `PostKeyProperties[]` with tags and bucket pointers.
2. Group by `bucketCanisterId`, fire one call per bucket to
   `PostBucket.getPostsByPostIds(ids, false)` to get full post bodies.
3. Collect unique author / publication handles, **lowercase them**, call
   `User.getUsersByHandles(handles)` once to hydrate avatars, display names,
   verified flags, follower counts.

The `.toLowerCase()` step is non-obvious but non-optional — the User canister
looks up via a lowercase reverse index and silently returns nothing for any
case-preserved handle. See `docs/decisions.md` and source comments.

## Documentation

- [`docs/decisions.md`](docs/decisions.md) — numbered log of architectural
  decisions with inputs, options considered, and rationale
- [`docs/page-11-audit.md`](docs/page-11-audit.md) — Figma-vs-code fidelity
  audit for the logged-out home page

## Known out-of-scope

- No authentication yet. Header "Login" / CTA "Get started" buttons link to
  placeholder routes.
- No article detail, editor, profile, or notifications screens yet.
- No SSR / pre-rendering. Home is CSR; SEO architecture is unblocked but the
  rendering-mode choice is deferred to the production handoff per
  `docs/decisions.md#5`.
- Bundle size is ~608 kB of unminified JS. Code-splitting is a follow-up.

## Deployment

**Production (`nuance.xyz`) is deferred.** It happens via the Nuance SNS DAO — a
community proposal and vote — once the rebuild is screen-complete. Nothing in
this repo deploys to prod.

### UAT mainnet canister

A personal, dfx-managed asset canister (`nuance_uat`) for validating the rebuild
in a real boundary-node + certified-response environment before the SNS-gated
prod swap. It belongs to the operator, **not** the Nuance DAO — no SNS proposal
needed (decision #41).

> [!WARNING]
> **UAT writes hit production data.** The backend canisters are shared and
> cannot be isolated, so any write you make on UAT — publishing, commenting,
> liking, following — mutates **real `nuance.xyz` data**. UAT is "new UI on a
> separate URL against prod backends," not a sandbox.

**Prerequisites**
- `dfx` 0.30.2+.
- A password-protected mainnet identity named `nick-mainnet`
  (`dfx identity new nick-mainnet --storage-mode password-protected`).
- Cycles in that identity's cycles-ledger account (faucet coupon, or
  `dfx cycles convert --amount <ICP> --ic`). ~1 TC is plenty.

**Deploy**
```bash
npm run deploy:uat
```
One command: builds with `VITE_DEPLOY_TARGET=uat`, guards that the active
identity is `nick-mainnet`, deploys, and prints the URL. The canister is served
at `https://<canister-id>.icp0.io/`.

**Login behavior.** Internet Identity 2.0 derives the principal per origin, so
signing in on UAT with the *same* Google account as `nuance.xyz` produces a
**different** principal — the UAT origin is not in prod's
`.well-known/ii-alternative-origins` whitelist. OpenID does not unify principals
across canisters. Only a `VITE_DEPLOY_TARGET=prod` build (served from the
whitelisted prod origin) carries existing principals over.

**Note on `canister_ids.json`.** The dfx-generated `canister_ids.json` at the
**repo root** holds the public UAT canister id and is committed on purpose, so
deploys from any clone target the same canister. Do not confuse it with
`src/config/canister_ids.json`, which is the runtime map of backend canister
ids the app talks to.
