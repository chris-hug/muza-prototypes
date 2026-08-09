---
name: Muza design system kitchen sink
description: Design system overview for Muza music streaming platform — colors, tokens, typography, components
type: project
---

## Project
Next.js App Router · TypeScript · Tailwind CSS v4 · @base-ui/react v1.3.0 · shadcn/ui patterns
Figma file key: **L9yw4Yaec9YtAXGxP8q4fu**
Kitchen sink at: `src/app/page.tsx` (Explore view)

---

## "Send to Figma" — ALWAYS use this pattern

When the user asks to send any page, modal, or component to Figma, **don't ask them to click a toolbar or run `window.figma.captureForDesign` in the console** — the hash-based auto-trigger (`#figmacapture`) is unreliable with this SPA (`ssr: false` in `react-router.config.ts`) because React clobbers the URL during hydration.

Instead: **inject the capture script + a floating dev-only "📸 Capture to Figma" button** into the root HTML `<head>`. The button is bottom-right, `z-index: 2147483647`, re-mounted via `setInterval` so React hydration can't clobber it. One click opens the element picker; the user clicks the target; it's on their clipboard to paste into Figma.

**Exact snippet for `app/root.tsx`** (or equivalent Next.js `layout.tsx` head):
```tsx
{/* Figma capture — script + dev-only "Capture" button. Remove when done. */}
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function () {
        function mountBtn() {
          if (document.getElementById("__figma_capture_btn")) return;
          var b = document.createElement("button");
          b.id = "__figma_capture_btn";
          b.textContent = "📸 Capture to Figma";
          b.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;padding:10px 14px;border-radius:9999px;border:1px solid rgba(0,0,0,.1);background:#0D0D04;color:#FAFCF4;font:600 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);";
          b.onclick = function () {
            if (!window.figma || !window.figma.captureForDesign) {
              alert("Capture script not ready yet — try again in a second.");
              return;
            }
            window.figma.captureForDesign({ selector: "*" });
          };
          document.body.appendChild(b);
        }
        if (document.readyState === "complete" || document.readyState === "interactive") mountBtn();
        else document.addEventListener("DOMContentLoaded", mountBtn);
        setInterval(mountBtn, 1000);
      })();
    `,
  }}
/>
```

**Workflow to offer the user:**
1. Inject the snippet into the root HTML file's `<head>`.
2. Confirm the dev server URL (check `lsof -i :PORT` — Muza worktrees often use **:3001**, not the Vite default 5173).
3. Open in their browser (user prefers **Arc** — `open -a "Arc" "<url>"`).
4. They click the black pill, click the element, paste into Figma.
5. **Remind them to ask you to remove the snippet** once they're done.

**Ports gotcha:** don't assume 5173. Sibling worktrees each run their own dev server; always `lsof -i :<port>` to confirm which project owns a port before opening a URL.

## Color Variables — ALWAYS use these, never hardcode hex or Tailwind defaults

### Semantic tokens (mode-aware, use in all components)

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--background` | `#FEFFFB` | `#0D0D04` | page / main surface |
| `--foreground` | `#0D0D04` | `#FAFCF4` | primary text |
| `--card` | `#FEFFFB` | `#0D0D04` | card surface |
| `--card-foreground` | `#0D0D04` | `#FAFCF4` | card text |
| `--popover` | `#FEFFFB` | `#0D0D04` | popover / dropdown surface |
| `--popover-foreground` | `#0D0D04` | `#FAFCF4` | popover text |
| `--primary` | `#1E34D8` | `#1E34D8` | brand blue (muza-blue-200) — solid **fill**: buttons, shuffle-active, progress |
| `--primary-foreground` | `#FAFCF4` | `#FAFCF4` | ink on a primary **fill** (white-ish text on a blue button) |
| `--primary-text` | `#1E34D8` | `#3F66FF` | primary **ink** on neutral surfaces — links, ghost/outline-primary labels, accent icons. Dark lifts to blue-100 for legibility |
| `--secondary` | `#ECEEDF` | `#2E2C24` | secondary surface; ghost hover bg |
| `--secondary-foreground` | `#1D1C18` | `#FAFCF4` | text on secondary bg |
| `--muted` | `#FAFCF4` | — | lightest fill (barely visible) |
| `--muted-foreground` | `rgba(84,84,69,0.75)` | — | de-emphasised text |
| `--accent` | `rgba(246,248,238,0.75)` | — | subtle hover / selection fill |
| `--accent-foreground` | `#1D1C18` | — | text on accent |
| `--destructive` | `#DC2626` | — | error / delete |
| `--destructive-foreground` | `#FEF2F2` | — | text on destructive |
| `--border` | `#DADDCD` | — | dividers, input borders |
| `--input` | `#EDEFE4` | — | input background fill |
| `--ring` | `#1D1C18` | — | focus ring |

### Sidebar tokens

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `#FEFFFB` | `#0D0D04` |
| `--sidebar-foreground` | `#1D1C18` | `#FAFCF4` |
| `--sidebar-primary` | `#ECEEDF` (neutral-200) | `#3C3D33` (neutral-700) | active item bg (emphatic) |
| `--sidebar-accent` | `#F9FAF0` (neutral-50) | `#2E2C24` (neutral-800) | hover bg (subtle, same as muted) |
| `--sidebar-border` | `#DADDCD` | — |

