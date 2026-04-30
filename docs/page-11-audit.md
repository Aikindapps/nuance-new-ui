# Page 11 — Figma Fidelity Audit

**Compiled:** 2026-04-22
**Last verified against commit:** PR #2 head, 2026-04-30
**Method:** `get_design_context` on every major component on Page 11 (`1:51806`), compared against the corresponding React component in `nuance-ui/src/`.
**Goal:** catalog every gap between what ships and what Figma specifies. Mr Nick reviews before Chunk 2.

## Audit status as of 2026-04-30 (PR #1 + PR #2)

The original tables below remain as historical reference. Items shipped or supersededas of PR #2 head:

- Header logo + search icon swapped to real `LogoNuance` + `IconSearch` SVG components — original CRITICAL items 1–2 in the Header table **RESOLVED**.
- Claps icon, NFT badge, verified icon all now use the `NUR / *` SVG component set — corresponding CRITICAL items in the ArticleSummary tables **RESOLVED**.
- Section heading specs (font weight + color) corrected per the 2026-04-22 resolution. Hero topics heading (item 4) now `text-body lg:text-lg font-bold text-white` — **RESOLVED**.
- Cross-cutting token findings (`--color-ink-border`, `--shadow-purple-glow`, `--shadow-purple-glow-hover`) added to `@theme` — **RESOLVED**.
- `src/assets/icons/nft-logo.svg` deletion — file no longer present, **RESOLVED**.
- Publication article counts (item 3 in resolutions) — **DEFERRED** to publication detail screen as documented; still applicable.
- Gradient angle drift (3°) — **ACCEPTED** as documented. No change needed.
- Mobile patterns invented post-decision-#13 — see decision #13 for the responsive trade-off; not part of this audit's Figma-fidelity scope (Figma file is desktop-only).

Items still applicable for future PRs are flagged in the tables themselves; treat anything not listed above as still open until re-verified.

## Resolutions (2026-04-22)

Mr Nick's answers + Claude's follow-up Figma pulls / codebase checks:

1. **Small card verified icon:** KEEP. Information-bearing; removing would hide the signal. Small card `author.isVerified` continues to render the (newly unfilled) verified icon.
2. **NFT badge:** MATCH confirmed. Figma `NUR / Logo / NFT` SVG path is byte-identical to our inlined `NftBadge`. Both render solid brand-purple. No asset work needed. Also: `src/assets/icons/nft-logo.svg` is **not imported anywhere** and is a leftover from earlier exploration — delete in Chunk 2.
3. **Publication `| N articles`:** DEFER. `UserListItem` has no article count field. Deriving it requires `PostCore.getUserPostIds(handle)` per publication — 2 extra calls on home page, each downloading potentially hundreds of post IDs just to count them. Not worth the overhead for a home-page secondary detail. Revisit when we build the publication detail screen.
4. **Section headings — actual Figma spec pulled:**
   - "Popular writers you might like" (`1:51846`) and "Popular publications you might like" (`1:51860`): **24px Medium, line-height 36, tracking -0.48, color `ink/80%` (rgba(32,33,35,0.8))**. Our `text-title-sm font-bold text-ink lg:text-[28px]` is wrong on all three of size/weight/color. Fix: `text-title-sm font-medium text-ink-80` (drop the `lg:text-[28px]` override).
   - "Topics that might interest you" (`1:51834`): **22px Bold, line-height 32, tracking -0.44, solid white (not white/80)**. Our `text-body font-medium text-white-80 lg:text-lg` is wrong on weight + color. Fix: `text-body lg:text-lg font-bold text-white`.
5. **Gradient angle:** ACCEPT 3° drift. Single `bg-brand-gradient` utility stays. No split needed.

Severity key:
- **CRITICAL** — visible substitution (icon/logo/placeholder) or clear visual mismatch. Must fix.
- **MINOR** — small drift (spacing, weight, opacity) that a user would notice only side-by-side. Fix.
- **QUESTION** — ambiguity worth Mr Nick deciding before fixing.
- **MATCH** — already correct at lg+ (noted so the audit is complete, not just a bug list).