### Muza neutral palette (warm olive-tinted, NOT Tailwind gray)
Exact match to Figma file L9yw4Yaec9YtAXGxP8q4fu. `--background` (#FEFFFB "muza white") is separate and NOT part of this scale.
All available as `bg-neutral-{n}` / `text-neutral-{n}` / `border-neutral-{n}`:

| Token | Hex | Semantic role |
|---|---|---|
| `neutral-50` | `#F9FAF0` | `--muted` (light) · `--primary-foreground` |
| `neutral-100` | `#F1F3E6` | `--secondary` (light) · `--sidebar-accent` (light) |
| `neutral-200` | `#ECEEDF` | `--accent` (light) · `--sidebar-primary` (light) · `--input` (light) |
| `neutral-300` | `#DADDCD` | `--border` (light) · `--sidebar-border` (light) |
| `neutral-400` | `#B5B7A7` | mid-tone |
| `neutral-500` | `#86887C` | subdued |
| `neutral-600` | `#69695D` | `--muted-foreground` base (light) |
| `neutral-700` | `#3C3D33` | `--accent` (dark) · `--sidebar-primary` (dark) · `--border` (dark) |
| `neutral-800` | `#2E2C24` | `--secondary` (dark) · `--sidebar-accent` (dark) |
| `neutral-900` | `#1D1C18` | `--muted` (dark) · `--sidebar` (dark) |
| `neutral-950` | `#0D0D04` | muza black = `--foreground` (dark) |

**Never use Tailwind's default `gray-*`, `slate-*`, `zinc-*`, `stone-*` — always use `neutral-*` or semantic tokens.**

---

## Figma primitive tokens — dimension scales

Raw numeric values that the semantic aliases resolve to. These are the **source of truth** — semantic names (in the next section) always point here. Colors are covered separately in the semantic-alias section below; this section only lists dimensional tokens.

### Spacing (4px base)
`0` (0) · `0.5` (2) · `1` (4) · `1.5` (6) · `2` (8) · `2.5` (10) · `3` (12) · `3.5` (14) · `4` (16) · `5` (20) · `6` (24) · `7` (28) · `8` (32) · `9` (36) · `10` (40) · `11` (44) · `12` (48) · `14` (56) · `16` (64) · `20` (80) · `24` (96) · `28` (112) · `32` (128) · `36` (144) · `40` (160) · `44` (176) · `48` (192) · `52` (208) · `56` (224) · `60` (240) · `64` (256) · `72` (288) · `80` (320) · `96` (384) · `px` (1)

### Width / Height — same numeric steps as spacing (w-0…w-96 / h-0…h-96)

### Max-width
`xs` 320 · `sm` 384 · `md` 448 · `lg` 512 · `xl` 576 · `2xl` 672 · `3xl` 768 · `4xl` 896 · `5xl` 1024 · `6xl` 1152 · `7xl` 1280

### Breakpoints
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536

### Layout — page max-width tiers

The app uses **two content-growth tiers** so very wide viewports don't leave gaping white margins, while medium widths stay grid-aligned and the artist hero never dominates the page.

| Tier | Trigger | Container `max-w` | Content area (px-10) | Grid cards | Hero `max-h` |
|---|---|---|---|---|---|
| 1 (default) | viewport < 1920px | `1480px` | 1400px | 6 × 220 | 552px (= 1480 × 400/1072) |
| 2 (wide screen) | viewport ≥ **1920px** | `1716px` | 1636px | 7 × 220 | 640px (= 1716 × 400/1072) |

**Apply the tier-aware cap on every top-level page wrapper:**
```tsx
<div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-10 …">
```

**Grids step from 6 → 7 cards** at `@container` width ≥ `1500px` (intentionally above tier-1's 1400 cap so the 6-card layout never collapses into 7 smaller cards):
```tsx
<ul className="grid grid-cols-[repeat(1,minmax(143px,220px))]
  @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))]
  @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))]
  @min-[692px]:grid-cols-[repeat(4,minmax(143px,220px))]
  @min-[928px]:grid-cols-[repeat(5,minmax(143px,220px))]
  @min-[1164px]:grid-cols-[repeat(6,minmax(143px,220px))]
  @min-[1500px]:grid-cols-[repeat(7,minmax(143px,220px))]
  gap-x-4 gap-y-6">
```

`CardRail` mirrors the same step map — see [`src/components/app/card-rail.tsx`](src/components/app/card-rail.tsx).

**Song rail (`SongRail`, `song-rail.tsx`)** is the row-shaped sibling of `CardRail`: it stacks [Song List Item](src/components/ui/song-list-item.tsx) rows into columns of **3** and scrolls sideways (1 column < 692px with a peek, 2 ≥ 692, 3 ≥ 1164 — widths from the rail's own `100%` so columns align with `CardRail` at the same width). It is the single shared shell for **Artist › Top Songs** and **Search › Songs**; each host passes its own pre-rendered rows (`rows: ReactNode[]`) so the rail stays data-agnostic. `title` heading is `text-base`. `onShowAll` is optional (omit → no "Show all", e.g. Top Songs); when present, "Show all" + the ◀ ▶ arrows appear **only on overflow**, and the arrows are pointer-only (hidden on touch / < 692px). Shown in the DS under "Song Rail".

**Artist hero (`ArtistHero`, `artist-hero.tsx`)** uses the same dual cap (a reusable component, also shown in the DS under "Artist Header"):
```tsx
<section className="aspect-[1072/400] min-h-[320px] max-h-[552px] min-[1920px]:max-h-[640px] …">
```
Past each ceiling the photo crops horizontally via `object-cover` rather than inflating the hero.

### Bottom gutter — player clearance

The persistent player floats over the content (desktop: `AppPlayer` pinned ~`bottom-5`, ~80px tall; mobile: footer-nav + mini bar stacked, ~112px). So **the app shell's single scroll container carries `pb-32` (128px) on every page** — applied once on the scroll `<div>` in the root shell ([`app/routes/home.tsx`](app/routes/home.tsx)), not per page — so the last content can always scroll clear of the bar and nothing hides behind it. Don't rely on per-page bottom padding; add page-specific bottom space *on top of* this gutter only if a layout needs it.

**Keep all three caps in sync.** If you change the tier-1 max-w, you must also recompute the tier-1 hero `max-h` (`max-w × 400/1072`) and the tier-2 mirror.

### Missing artwork — branded fallback (`CoverArt`)

Empty states must read as **intentional**, never as a broken image. Every piece of release/portrait artwork goes through a branded fallback rather than a raw `<img>`:

- **Albums / songs / releases** — use [`CoverArt`](src/components/ui/cover-art.tsx): a square `<img>` that, when `src` is missing **or fails to load** (`onError`), swaps to a `bg-muted` box centered on a soft **solid-`secondary`** muza `LogoMark`. The `className` applies to both the image and the fallback box (same square), so rounding/sizing match.
- **Artists** — the [`ArtistCard`](src/components/ui/artist-card.tsx) portrait uses the same language in a **circle** (`bg-muted` + solid-`secondary` mark), inset via padding so portrait-aspect thumbnails never render oval.

**Rules.** The mark is **solid `text-secondary` (no alpha)** so the three overlapping circles read as one flat shape (alpha darkens where they cross). Fallback fill is always `bg-muted`. Don't hand-roll per-surface placeholders — route through `CoverArt` / the `ArtistCard` pattern so the empty state is consistent everywhere.

### Border-radius (primitives, px)
`rounded-none` 0 · `rounded-sm` 2 · `rounded` 4 · `rounded-md` 6 · `rounded-lg` 8 · `rounded-xl` 12 · `rounded-2xl` 16 · `rounded-3xl` 24 · `rounded-4xl` 32 · `rounded-full` 9999

### Border-width
`border-0` 0 · `border-0-5` 0.5 · `border-1` 1 · `border-2` 2 · `border-4` 4 · `border-8` 8

### Opacity
0 · 5 · 10 · 15 · 20 · 25 · 30 · 35 · 40 · 45 · 50 · 55 · 60 · 65 · 70 · 75 · 80 · 85 · 90 · 95 · 100

### Blur
`blur-none` 0 · `blur-sm` 4 · `blur` 8 · `blur-md` 12 · `blur-lg` 16 · `blur-xl` 24 · `blur-2xl` 40 · `blur-3xl` 64

### Font weight
`thin` 100 · `extralight` 200 · `Light` 300 · `Regular` 400 · `Medium` 500 · `Semibold` 600 · `Bold` 700 · `extrabold` 800 · `black` 900

### Letter-spacing
`tighter` -0.8 · `tight` -0.4 · `normal` 0 · `wide` 0.25 · `wider` 0.8 · `widest` 1.6

### Line-height
`leading-3` 12 · `leading-4` 16 · `leading-5` 20 · `leading-6` 24 · `leading-7` 28 · `leading-8` 32 · `leading-9` 36 · `leading-10` 40

### Font-size primitives (raw values)

**Primitives are the only layer that holds a number.** Semantic aliases and typography presets reference these — they **never** hardcode px values.

Figma primitives now match Muza CSS 1:1 after Figma was updated to adopt Muza's scale (text-xxs = 15 (bumped from 14) as a first-class primitive, all other sizes shifted up one step).

| Primitive | Figma value | Muza CSS value | Aligned? |
|---|---|---|---|
| `text-xxs` | **15**  | 15  | ✅ |
| `text-xs`  | **17**  | 17  | ✅ |
| `text-sm`  | **19**  | 19  | ✅ |
| `text-base`| **21**  | 21  | ✅ |
| `text-lg`  | **24**  | 24  | ✅ |
| `text-xl`  | **30**  | 30 (fixed)        | ✅ |
| `text-2xl` | **36**  | 32 → 36 (fluid)   | ✅ |
| `text-3xl` | **48**  | 34 → 48 (fluid)   | ✅ |
| `text-4xl` | **60**  | 38 → 60 (fluid)   | ✅ |
| `text-5xl` | **72**  | 44 → 72 (fluid)   | ✅ |
| `text-6xl` | **96**  | 52 → 96 (fluid)   | ✅ |
| `text-7xl` | **128** | 62 → 128 (fluid)  | ✅ |
| `text-8xl` | **160** | 72 → 160 (fluid)  | ✅ added |
| `text-9xl` | **200** | 84 → 200 (fluid)  | ✅ added |

**Display sizes (`text-2xl`–`text-9xl`) are FLUID** — each is a `clamp(min, vw-interpolation, max)` where `max` is the desktop ceiling (the Figma value) and `min` is a mobile floor, interpolating across a **360px → 1280px** viewport band and pinning at both ends. `text-xl` and below stay **fixed** (body/UI text must not reflow with the viewport). The raw `clamp()` definitions live in [`app/app.css`](app/app.css) — never restate the px in components; use the semantic alias.
| `text-8xl` | **160** | 160 | ✅ |
| `text-9xl` | **200** | 200 | ✅ |

---

## Figma semantic tokens — canonical source of truth

Figma is the source of truth for all tokens. **Components must always reference the semantic alias names, never the primitive values** — the semantic layer is what decouples Figma → code.

### Color aliases (Figma → CSS)

All map 1:1 to CSS custom properties in `app/app.css`. Light + dark modes are distinct aliases in Figma (e.g. `accent-light` / `accent-dark`) and collapse to one CSS variable (`--accent`) that switches via the `.dark` class.

| Figma alias | Light hex | Dark hex | CSS variable |
|---|---|---|---|
| `accent` | `#F1F3E6` (neutrals-100) | `#2E2C24` (neutrals-800) | `--accent` |
| `accent-foreground` | `#1D1C18` (neutrals-900) | `#F9FAF0` (neutrals-50) | `--accent-foreground` |
| `background` | `#FEFFFB` (muza-white) | `#0D0D04` (muza-black) | `--background` |
| `background` 0%/20%/50%/75% | `#FEFFFB α…` | `#0D0D04 α…` | (alpha variants) |
| `border` | `#DADDCD` (neutrals-300) | `#3C3D33` (neutrals-700) | `--border` |
| `card` | `#FEFFFB` | `#0D0D04` | `--card` |
| `card-foreground` | `#0D0D04` | `#F9FAF0` | `--card-foreground` |
| `destructive` | `#DC2626` (tw-red-600) | `#7F1D1D` (tw-red-900) | `--destructive` |
| `destructive-foreground` | `#FEF2F2` (tw-red-50) | `#FEF2F2` | `--destructive-foreground` |
| `foreground` | `#0D0D04` (neutrals-950) | `#F9FAF0` (neutrals-50) | `--foreground` |
| `foreground` 15% | α | α | (alpha) |
| `input` | `#ECEEDF` (neutrals-200) | `#DADDCD` (neutrals-300) | `--input` |
| `muted` | `#F9FAF0` (neutrals-50) | `#1D1C18` (neutrals-900) | `--muted` |
| `muted` 0%/alpha | α | α | (alpha) |
| `muted-foreground` | `#545445 @75%` (neutrals-a75-700) | `#F9FAF0 @50%` (neutrals-a50-50) | `--muted-foreground` |
| `popover` | `#FEFFFB` | `#0D0D04` | `--popover` |
| `popover-foreground` | `#0D0D04` | `#F9FAF0` | `--popover-foreground` |
| `primary` | `#1E34D8` (blue-200) | `#1E34D8` (blue-200) | `--primary` |
| `primary-foreground` | `#F9FAF0` | `#F9FAF0` | `--primary-foreground` |
| `primary-text` | `#1E34D8` (blue-200) | `#3F66FF` (blue-100) | `--primary-text` |
| `ring` | `#1D1C18` (neutrals-900) | `#DADDCD` (neutrals-300) | `--ring` |
| `secondary` | `#F1F3E6` (neutrals-100) | `#2E2C24` (neutrals-800) | `--secondary` |
| `secondary-hover` | `#ECEEDF` (neutrals-200) | `#3C3D33` (neutrals-700) | `--secondary-hover` |
| `secondary` 0%/75% | α | α | (alpha) |
| `secondary-foreground` | `#1D1C18` | `#F9FAF0` | `--secondary-foreground` |
| `chart-1..5` | varied | varied | `--chart-1..5` |
| `sidebar-*` | varied | varied | `--sidebar-*` (same shape as above) |

**Rule: never write hex colours in component code. Always use semantic token classes (`bg-primary`, `text-muted-foreground`, `border-border`) or the CSS variable references.**

**Rule: primary *fill* vs primary *ink*.** Use `bg-primary` (+ `text-primary-foreground`) for a solid blue **fill** — buttons, progress, shuffle-active. Use **`text-primary-text`** whenever the blue is **ink on a neutral surface** — links, ghost/`outline-primary` button labels, accent icons (checkmarks), the filled library heart. Never use bare `text-primary` for text: `--primary` (blue-200) is only ~2.2:1 on the dark background, whereas `--primary-text` lifts to blue-100 (`#3F66FF`) in dark mode while staying identical in light. The `link` and `outline-primary` Button variants already bake this in.

### Border-radius aliases

| Figma alias | Value | CSS variable |
|---|---|---|
| `sm` | 2px | `--radius-sm` |
| `default` / `md` | 6px | `--radius` / `--radius-md` |
| `lg` | 8px | `--radius-lg` |
| `xl` | 12px | `--radius-xl` |
| `2xl` | 16px | `--radius-2xl` |
| `3xl` | 24px | `--radius-3xl` |
| `full` | 9999px | `--radius-full` |

### Typography — semantic size aliases

**Each semantic alias points at a primitive** (e.g. `small → text-xs`). Callers use the semantic name; the primitive holds the actual px value. Aliases also carry their own line-height + letter-spacing reference.

Clean 1:1 name match — `2x small ↔ text-xxs`, `small ↔ text-sm`, `base ↔ text-base`, `3x large ↔ text-3xl`, etc. No shifting, no surprises.

The **"Resolves to"** column shows three numbers in the order `font-size / line-height / letter-spacing`, all in **px** (letter-spacing is "Figma-absolute px" — `wide = 0.25px` additional tracking).

| Semantic alias | → Size primitive | → Line-height | → Letter-spacing | Resolves to (px: size / lh / tracking) |
|---|---|---|---|---|
| `2x small`    | `text-xxs`  | `leading-4`  | `normal`      | 15 / 16 / 0 |
| `extra small` | `text-xs`   | `leading-4`  | `normal`      | 17 / 16 / 0 |
| `small`       | `text-sm`   | `leading-5`  | `wide` (0.25) | 19 / 20 / 0.25 |
| `base`        | `text-base` | `leading-6`  | `normal`      | 21 / 24 / 0 |
| `large`       | `text-lg`   | `leading-7`  | `normal`      | 24 / 28 / 0 |
| `xlarge`      | `text-xl`   | `leading-7`  | `normal`      | 30 / 28 / 0 |
| `2x large`    | `text-2xl`  | `leading-8`  | `normal`      | 36 / 32 / 0 |
| `3x large`    | `text-3xl`  | `leading-9`  | `normal`      | 48 / 36 / 0 |
| `4x large`    | `text-4xl`  | `leading-10` | `normal`      | 60 / 40 / 0 |

### Muza CSS implementation — now fully aligned ✅

Both bugs fixed. Full upper range present; aliases use `var()` references.

| Token (Muza CSS) | Kind | Value | Status |
|---|---|---|---|
| `--text-xxs`   | primitive         | `15px`  | ✅ |
| `--text-xs`    | primitive         | `17px`  | ✅ |
| `--text-sm`    | primitive         | `19px`  | ✅ |
| `--text-base`  | primitive         | `21px`  | ✅ |
| `--text-lg`    | primitive         | `24px`  | ✅ |
| `--text-xl`    | primitive         | `30px`  | ✅ |
| `--text-2xl`   | primitive         | `36px`  | ✅ |
| `--text-3xl`   | primitive         | `48px`  | ✅ |
| `--text-4xl`   | primitive         | `60px`  | ✅ |
| `--text-5xl`   | primitive         | `72px`  | ✅ |
| `--text-6xl`   | primitive         | `96px`  | ✅ added |
| `--text-7xl`   | primitive         | `128px` | ✅ added |
| `--text-8xl`   | primitive         | `160px` | ✅ added |
| `--text-9xl`   | primitive         | `200px` | ✅ added |
| `--text-2xsmall` | semantic alias  | `var(--text-xxs)`  → 15 | ✅ wired via var() |
| `--text-xsmall`  | semantic alias  | `var(--text-xs)`   → 17 | ✅ wired via var() |
| `--text-small`   | semantic alias  | `var(--text-sm)`   → 19 | ✅ wired via var() |
| `text-base`      | sanctioned semantic | 21 (name = token; no separate alias) | ✅ — use `text-base` directly |
| `--text-large`   | semantic alias  | `var(--text-lg)`   → 24 | ✅ wired via var() |
| `--text-xlarge`  | semantic alias  | `var(--text-xl)`   → 30 | ✅ wired via var() |
| `--text-2xlarge` | semantic alias  | `var(--text-2xl)`  → 36 | ✅ wired via var() |
| `--text-3xlarge` | semantic alias  | `var(--text-3xl)`  → 48 | ✅ wired via var() |
| `--text-4xlarge` | semantic alias  | `var(--text-4xl)`  → 60 | ✅ wired via var() |

### Typography — layer relationships at a glance

Three layers, left to right: **Preset** (what a component author picks) → **Semantic alias** (what it points to) → **Primitive** (where the raw value lives).

| Preset (Figma) | → Size alias | → Size primitive | Resolved px | → Line-height | → Tracking | Weight |
|---|---|---|---|---|---|---|
| `h1`          | `4x large`    | `text-4xl` | 60 | `leading-10` | `tight` (-0.4) | Bold 700 |
| `h2`          | `3x large`    | `text-3xl` | 48 | `leading-9`  | `tight` (-0.4) | Bold 700 |
| `h3`          | `2x large`    | `text-2xl` | 36 | `leading-8`  | `tight` (-0.4) | Bold 700 |
| `h4`          | `xlarge`      | `text-xl`  | 30 | `leading-7`  | `tight` (-0.4) | Semibold 600 |
| `lead`        | `xlarge`      | `text-xl`  | 30 | `leading-7`  | `normal` | Regular 400 |
| `large`       | `large`       | `text-lg`  | 24 | `leading-7`  | `normal` | Regular 400 |
| `blockquote`  | `base`        | `text-base`| 20 | `leading-6`  | `normal` | Regular 400 *italic* |
| `list`        | `base`        | `text-base`| 21 | `leading-7`  | `normal` | Regular 400 |
| `table`       | `extra small` | `text-xsmall` | 17 | —         | `normal` | Regular 400 — data tables use the smaller step |
| `p`           | `small`       | `text-small`| 19 | `leading-6`  | `normal` | Regular 400 |
| `inline code` | `small`       | `text-small`| 19 | `leading-5`  | `normal` | Semibold 600 mono |
| `small`       | `extra small` | `text-xsmall` | 17 | `leading-4`  | `wide` (0.25) | Regular 400 |

### Non-typography alias → primitive examples (same pattern)

Every semantic token across the system follows `alias → primitive`. Examples:

| Kind | Semantic alias | → Points at primitive | Resolved value |
|---|---|---|---|
| Color | `accent` (light) | `muza-neutrals/100` | `#F1F3E6` |
| Color | `primary` (light + dark) | `muza-blue/200` | `#1E34D8` |
| Color | `destructive` (light) | `tailwind-red/600` | `#DC2626` |
| Color | `muted-foreground` (light) | `muza-neutrals/a75/700` | `#545445 @75%` |
| Radius | `md` | `radius/rounded-md` | `6px` |
| Radius | `2xl` | `radius/rounded-2xl` | `16px` |

The rule is identical: **an alias never holds a raw value; it references the primitive that does.**
| `large` | sans | 20 | 28 | 400 regular | 0 | — |
| `small` | sans | 14 | 14 | 400 regular | 16 (wide) | — |
| `table` | sans | 18 | — | 400 regular (bold 700) | 0 | — |

**Font families**
- `font-sans` → Founders Grotesk
- `font-serif` → Georgia (used in headings' `font-heading` utility)
- `font-mono` → Menlo

---

## Typography — Founders Grotesk

### Type scale (explicit px in globals.css to avoid rem ambiguity)

| Class | Size | Usage |
|---|---|---|
| `text-xxs` | 15px | **minimum** — chips, badges, button-sm only |
| `text-xs` | 17px | media-card title + meta, table rows, captions, metadata, helper text |

**Media-card text contrast.** On cards, list rows, and media items the **title is `font-normal`** and the **meta rows are `font-light` with `tracking-[0.02em]`** (both `text-xsmall`/17px) — the weight contrast (not size) is what separates title from artist/year/price. Keep title↔meta vertical rhythm even (single `gap`); meta stays `text-muted-foreground`.
| `text-sm` | 19px | body, labels, inputs, nav sub-items, song-list rows |
| `text-base` | 21px | lead text, nav items, primary content; Card Rail section titles |
| `text-lg` | 24px | large body |
| `text-xl` | 30px | H4 |
| `text-2xl` | 36px | H3 |
| `text-3xl` | 48px | H2 |
| `text-4xl` | 60px | display |
| `text-5xl` | 72px | H1 |

### Font weight rules (strict)

| Weight | Class | Rule |
|---|---|---|
| Regular 400 | `font-normal` | **Default** — body text, descriptions, labels, metadata |
| Medium 500 | `font-medium` | **Emphasis & headlines** — headings ≥18px, nav items ≥18px, button labels, tab labels, card titles |
| Semibold 600 | `font-semibold` | **Hardly ever** — only H1 and H2 |
| Bold 700 | `font-bold` | **Never** |

**Sub-18px rule: anything < 18px (text-sm, text-xs) must be `font-normal` UNLESS it is a button label, tab label, or card title (which are explicit exceptions).**

---

## Buttons (Figma node 37:931)

| Size | Height | H-padding | Font | Weight |
|---|---|---|---|---|
| `sm` | 32px `h-8` | 12px `px-3` | 15px `text-xxs` | `font-normal` |
| `default` | 36px `h-9` | 16px `px-4` | 18px `text-sm` | `font-medium` |
| `lg` | 40px `h-10` | 32px `px-8` | 18px `text-sm` | `font-medium` |
| `icon-sm` | 32px `size-8` | — | — | — |
| `icon` | 36px `size-9` | — | — | — |
| `icon-lg` | 40px `size-10` | — | — | — |

Ghost hover bg: `hover:bg-secondary` (NOT muted — too light)

---

## Chips (Figma node 21232:6353 filter · 21232:6420 dismissable)

Height: 32px (`h-8`) · Padding: 12px (`px-3`) · Gap: 8px (`gap-2`) · `rounded-full`
Font: 15px `text-xxs` `font-normal`
Variants: **default** (`bg-background border-border hover:bg-muted` — same as outline button) · **selected** (`bg-primary border-primary text-primary-foreground`)
No secondary or ghost variants — those don't exist in Figma.
Dismissable chips use `<ChipDismiss>` with X icon (14px).

---

## Badges

Shape: `rounded-[2px]` · Padding: `pt-[4px] pb-[6px] px-1.5` · Font: `text-xxs font-medium` · Never uppercase

### `<ContentTypeBadge>` (Figma node 21368:27118)
Used on tracks/releases/artists/labels. Always `bg-secondary text-secondary-foreground` + left Lucide icon (12px).
Types: `song` (Music2) · `album` (Disc3) · `single` (Disc3) · `ep` (Disc3) · `artist` (Mic) · `playlist` (ListMusic) · `label` (Building2 — the same icon as the "Go to label" action).

### `<StatusBadge>` (Figma node 21368:27118)
Track visibility. Always glassmorphism: `backdrop-blur-sm bg-background/50 border-[0.5px] border-neutral-500 text-muted-foreground`.
Always has left icon + right chevron. Statuses: `public` (Globe) · `private` (Lock)

### `<Badge>` primitives (Figma node 26:169)
Design system base variants: `default` (neutral-950) · `secondary` · `outline` (glassmorphism) · `destructive`

### Where content-type badges belong — STRICT

A badge that repeats what the surrounding UI already states is noise. `ContentTypeBadge` is allowed **only** where the type isn't otherwise obvious:

| Surface | Badge? | Why |
|---|---|---|
| Search results (rows, cards) | **no** | the category tabs already name the type |
| Library list rows / `MediaListItem` | **no** | the view is single-type |
| Mobile "…" sheet header | **yes** | the sheet is context-free once open — album, playlist **and artist** |
| Artist discography rows | **yes** | Album / Single / EP is a real distinction inside one list |
| Studio | **yes** | mixed-type inventory |

Never pair a badge with a subtitle that says the same word ("Artist" under a name + an "Artist" badge).

---

## Context Menu

Title: `text-xs font-normal text-muted-foreground`
Item: `text-base font-normal text-popover-foreground leading-normal`
Container: `w-64 bg-popover border border-border rounded-xl py-1 shadow-lg`

---

## Player components

### PlayerOverlay (`src/components/ui/player-overlay.tsx`) — full-screen mobile sheet
Canonical "Now Listening" sheet. Adaptive sizing via `ResizeObserver` on the root; every element stays visible from iPhone SE (320×568) to 17 Pro Max (440×956) without scrolling.

**Layout (top → bottom):**
1. Drag handle (`Button variant="ghost"` wrapping a `h-1 w-8` pill)
2. "Playing from:" header — `text-xxs` label + `text-xs font-medium` context line, both `text-muted-foreground`
3. Album cover — square, `rounded-xs` (2px), sized dynamically between 140–440px. Blurred full-bleed copy sits behind everything as the background, with a `bg-background/40 dark:bg-background/70` tint for legibility.
4. Title row — `<h2 text-lg font-medium>` with `<MarqueeText>` (auto-scrolls if it overflows) + two `Button variant="outline" size="icon"` (Plus, MoreVertical) for glass effect
5. Artist badge — `Button variant="ghost" size="sm"` with 24px avatar (`ring-border`) + artist name
6. Waveform row — timestamps (`text-xxs tabular-nums`) flanking a `<Waveform>` that scales 40–160px tall
7. Secondary icons row — Info / Share / Radio as `Button variant="ghost" size="icon-sm"` (`flex-1` region, centred)
8. Transport row (`flex-1`, `justify-center`, `gap-3`) — ShuffleToggle · SkipBack · Play · SkipForward · Repeat. All five in a tight cluster, not spread across the width.
9. Tabs — `<Tabs variant="pill">` with Lyrics / Now listening / Up next. Tabs trigger uses `font-normal!` to win specificity. Wrapper: `pt-5 pb-6` (extra top padding so transport feels visually centred in its flex region).

**Transport sizing** (via `lerp(small, large)` driven by device height 568→956):
- Play button: 48→64px (icon 36→48)
- Skip buttons: icon 20→28 inside `Button variant="ghost" size="icon-sm"` with `hover:bg-transparent` (no pill hover state)
- Shuffle/Repeat: 48→64 wide × 40→56 tall, icon 20→28 — promoted to "first-class transport" footprint, not secondary

### ShuffleToggle (`src/components/ui/shuffle-toggle.tsx`)
Shared shuffle button used by PlayerBar, PlayerBar-B, and PlayerOverlay. Emphasises the control:
- Active state: `bg-primary` + halo ring animating outward (`animate-shuffle-halo`)
- Icon pops on activation: `animate-shuffle-pop` (scale 1→1.35→0.92→1 with slight wobble)
- `key={pulseCount.current}` on the halo + icon re-triggers the animation on every toggle-on
- Repeat keeps a plain low-key secondary toggle — asymmetry is intentional

### PlayerBar (`src/components/ui/player-bar.tsx`) and PlayerBar-B
Responsive pill with disc + transport + waveform. Uses container queries (`@min-[640px]:`, `@min-[688px]:`, `@min-[800px]:`). Player-B folds shuffle/repeat into the transport row instead of the far-right cluster.

### Shared utilities
- **Transport icons** (`src/components/ui/transport-icons.tsx`): `SkipBackFilled`, `PlayFilledAlt`, `SkipForwardFilled` — Carbon-style filled SVGs, accept `className` + `style`
- **Waveform** (`src/components/ui/waveform.tsx`): `@wavesurfer/react` wrapper. Resolves `var(--…)` to rgb for canvas, strips alpha (restored via shadow-DOM `opacity: 0.5` on unplayed canvas). Height responsive via `setOptions({ height })` + patched shadow-DOM `[part="canvases"].minHeight`.
- **Keyframes in `app.css`**: `player-overlay-marquee`, `shuffle-pop`, `shuffle-halo`, plus `.animate-shuffle-pop` / `.animate-shuffle-halo` utility classes

---

## Token semantic rules — STRICT

Tokens are **roles**, not colours. Never mix roles.

| Token | Role | Use for |
|---|---|---|
| `background` | base canvas | page surface only |
| `foreground` | primary text | default text/icons on background |
| `muted` | subtle structural fill | slider track, skeleton, barely-visible bg |
| `muted-foreground` | de-emphasised text | secondary text, captions, placeholders |
| `secondary` | neutral UI surface | card fills, section backgrounds, default button fill — **structure only** |
| `secondary-foreground` | text on secondary | — |
| `accent` | interaction state | hover, active, selected — **always more emphatic than secondary** |
| `accent-foreground` | text on accent | — |

**Rules:**
- `accent` must always be visually stronger than `secondary` — it signals state, secondary is just structure
- Never use `accent` for layout / static surfaces
- Never use `secondary` for hover or active states
- `muted-foreground` is the de-emphasis text token — not `muted` itself (which is a background fill)
- Every token is a surface + its `-foreground` pair — always use them together
- **NEVER** use `gray-*`, `slate-*`, `zinc-*`, `stone-*` — use `neutral-*` or semantic tokens
- **NEVER** hardcode hex values — use CSS variable tokens
- Dark mode managed via `.dark` class on `<html>`, ThemeProvider in `layout.tsx`
- Toast: `ToastProvider` wraps layout, `useToast()` works anywhere inside

---

## Responsive & pointer — gating rules

**Breakpoints / hooks (the real ones):**
- `useFooterNav()` → **608px** viewport: sidebar ⇄ bottom tab bar; desktop Topbar ⇄ frosted `MobileAppHeader`.
- `useIsMobile()` → **< 768px** viewport: the canonical phone gate for **swapping a component for a different one** (e.g. dropdown ⇄ bottom sheet).
- `--page-px` gutter tiers: ≥1069 → 40px, 584–1068 → 24px, < 584 → 12px.
- Container-query column steps (cards/rails/library grids): `304→2 · 464→3 · 692→4 · 928→5 · 1164→6 · 1500→7`. The mobile↔desktop **behaviour** boundary (rail swipe-peek, MediaHeader stacking) is **560px container**.

**Gate on viewport, NOT `hover:` media queries, when choosing between two component renders.** `[@media(hover:none/hover)]:!hidden` is fine for *cosmetic* show/hide of a control, but to render a *different component* (dropdown vs sheet) use `useIsMobile()`. Reasons: the headless preview reports `hover: hover` even at phone width (so a hover-gated sheet never appears there), and hybrid touch-laptops report `hover: hover` too. Example: `DetailMoreButton` does `if (isMobile) return <Sheet>…; return <DropdownMenu>…`.

---

## Mobile surfaces — sheets

Three escalating surfaces, all bottom-anchored on phones:

**1. Responsive dialog → bottom sheet — the BASE DEFAULT.** **Every** `Dialog` and `AlertDialog` is a **bottom sheet on mobile** and a **centered modal on desktop (sm+)** — no per-dialog opt-in. It's baked into the base `DialogContent` / `AlertDialogContent` (`dialogPositionClass` in [`dialog.tsx`](src/components/ui/dialog.tsx)): mobile `inset-x-0 bottom-0 max-w-full rounded-t-2xl rounded-b-none slide-in-from-bottom`; desktop `sm:left-1/2 sm:top-1/2 sm:-translate-* sm:rounded-2xl zoom-in`. Individual dialogs only set their **desktop width** (`sm:max-w-*`) and any height/scroll behaviour — they must **not** re-declare the positioning. To **grow with content up to the viewport** (less scrolling): make `DialogContent` `flex flex-col max-h-[92vh] sm:max-h-[85vh]`, the header `shrink-0`, and the scroll body `min-h-0` (fills to the cap, scrolls only on overflow).

**2. DropdownMenu auto-sheet.** The app `DropdownMenu` already presents as a bottom sheet on touch — use it for simple "…" lists.

**3. Advanced bottom-sheet "…" menu** (`DetailMoreButton`, Album/Playlist/Artist). Rich, store-aware action surface, gated by `useIsMobile()`:
- **Header** — `MenuCover` (square cover / 2×2 playlist collage / round artist avatar, **72px** ≈ the 3 text lines) + title + `ContentTypeBadge` + meta. No divider; generous `pb-6`.
- **Quick actions** — a row of icon-over-label pills: `flex-1 rounded-2xl bg-secondary px-2 py-3.5`, icon `size-5` + `text-xsmall`. Per kind: Share · Save · (Edit / Play radio …).
- **Grouped rows** — `SheetRow`s (44px tap target) separated by `h-px bg-border` dividers: Add to a playlist · Play next · Add to queue · Credits / Go to artist / Go to label · Report / Delete (destructive).
- The published-header config (`usePublishDetailHeader`) must forward **every** field via live getters — a stale whitelist silently drops `covers`/`meta`/library binding.

**Overlay panels don't push content.** A panel that opens under a sticky header (e.g. the search recent/suggestions panel) is `absolute inset-x-* top-full z-40` (out of flow) so it floats over the page instead of displacing it.

---

## Save to library — wording & behaviour

- The affordance is **"Save"** / **"Save to library"** — never "Add". Toasts read **"Saved to Library"** / **"Removed from Library"**.
- Bind to the global store with `libraryType` + `libraryId` (the same keys the header/card hearts use) so every surface stays in sync. The action **flips Save ⇄ Remove** by live store state; the heart fills (`fill-primary-text text-primary-text`) when saved.
- `LibraryHeartButton` is the one heart everywhere (detail headers, player, rows, cards); `DetailMoreButton`'s Save quick action and the card/row menus all read the same store.

---

## Search surface

The Explore page **is** the search/discover surface; results are URL-backed (`?page=Explore&q=…&scope=…`) and identical on desktop and mobile.

- **`SearchPanel`** (on focus) — empty query → "Your recent searches" (clock rows, removable); typing → plain-text suggestions. localStorage-backed recents (`search-catalog`).
- **`SearchResultsView`** — `Search for: <q>` heading (desktop; dropped on mobile since the search field shows it) · **scope** `ToggleGroup` (Muza Catalog / My Library — full-width in the mobile header, inline on desktop) · category filter (underlined `Tabs variant="line"` on desktop, `MobilePillTabs` on mobile) · results.
- **Category tabs show only types that have results** (All is always present) — an empty type (e.g. Labels with no match) is dropped so users never click into nothing. If the active tab empties out as the query narrows, it falls back to All. No counts on tabs (they churn per keystroke and clutter the strip; matches Spotify / Apple / YT).
- A **specific tab** (Songs / Artists / Albums / …) is a flat vertical list of **`MediaListItem`** rows (songs play / open their album, containers navigate); the `label` kind renders like an artist (round) with a "Label" badge + album count.

### Search results — All composition

The **All** tab is **not** a flat list — it's a Top-result hero followed by one **shelf per content type**, mirroring the Home rails so search reads as part of the same system. Rules (enforced in [`search-results-view.tsx`](src/components/app/search-results-view.tsx)):

- **Top result** — the single best-ranked match, promoted to an oversized hero card (big cover, large title, content-type badge, Play button for playable kinds). It is **removed from its own type section**, so that section appears only when there are OTHER hits of that type (e.g. more artists with a similar name); a lone match never gets a redundant one-item rail repeating the hero.
- **Section order is relevance-driven** — a type's position is set by where its best-ranked hit falls, and the Top result's type still leads when it has siblings. Tie-break order: Songs · Artists · Albums · Playlists · Labels.
- **Songs** — the shared **`SongRail`** (same shell as Artist › Top Songs: 3 rows per column, 1 col < 692 with peek, 2 ≥ 692, 3 ≥ 1164) when there are **≥ 6** songs; a plain **vertical list** when **≤ 5** (6 = the first count that fills two full 3-row columns, so fewer would leave a ragged column).
- **Artists / Albums / Playlists** — a **`CardRail`** of the matching cards when **≥ 2**; a **single inline card** (no rail chrome) when exactly **1**.
- **Labels** — always a simple vertical list (no card / no detail page).
- **Empty types are omitted** (no empty shelves).
- **"Show all"** appears **only when the shelf actually overflows** (there's off-screen content to scroll to) → opens that type's tab. Sections that already show every hit (e.g. 3 cards that fit, or a ≤5-song list) get **no** "Show all" — it would reveal nothing. Card rails use `CardRail`'s `showAllOnlyWhenScrollable`; `SongRail` gates it on its own overflow check.
- **Sparse query (≤ 2 total results)** → skip the shelves: Top result + a short vertical list.

Needs an `@container` ancestor (the All wrapper sets one) so the rails' `@min-[…]` column steps resolve against the content area.

---

## Media menus — ONE menu per media kind

There is exactly **one** "…" menu per media kind, and every surface triggers that same menu. A card's "…", a list row's "…" and the detail page's "…" are the *same component with the same items* — only context-dependent rows are gated out. If two surfaces show different items for the same object, that's a bug.

**Built by** `useDetailActions()` in [`detail-more-button.tsx`](src/components/ui/detail-more-button.tsx), consumed three ways:
- `<DetailMoreButton {...props} />` — trigger + surface (dropdown on desktop, bottom sheet on mobile)
- `<DetailMenuItems {...props} />` — items only, to drop inside an existing menu (card / row "…")
- `<SongMenuItems />` in [`song-list-item.tsx`](src/components/ui/song-list-item.tsx) — the song equivalent

**Song menu — the canonical item set** (every song surface: album, playlist, search, artist Top Songs, library):
Show credits · Share · Save to library / Remove from library · Add to a playlist · Go to artist · Go to album · Report

Context gating, nothing else:
- `hideAddToPlaylist` — inside your own playlist (it's already there)
- `hideGoToArtist` — on that artist's page
- `hideGoToAlbum` — on that album's page

**Handlers are baked in, not wired per call site.** Library save, share, credits, report and add-to-playlist resolve inside the component from `libraryType` + `libraryId`. Call sites that "forget" to pass a handler used to silently lose rows — a `live()` filter now drops any action with no handler, so a missing row means a missing binding, not a design choice.

**Library keys must match across surfaces.** Albums are keyed by **catalog id** (`a02`), not by title slug — use `libraryIdForTitle(title) ?? slugify(title)`. Playlists and artists are keyed by slug. A card writing to a different key than its detail page is why hearts silently desync.

**Owned playlists never bind the library.** Your own playlist is in your library by definition: `variant="my-playlist"` swaps the save heart for **Edit**, and the menu drops Save entirely.

**Playlists navigate to their OWNER, not an artist.** `useDetailActions` reads `onGoToOwner` for the playlist kind and `onGoToArtist` for everything else — passing the wrong one drops the row with no error.

---

## Share — one adaptive action

**One row, everywhere.** Where the Web Share API exists the button/row opens the **native OS sheet** ("Share…", `Share` icon); everywhere else it **copies the link** ("Copy link", `Link2` icon) and toasts. Never both rows — the native sheet already offers copy alongside AirDrop / messaging.

`ShareButton` (standalone trigger) and `ShareMenuItems` (inside a menu) both come from [`share-button.tsx`](src/components/ui/share-button.tsx) and share `useShare()`, so every share affordance in the app behaves identically.

---

## Library views — tabs, filter, table

- **Status filters are tabs, not a dropdown** — Playlists (All / By you / Saved), Albums (All / Owned / Downloaded), Songs (All / Downloaded). **Desktop only**: on mobile the strip competes with the content-type nav and reads as clutter, so it's hidden.
- **In-library search** is a single shared store, [`use-library-filter.ts`](src/lib/use-library-filter.ts) (`useSyncExternalStore`), so the desktop field and the mobile header field drive the same query. The header clears it on unmount — a collapsed mobile field must never leave a hidden filter applied.
- **Playlist cards carry a byline** — "By you" for your own, "By {name}" for saved ones.
- **List tables** get an **Added** column + sort, and a **create row** leading the list (the same pattern as Studio's upload row).

---

## Create playlist / Add music

One flow, started from every entry point via [`create-playlist-context.ts`](src/lib/create-playlist-context.ts) — `useCreatePlaylist().open()`. Entry points: sidebar "+" (expanded header row and collapsed rail), mobile Library header "+", the Playlists grid tile. Same pattern for `useAddToPlaylist()`.

The provider mounts both steps: **New Playlist** (cover tile, name `Input`, "Keep private" setting row) → **Add music**.

**Typing in Add music switches to global search** — not a local filter. The results render with the standard search pattern: content-type **pills** (`MobilePillTabs`), songs selectable via `MediaListItem` + a trailing `Checkbox`, containers as nav rows.

**"Add music" row** leads your own playlist's track list while the header is in its **stacked layout** (`@min-[560px]:hidden`) — a normal list row: `size-12` `bg-secondary` circle with the bespoke `AddMusicIcon`, then the label. Never nest a primary/filled button inside a secondary row.

---

## Playlist edit drawer (desktop)

Owner-only **Edit** on a playlist docks a panel on the right that **persists across navigation** — you can browse to Home, search, open any album, and drag tracks into the playlist still held in the drawer. It is **docked, not an overlay**: it takes width from the content instead of covering it.

- State lives in [`playlist-editor-context.ts`](src/lib/playlist-editor-context.ts); `<PlaylistEditDrawer />` is mounted once at app level.
- **Drag and drop** uses the private MIME type `application/x-muza-song` (`SONG_DRAG_TYPE`) so only Muza rows are accepted. Every `SongListItem` is draggable.
- **Resizable** via [`use-resizable-width.ts`](src/lib/use-resizable-width.ts): handle on the panel's left edge, width remembered in localStorage, re-clamped to the **current** viewport on restore and on window resize (a width stored on a wide screen must not crush a narrow one). While dragging, the width is written straight to the element inside a rAF — React only sees it at drag start and end.
- **⤢ expands the drawer into the full playlist page** in four phases (`grow` → `cover` → `dissolve` → `idle`): the panel leaves the flow (`fixed` + `contain: layout paint`, with a placeholder holding its slot), grows to `main + panel` width, the editor UI fades out, and navigation commits *while covered* so the destination renders at its final width — no flash of the old page, no narrow→wide snap.
- The in-list "Add music" row is **hidden while the drawer is editing that same playlist** — both do the same job.