---

## Cross-cutting token findings

These affect multiple components, worth fixing in `index.css` `@theme` once:

- **TWO distinct ink tokens.** Figma uses `#202123` for text (`nur/black/100%`) but **`rgba(55, 58, 73, 1)` / `#373A49`** for borders (`nur/black/20%`). Our `--color-ink: #202123` + `border-ink/20` produces `rgba(32, 33, 35, 0.2)`, which is close but not identical. Recommend adding `--color-ink-border: rgba(55, 58, 73, 1)` so card borders use the correct blue-grey hue. Severity: **MINOR**.
- **Card shadow not tokenized.** Both AuthorBlock and PublicationBlock use `shadow-[0px_3px_10px_-2px_rgba(84,5,212,0.1)]` (Figma calls this "Purple glow light"). Currently duplicated inline. Recommend `--shadow-purple-glow` in `@theme`. Severity: **MINOR**.
- **Gradient angle drift.** Hero uses `-45.37°` gradient (`1:51832`); CTA Banner uses **`-48.68°`** (`1:51853`). Our `@utility bg-brand-gradient` is `-45.37°`, applied to both Hero and CTA Banner. Recommend a separate `bg-brand-gradient-banner` utility for the Banner, OR verify visually whether 3° is perceptible. Severity: **MINOR**.
- **Letter-spacing tokens match** on `text-title-lg` (-0.72px), `text-title-sm` (-0.48px), `text-lg` (-0.44px). Tag label 22px gets `tracking-[-0.44px]` in Figma — our `text-lg` has it ✓. Severity: **MATCH**.

---

## Header (`Header.tsx` vs Figma `1:51866`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Logo | White square with "N" letter (`LogoPlaceholder`) | `NUR / Logo / Nuance Icon` — 46×51px SVG asset | **CRITICAL** |
| 2 | Search icon | Inlined hand-drawn `SearchIcon` (20px, 2px stroke) | `NUR / Icon / Search` — 24px SVG asset | **CRITICAL** |
| 3 | Search placeholder | `italic text-body placeholder:text-white-80` | `not-italic` + solid white (`var(--nur/white/100%)`). Font: Regular (not Medium). | **MINOR** |
| 4 | Search icon wrapper | Bare icon in a 24-32px button | Icon wrapped in a **32×32 `NUR / Button tertiary`** inside the input | **MINOR** |
| 5 | Search input width at xl | `xl:w-[405px]` | 405px ✓ | **MATCH** |
| 6 | Nav "Discover" / "About Nuance" | `text-body font-bold ... lg:text-lg` (18→22 Bold) | 22px Bold, white / white-80 | **MATCH** at lg+ |
| 7 | Login button | `h-12 ... rounded-card border border-white px-6 text-body font-medium` | 48h, 8r, white border, 24/12 padding, 18px Medium | **MATCH** at lg+ |
| 8 | Get started button | White bg, 18px Medium brand-purple text, rounded-card | Same | **MATCH** at lg+ |
| 9 | Mobile hamburger (`MenuIcon`) | Inlined hand-drawn 3-line icon | **Not in Figma** (desktop-only file, per decision #13) | Accept — keep hand-drawn |

---

## Article Summary — LARGE variant (`ArticleSummary.tsx` vs Figma `1:51821`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Claps icon | Inlined hand-drawn (stroke, ~spout shape) | `NUR / Icon / Claps` — 24px SVG asset | **CRITICAL** |
| 2 | Verified icon | **Filled** `VerifiedBadge` always shown when `author.isVerified` | `NUR / Icon / Verified **unfilled**`. Filled variant is reserved for other states. | **CRITICAL** (wrong variant) |
| 3 | NFT badge | Inlined `NftBadge` SVG using `currentColor` + `text-brand-purple` | `NUR / Logo / NFT` — real asset. Need to verify code SVG matches real logo (may already be same path extracted earlier). Also check: is the Figma logo mono-purple or multi-color? | **QUESTION** — verify visually |
| 4 | Outer gap image→info | `gap-4 lg:gap-6` (16/24) | 24px | **MATCH** at lg+ |
| 5 | Account gap (avatar↔text) | `flex flex-wrap items-center gap-2` (8px) | `gap-[16px]` | **MINOR** |
| 6 | Excerpt size at lg | `lg:text-lg` = 22px Medium, line-height 32, tracking -0.44 | Matches ✓ | **MATCH** at lg+ |
| 7 | Title clamp | `line-clamp-3` (3 lines) | `max-h-[136px] overflow-hidden` on 44px line-height = 3 lines | **MATCH** (different mechanism, same result) |
| 8 | Excerpt clamp | `line-clamp-2` (2 lines) | `max-h-[66px]` on 32px line-height = ~2 lines | **MATCH** |
| 9 | Bar gap | `gap-6` (24px) | `gap-[32px]` | **MINOR** |
| 10 | Author line verified placement | Purple text paragraph + verified icon sibling with 8px gap | Same 8px gap between paragraph and icon ✓ | **MATCH** |
| 11 | Bookmark icon | Not rendered | **Not in Figma home card** | **MATCH** (no action needed) |
| 12 | Read time | Not rendered | **Not in Figma home card** | **MATCH** (no action needed) |

---

## Article Summary — SMALL variant (`ArticleSummary.tsx` vs Figma `1:51808`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Claps icon | Inlined hand-drawn | `NUR / Icon / Claps` SVG — same asset as large | **CRITICAL** |
| 2 | Verified icon on small card | **Renders** when `author.isVerified` | **Not present.** Figma small card has no verified icon in the author byline. | **QUESTION** — remove, or keep as information-bearing signal? |
| 3 | NFT badge on small | Hidden via `showNft={large}` | Not shown ✓ | **MATCH** |
| 4 | Outer gap image→info | `gap-4 lg:gap-6` (16/24) | `gap-[16px]` (not 24!) | **MINOR** — small cards should stay at 16px, not grow at lg |
| 5 | Account gap (avatar↔text) | `gap-2` (8px) | `gap-[16px]` | **MINOR** |
| 6 | Title size | `text-title-sm font-bold` (24px Bold, line-height 36, tracking -0.48) | Same ✓ | **MATCH** |
| 7 | Excerpt size | `text-body` (18px Medium, line-height 28) + `line-clamp-2` | 18px Medium line-height 28, **no clamp** (text flows to container height) | **MINOR** — Figma shows 4 lines naturally; our 2-line clamp is tighter |
| 8 | Bar gap | `gap-6` (24px) | `gap-[32px]` | **MINOR** (same fix as large) |
| 9 | Author line Publication underline | Only "Writersbest" publication name underlined (in large); small variant is **not underlined at all** in Figma | Our code underlines publication name in both variants | **MINOR** — small shouldn't underline |

---

## Author Block (`AuthorBlock.tsx` vs Figma `1:51848`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Verified icon | Inlined hand-drawn `VerifiedIcon` (filled with checkmark) | `NUR / Icon / Verified unfilled` — **same asset as in large article card** | **CRITICAL** |
| 2 | Border color | `border-ink/20` = `rgba(32,33,35,0.2)` | `rgba(55,58,73,0.2)` (`#373A49` at 20%) | **MINOR** (see cross-cutting) |
| 3 | Shadow | Inline `shadow-[...84,5,212,0.1]` + hover `0.2` shadow | Base matches ✓; Figma does not specify hover | **MATCH** (keep our hover) |
| 4 | Padding at lg | `lg:p-8` (32px) | 32px ✓ | **MATCH** |
| 5 | Width at lg | `lg:w-[248px]` | 248px ✓ | **MATCH** |
| 6 | Avatar size at lg | `lg:size-[120px]` | 120×120 ✓ | **MATCH** |
| 7 | Name "@handle" typography | `text-title-sm font-medium` (24/36 Medium tracking -0.48) | 24/36 Medium tracking -0.48 ✓ | **MATCH** |
| 8 | Followers text | `text-[16px] font-medium leading-6 text-ink-80` | 16 Medium, leading 24, ink/80 ✓ | **MATCH** |
| 9 | Bio text | `text-[16px] leading-normal text-ink-80` (no font-weight = 400) | 16 Regular, leading normal, ink/80 ✓ | **MATCH** |
| 10 | Duplicated verified SVG | `VerifiedIcon` in `AuthorBlock.tsx` is byte-identical to `VerifiedBadge` in `ArticleSummary.tsx` | Same Figma asset | Dedupe to shared `IconVerified` in Chunk 2 |

---

## Publication Block (`PublicationBlock.tsx` vs Figma `1:51863`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Followers line | `{N} followers` (e.g. "20K followers") | `20K followers \| 105 articles` — **includes article count** | **CRITICAL** — missing field |
| 2 | Title weight | `font-medium` (Medium 500) | Medium 500 ✓ | **MATCH** |
| 3 | Title color | `text-ink` (#202123) | `text-black` (likely #000, not #202123) | **QUESTION** — the ink/pure-black distinction is subtle; keep `text-ink` unless Mr Nick sees a difference |
| 4 | Border color | `border-ink/20` | `rgba(55,58,73,0.2)` | **MINOR** (cross-cutting) |
| 5 | Shadow | Inline purple-glow | Matches ✓ | **MATCH** |
| 6 | Padding at lg | `lg:p-10` (40px) | 40px ✓ | **MATCH** |
| 7 | Avatar size at lg | `lg:size-[120px]` | 120×120 ✓ | **MATCH** |
| 8 | Avatar rounding | `rounded="card"` = 8px radius | `rounded-[8px]` ✓ | **MATCH** |
| 9 | Layout | Content left (min-w-0 flex-1) + avatar right | Content left 428px fixed + avatar right | **MINOR** — our fluid layout is probably fine, but Figma's content column is fixed at 428px |

---

## Tabs (`Tab.tsx` vs Figma active `1:51817` + inactive `1:51818`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Inactive weight | Always `font-bold` | Inactive is **Medium (500)**, only active is Bold | **CRITICAL** (visible weight shift difference) |
| 2 | Inactive color | `text-ink-60` (rgba(32,33,35,0.6)) | `rgba(32,33,35,0.8)` = `text-ink-80` | **MINOR** |
| 3 | Active color | `text-brand-purple` | Purple ✓ | **MATCH** |
| 4 | Active underline | `after:h-0.5 after:bg-brand-purple` (2px) | 2px border-bottom purple ✓ | **MATCH** |
| 5 | Tab bar continuous bottom border | **Missing** (only active tab has underline) | Inactive tabs also carry a **1px `rgba(55,58,73,0.2)` border-bottom**. Effectively the tab bar has a continuous 1px line with the active tab's 2px overlapping. | **CRITICAL** (visible missing line under inactive tab) |
| 6 | Horizontal padding | `px-6` (24px) | 25px | **MATCH** (off by 1px, acceptable) |
| 7 | Vertical padding | `py-3` (12px) | 12px ✓ | **MATCH** |

---

## CTA Banner (`CtaBanner.tsx` vs Figma `1:51853`)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | Radius | `rounded-[24px]` | 24px ✓ | **MATCH** |
| 2 | Gradient angle | `bg-brand-gradient` = -45.37° (same as Hero) | **-48.68°** | **MINOR** — see cross-cutting |
| 3 | Heading size at md | `md:text-[40px] md:leading-[44px]` | 40px line-height **40px** (not 44) | **MINOR** |
| 4 | Heading weight | `font-bold` | Bold ✓ | **MATCH** |
| 5 | Body text | `text-body` (18px Medium) | 18px Medium ✓ | **MATCH** |
| 6 | Button width | `w-[280px]` at md+ | 280px ✓ | **MATCH** |
| 7 | Button height | `h-12` (48) | 48 ✓ | **MATCH** |
| 8 | Buttons vertical stack gap | `gap-3` (12px) | Figma buttons at top:120 + top:188 = 20px gap (16→20 with line height) | **MINOR** |
| 9 | Banner container width | Sits inside max-w-1440 parent | Figma width 1456 with 232px margin either side of 1920 canvas | **QUESTION** — may be close enough via page container sizing |

---

## Section headings (confirmed 2026-04-22)

| # | Area | Code renders | Figma says | Severity |
|---|------|--------------|------------|----------|
| 1 | "Popular writers you might like" | `text-title-sm font-bold text-ink lg:text-[28px]` | **24px Medium, line-height 36, tracking -0.48, ink/80% (rgba(32,33,35,0.8))** | **CRITICAL** — wrong size at lg, wrong weight, wrong color |
| 2 | "Popular publications you might like" | Same | Same as #1 | **CRITICAL** |
| 3 | "Topics that might interest you" (Hero) | `text-body font-medium text-white-80 lg:text-lg` | **22px Bold, line-height 32, tracking -0.44, solid white (not white/80)** | **CRITICAL** — wrong weight + wrong opacity |
| 4 | "Explore all topics" link | `text-body font-medium text-white underline` | Not yet pulled; visually plausible match | **MATCH** probable |
| 5 | "View all publications" link | `text-body font-medium text-brand-purple` | Uses `NUR / Button tertiary` component | **MATCH** probable |

---

## What's genuinely CRITICAL (must fix)

- **Header logo** — square "N" → real Nuance logomark SVG
- **Header search icon** — hand-drawn → real `NUR / Icon / Search`
- **Claps icon** (large + small) — hand-drawn → real `NUR / Icon / Claps`
- **Verified unfilled icon** — used in large article card + AuthorBlock. Currently filled variant. Need unfilled SVG + dedupe across components.
- **Publication article count** — missing `| N articles` in follower line
- **Tab weight on inactive** — Bold → Medium
- **Tab bar continuous bottom border** — 1px `rgba(55,58,73,0.2)` line under the full tab bar, not just under the active tab

## Nice-to-fix (MINOR, bundle with the CRITICAL fixes)

- Small card spacing: `gap-[16px]` for avatar↔text (currently 8); outer gap stays 16 at lg (currently grows to 24); bar gap 32 (currently 24); no excerpt line-clamp
- Border color token (`--color-ink-border: rgba(55,58,73,1)`)
- Shadow token (`--shadow-purple-glow`)
- Gradient angle utility split (Hero -45.37°, Banner -48.68°)
- Heading font-size for "Popular writers" / "Popular publications" (likely 36px, currently 28px)
- CTA Banner button stack gap 20px, heading line-height 40px

## Open questions for Mr Nick

1. **Small card — verified icon:** Figma small variant has no verified icon. Remove? Or keep as information-bearing signal?
2. **NFT badge:** our inlined `NftBadge` SVG vs Figma's `NUR / Logo / NFT` — visually verify they match. Mono-purple vs multi-color?
3. **Publication article count:** is `post.articleCount` or equivalent exposed by the User / PostCore canister? Need to check vendor Motoko before adding the field.
4. **Section headings 36px question:** shall I pull one more Figma round to verify, or accept the block-height inference and just swap to 36px?
5. **Gradient angle:** accept 3° drift (one utility) or split into two (`bg-brand-gradient-hero` + `bg-brand-gradient-banner`)?

---

## Next step

Mr Nick reviews this audit. Once aligned:
- **Chunk 2** pulls the SVG assets (logo, Search, Claps, Verified unfilled, NFT) — 5 assets, single Figma MCP session — and swaps the inlined hand-drawn SVGs + `LogoPlaceholder` for real Figma components under `src/components/ui/icons/`.
- **Chunk 3** fixes the remaining MINOR gaps (spacing, weights, borders, tokens, heading sizes, button stack) and adds the `| N articles` field if available on the canister.
