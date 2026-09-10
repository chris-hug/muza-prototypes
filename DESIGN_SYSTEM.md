---
name: Muza design system kitchen sink
description: Design system overview for Muza music streaming platform — colors, tokens, typography, components
type: project
---

> **Documenting a component?** This file is the *system* — tokens, shared
> recipes, cross-component rules. The procedure for a single component, and
> the wiring that keeps the design-system page in step with it, is
> [`COMPONENT_DOC_PASS.md`](COMPONENT_DOC_PASS.md). Component prose itself
> lives in [`docs/components/`](docs/components/README.md), one file each.

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
| `--primary` | `#1E34D8` | `#1E34D8` | the brand fill (muza-brand-200) — solid **fill**: buttons, shuffle-active, progress |
| `--primary-foreground` | `#FAFCF4` | `#FAFCF4` | ink on a primary **fill** (white-ish text on a brand-coloured button) |
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

### Tailwind screens
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536 — Tailwind's tokens, unchanged. Only **`md` gates a presentation** (it is `useIsMobile()` in CSS); `sm` / `lg` reflow in-page content only. The app's own width system — window, column, box — is in *Responsive & pointer* below and in [`docs/components/responsive.md`](docs/components/responsive.md).

### Layout — page max-width tiers

The app uses **two content-growth tiers** so very wide windows don't leave gaping white margins, while medium widths stay grid-aligned and the artist hero never dominates the page.

| Tier | Trigger | Container `max-w` | Content area (px-10) | Grid cards | Hero `max-h` |
|---|---|---|---|---|---|
| 1 (default) | window < 1920px | `1480px` | 1400px | 6 × 220 | 552px (= 1480 × 400/1072) |
| 2 (wide screen) | window ≥ **1920px** | `1716px` | 1636px | 7 × 220 | 640px (= 1716 × 400/1072) |

**Apply the tier-aware cap on every top-level page wrapper:**
```tsx
<div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-page …">
```

**The column does not follow from the window.** Two things besides
the sidebar take from it, and code that assumes `window − sidebar − gutter`
will be wrong:

- the cap above — from a 1688px window up the column stops growing and the
  extra pixels become margin;
- the **docked playlist editor**, a flex sibling of `<main>` (`hidden md:flex`,
  `w-[30%] min-w-[374px] max-w-[550px]`, draggable to `min(900, 60vw)`). With
  it open a 768px window leaves **294px** of column — less than a 320px
  phone. The expanded sidebar is resizable too (208–291px).

Use `containerAt(viewport, { sidebar, drawer })` from `breakpoints.ts` rather
than re-deriving it; `drawerAt()` and `contentCapAt()` supply the defaults.

**Use the `grid-cards` class** (`app.css`) rather than re-typing the ladder — it is one definition shared by every Library view, the All tab and the DS grids.

**Below the ladder's first step (column < 304px) there is no rule**, so `grid-cards`' base declaration is the entire layout there — and it's also what renders on any engine where `@container` doesn't match. It must therefore be a real layout, not the ladder's bottom step: `repeat(auto-fill, minmax(128px, 1fr))`, which holds **two columns down to a 272px container**. A fixed `repeat(1, …220px)` base shipped one narrow column with an empty band beside it on a 320px phone (iPhone mini in Display Zoom → 296px container).

The **column gap is 16px** (row gap 24px). That is *not* the page gutter — `--page-px` is 12px on phones. Two columns at a 296px column (a 320px phone) = (296 − 16) ÷ 2 = 140px per card.

**Grids step from 6 → 7 cards** at `@container` width ≥ `1500px` (intentionally above tier-1's 1400 cap so the 6-card layout never collapses into 7 smaller cards):
```tsx
<ul className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))]
  @min-[304px]:grid-cols-[repeat(2,minmax(143px,220px))]
  @min-[464px]:grid-cols-[repeat(3,minmax(143px,220px))]
  @min-[692px]:grid-cols-[repeat(4,minmax(143px,220px))]
  @min-[928px]:grid-cols-[repeat(5,minmax(143px,220px))]
  @min-[1164px]:grid-cols-[repeat(6,minmax(143px,220px))]
  @min-[1500px]:grid-cols-[repeat(7,minmax(143px,220px))]
  gap-x-4 gap-y-6">
```

`CardRail` mirrors the same step map, and switches swipe ⇄ grid mode at a **560px column** — see [docs/components/card-rail.md](docs/components/card-rail.md).

**Song rail** stacks Song List Item rows three to a column and borrows the ladder's 692 / 1164 steps for its 2 / 3 columns — see [docs/components/song-rail.md](docs/components/song-rail.md). Rows are passed in pre-rendered; the shell never touches them.

**Artist hero (`ArtistHero`, `artist-hero.tsx`)** locks its height to the same two caps — `552px` (1480 × 400/1072) and `640px` from 1920 — so it stops growing taller exactly where the rails stop growing wider. See [docs/components/artist-header.md](docs/components/artist-header.md).

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
| `primary` | `#1E34D8` (brand-200) | `#1E34D8` (brand-200) | `--primary` |
| `primary-foreground` | `#F9FAF0` | `#F9FAF0` | `--primary-foreground` |
| `primary-text` | `#1E34D8` (brand-200) | `#3F66FF` (brand-100) | `--primary-text` |
| `ring` | `#1D1C18` (neutrals-900) | `#DADDCD` (neutrals-300) | `--ring` |
| `secondary` | `#F1F3E6` (neutrals-100) | `#2E2C24` (neutrals-800) | `--secondary` |
| `secondary-hover` | `#ECEEDF` (neutrals-200) | `#3C3D33` (neutrals-700) | `--secondary-hover` |
| `secondary` 0%/75% | α | α | (alpha) |
| `secondary-foreground` | `#1D1C18` | `#F9FAF0` | `--secondary-foreground` |
| `chart-1..5` | varied | varied | `--chart-1..5` |
| `sidebar-*` | varied | varied | `--sidebar-*` (same shape as above) |

**The palette is two ramps, and both are named for their ROLE.**
`--muza-neutrals-*` carries every surface; `--muza-brand-*` carries the one
accent. `brand`, not `blue`: it is blue today, and a theme is free to make it
anything — every utility, token and doc would otherwise be lying the moment it
changed. The ramps are the only colours in the system that are literal; every
other token is a pointer at one of their steps.

**The prototyper's themer edits those two ramps and nothing else.** Light and
dark are decided by which step a semantic token points at, and those pointers
live in `app.css` — a themer that could re-point them would put that decision
in two places. Change a ramp and both modes follow, because both modes already
point at it. See "Themes" below.

**Rule: never write hex colours in component code. Always use semantic token classes (`bg-primary`, `text-muted-foreground`, `border-border`) or the CSS variable references.**

**Rule: primary *fill* vs primary *ink*.** Use `bg-primary` (+ `text-primary-foreground`) for a solid blue **fill** — buttons, progress, shuffle-active. Use **`text-primary-text`** whenever the blue is **ink on a neutral surface** — links, ghost/`outline-primary` button labels, accent icons (checkmarks), the filled library heart. Never use bare `text-primary` for text: `--primary` (brand-200) is only ~2.2:1 on the dark background, whereas `--primary-text` lifts to blue-100 (`#3F66FF`) in dark mode while staying identical in light. The `link` and `outline-primary` Button variants already bake this in.

**Rule: a press is a COLOUR step. Never geometry.** Each Button variant
darkens one stop past its own hover. 130ms on `cubic-bezier(0.2,0,0,1)`, the
same timing as every other colour change. `Button`, `Toggle`, `Chip`,
`FilterButton`, the footer nav, the mobile header, the card menus and the
status badge all follow it. Every button presses, menu and dialog triggers
included.

**Rule: a selection that has a shape is DRAWN from the pointer, not swapped
on.** `RadioCard`'s ring is a conic gradient that grows out of the point you
pressed, in both directions at once, over 340ms on an ease-**in** curve — it
holds at the press point, races round and snaps shut, because on a ring that
closes the interesting part is the closing. It settles into exactly the border
it replaces: drawn ring and settled border are both `--foreground` at 20%, and
those two alphas can only be changed together. See `radio-card.md` for the
four failure modes the build is shaped around (the seam, the 1px inset, the
curve, the shared alpha).

**Rule: a text link's underline WIPES IN from the left — `link-underline`.**
`text-decoration` cannot be animated: its colour can fade, which reads as the
line materialising everywhere at once, but it cannot be drawn. So the line is
a background gradient whose width runs 0 → 100% over 140ms on the house curve,
growing in the direction the word is read and retracting the same way. One
utility, 321 links on the design-system page alone, including `Button`'s
`link` variant, every title/artist/album in a row, and the cards.

Two things come with it. The utility sets `width: fit-content` (plus
`max-width: 100%`, so `truncate` still works): a background spans the BOX, and
several of these links are stretched flex children whose line would otherwise
run past the last letter — this has no effect on an inline `<a>`, which is
text-sized already. And `text-decoration-skip-ink` is gone, so a descender is
crossed rather than skipped; at 1px under 17px type that is the cheaper half
of the trade.

Where the CONTAINER owns the hover — an artist card underlining its name, a
stepper step its label — the parent takes `link-underline-group` and the text
takes `link-underline`. A Tailwind `group-hover:` variant cannot drive this,
because it compiles into the child's own `:hover`, which is the one thing that
does not happen there.

**Rule: on a Button, the hover colour GROWS FROM THE POINTER.** The same
circle as the press, one step earlier in the gesture: `pointerover` records
where the pointer crossed the edge (`--hover-x` / `--hover-y`, written by the
one document listener in `use-press-ripple.ts`), and `:hover` transitions the
registered `--hover-r` from 0% to 150%, so the fill arrives from the direction
you came from. Its edge is feathered over 30% of the gradient line — a hard
rim reads as a shape crossing the button rather than a colour arriving.

Two consequences worth knowing. The hover colour has to be a **token**
(`--hover-fill`), not a `hover:bg-*` class, or it arrives twice: once flat
underneath, once growing. Button's variants carry the token, and so do
`SongListItem` and `MediaListItem` — down a list the direction reads even
better than on a button, because a row is passed through rather than switched
on. Everything else keeps the plain fade.

The rows run it at a list's pace, through `state-fade-quick`: **260ms in**,
not 440. A button is a destination and the colour is what you came for; a row
is a corridor, and at 440ms the fill is still climbing two rows after the
pointer has left, so the list smears. Out is 100ms everywhere. And the circle is painted as the host's own
`background-image` — `::before` is the press and `::after` is `icon-sm`'s hit
area, so there was no third pseudo-element to spend. Mouse only: on touch
`:hover` sticks after the finger lifts, and the press already answers the tap.

**Rule: every colour state change fades, and through one utility —
`state-fade`.** It emits `color, background-color, border-color,
outline-color, opacity` on `cubic-bezier(0.2,0,0,1)`, **440ms in and 100ms
out**. The split needs no second mechanism: the transition that runs on the
way in is the one declared on `:hover`, the one that runs on the way out is
the one declared on the element, so the base carries the fast number. Arriving
is what you are meant to watch; leaving is the pointer already somewhere else,
and a slow exit leaves the row you left glowing two rows later. A press is an answer and lands at 130ms; a hover is
the pointer passing through and reads as flicker at that speed. The press is
keyframe-driven, so it does not ride on this number. `Button` uses it,
and so does everything bespoke that lights up on hover — dropdown and command
items, select and combobox options, the detail-menu rows, the small icon
buttons in dialogs and headers, prose links inside `Alert` and `Dialog`. Those
carried nothing before and snapped while the Button beside them eased; the
snap is only visible when both are on screen, which is most of the time.
`box-shadow` stays out of the list — the focus ring is one, and animating it
repaints the ring region every frame, which makes the icon inside judder.

| Fill | rest → hover → press | hover step | press step |
|---|---|---|---|
| `primary` | `#1E34D8` → `#182AAD` → `#121F82` | 20 | 20 |
| `secondary` (light) | `#ECEEDF` → `#DADDCD` → `#CDD0C1` | 18 | 13 |
| `secondary` (dark) | `#2E2C24` → `#3C3D33` → `#48493F` | 15 | 12 |
| `destructive` (light) | `#DC2626` → `#C22122` → `#A71D1D` | 12 | 12 |
| `destructive` (dark) | `#7F1D1D` → `#8E3838` → `#9E5353` | 23 | 23 |

The `-active` tokens are computed mixes, like the `-hover` ones — never the
next step on the palette. The neutral ramp is not linear: `neutrals-200 → 300`
drops 5.3 points of lightness and `300 → 400` drops 11.8, so "the next step"
hit more than twice as hard on the press as on the hover. Each theme mixes in
its own direction (black in light, white in dark, since dark's `secondary` and
`destructive` start near the floor).

The ratios differ between fills on purpose: primary's press moves as far as
its hover, secondary's a little less. An equal delta reads weaker on a
saturated fill than on a near-neutral one, so matching the ratios leaves one
of them dead and the other shouting.

Alpha is not a press. `destructive` used `/85` and `/70`, which mix with
whatever is *behind* the button, so the same press read differently on a card,
a dialog and a photo. The exception is `OrderStatusBadge`, whose colour comes
from its status config — there is no single token to darken across seven
statuses, so it steps opacity.

Verified across the design-system page: **685** pressable surfaces, **0**
without a press, **0** using geometry; **2107** elements with a hover colour
utility, **0** missing a colour transition.

**Why not geometry.** Two variants were built and measured out.

- **Scale.** A factor is a ratio, and this ladder runs 24px to 398px wide: at
  a flat `0.97` the narrowest button's edge travelled 0.36px and the widest
  5.97px. Staggering the factor per size equalised the height and left the
  real fault untouched — inside ONE button the contents spread, because every
  point moves in proportion to its distance from the centre. Measured on
  Pagination's "Previous" (118 × 40): the chevron at the left edge travelled
  2.01px while the label beside it travelled 0.30px, so it read as the icon
  sliding out, not the button shrinking.
- **A 1px nudge.** Size-independent, and that is all it has going for it.

Colour has no size: a 24px icon button and a 398px call to action answer with
exactly the same step. Both references measured agree — TIDAL transitions
`color, background-color` with no geometric press anywhere; Apple Music has 30
`:active` rules of which 19 are background and exactly one is a transform,
`scale(0.9)` on a 24px square transport button, the one shape where a scale
cannot spread.

**Every hover colour change eases.** Verified across the design-system page:
2107 elements carry a hover colour utility and **0** of them lack a colour
transition. Two traps to keep it that way — `transition-[colors,…]` inside
brackets emits the invalid ident `colors` and matches nothing (write the
properties out), and a bare `duration-*` with no `transition-*` beside it arms
the initial value `all`.

**Do not write class names in comments.** Tailwind scans source files as text,
so a class quoted in prose is a class it generates. A rewritten comment in
`order-detail-view` kept a dead press rule alive in the stylesheet.

**Do not promote a layer for the press.** It was tried
(`active:will-change-transform`) to stop the button's contents being
re-rastered at each fractional step, and it cost more than it bought:
creating and tearing down a layer shifts content by a fraction of a pixel at
both ends. On a 32px icon button that reads as the glyph dropping and coming
back — and 3% of 32px is only 0.96px, so the artefact was larger than the
effect it was smoothing. Scoped to `:active` it also fired on menu triggers,
which do not press at all, so the only thing a `Delete track` button did on
click was twitch its icon.

`transform-gpu` is not a way back in: it does not apply in Tailwind v4 without
a sibling transform utility, because its value references undefined
`--tw-rotate-*` custom properties and the whole declaration falls back to
`none`. A literal `translateZ(0)` did not land either. If icon-plus-label
buttons still read as crooked under the press, the fix is the scale value or
the geometry — not a layer.

**Rule: a page arrives in sections, not as one block.** The view wrapper wears
`page-enter` (`app.css`), which staggers the view's own sections — 200ms each,
45ms apart, capped at the sixth so a twenty-section library page is not still
arriving after a second. It replaced a single 250ms fade over the whole screen,
which read as a screen being swapped rather than a page arriving; the first
chunk now lands sooner than that fade used to finish. Honours
`prefers-reduced-motion`.

**Rule: name real CSS properties in a transition, and never `all`.** Two ways
this went wrong, both silent:

- `transition-[colors,…]` reads like Tailwind's `transition-colors`, but inside
  `[]` Tailwind emits the list verbatim — and `colors` is not a CSS property,
  so that entry never matches. Thirteen components carried it and their colour
  changes were snapping while `box-shadow` and `transform` eased. Write the
  properties out: `transition-[color,background-color,border-color,outline-color,…]`.
- A bare `duration-*` with no `transition-*` beside it arms a transition on
  *everything*: `transition-property` keeps its initial value `all` and the
  duration switches it on. The popups (dropdown, select, dialog) hit this —
  their `duration-100` is meant for the `animate-in` keyframe. They now carry
  `transition-none` alongside, which disarms the transition and leaves the
  animation alone.

`will-change` follows the same discipline: only `transform`, `opacity` and
`filter` are compositable, so promising `width` or `top` buys no layer and only
widens the hint.

**Rule: artwork carries a hairline.** Every piece of cover art — album sleeves,
playlist collages, artist and owner avatars, product shots — wears the
`art-edge` utility: a 1px `outline` at `rgba(0,0,0,.1)` in light and
`rgba(255,255,255,.1)` in dark, drawn *inside* the box (`outline-offset: -1px`).
Album art is user content, so a white sleeve on the light background and a black
one on the dark background both dissolve into the page and lose their shape; the
hairline gives every cover the same edge regardless of what is printed on it.
`outline` rather than `border` or `ring` because it takes no layout space (a
48px thumb stays 48px), and the inward offset keeps it from being clipped away
inside an `overflow-hidden` collage tile. Never a tinted neutral — a tinted
hairline picks up the surface colour behind it and reads as dirt on the sleeve
edge. Put it on a COLLAGE container, not on its four tiles, and leave it off
full-bleed backdrops (the artist hero image, the blurred credits backdrop),
which have no edge to describe.

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
| `--text-3xsmall` | semantic alias  | `var(--text-3xs)`  → 13 | ✅ **mono data only** — see below |
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
| Color | `primary` (light + dark) | `muza-brand/200` | `#1E34D8` |
| Color | `destructive` (light) | `tailwind-red/600` | `#DC2626` |
| Color | `muted-foreground` (light) | `muza-neutrals/a75/700` | `#545445 @75%` |
| Radius | `md` | `radius/rounded-md` | `6px` |
| Radius | `2xl` | `radius/rounded-2xl` | `16px` |

The rule is identical: **an alias never holds a raw value; it references the primitive that does.**
| `large` | sans | 20 | 28 | 400 regular | 0 | — |
| `small` | sans | 14 | 14 | 400 regular | 16 (wide) | — |
| `table` | sans | 18 | — | 400 regular (bold 700) | 0 | — |

**Font families**
- `font-sans` → Founders Grotesk (`app.css:172`) — everything the product renders
- `font-mono` → **Founders Grotesk Mono** (`app.css:163`) — the mono cut of the
  same family, one weight (400), loaded from
  `public/fonts/FoundersGrotesk-Mono-Regular.woff2`
- There is no `--font-serif`; `font-serif` falls through to Tailwind's default
  stack and is not used anywhere.

### Code is always mono

Anything printed **as code** — an inline `<code>` token in prose, a fenced
block, a class string in a table — is `font-mono`. Nothing else is: mono is the
one signal that a string is meant to be read literally and typed back exactly.

```tsx
// inline, in prose
<code className="font-mono text-2xsmall font-normal px-1 rounded-sm bg-muted">useIsMobile</code>

// a block — `<pre>` inherits `font-mono` from Tailwind preflight
<pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-2xsmall leading-5">
  <code>{source}</code>
</pre>
```

This used to be three treatments at once: most `<code>` in the design-system
page carried `font-sans` (so a class name was set in the same face as the
sentence around it), two spans carried no family at all and picked up the old
`ui-monospace, "SF Mono"` stack from preflight, and only fenced blocks were
reliably mono. Same page, same kind of token, three fonts. All of it is the
Mono cut now, and the `font-mono` on an inline `<code>` is written out rather
than inherited so the intent survives a copied-and-pasted class string.

The Mono face is **regular only**. Never `font-medium` or heavier on code — a
synthesised bold breaks the fixed advance width that is the point of the face.

---

## Typography — Founders Grotesk

### Type scale (explicit px in globals.css to avoid rem ambiguity)

| Class | Size | Usage |
|---|---|---|
| `text-3xsmall` | 13px | **monospace data only** — see the rule below. Never prose |
| `text-xxs` | 15px | **the floor for anything read as language** — chips, badges, button-sm |
| `text-xs` | 17px | media-card title + meta, table rows, captions, metadata, helper text |

### 13px exists, and it is not part of the UI scale

`text-3xsmall` (13px) sits **below** the 15px floor and is allowed in exactly
one situation: **monospace data** — a token name, an `oklch()` triple, a class
string — in a reference table, where the row is a value to *read off* rather
than language to read.

It exists because 15px mono could not hold a 26-character
`oklch(99.81% 0.0053 118.5)` on one line in the Colors table, and a value that
wraps or clips is worse than a value that is small: a clipped one looks like
information and is not.

Never use it for prose, a label, a caption, a hint or anything inside a
control. **15px remains the floor for anything a person reads as language**,
and that rule did not move — a second size was added under it for a different
kind of content, which is not the same thing as lowering the floor. If you
reach for 13px and the text is a sentence, the answer is a wider column.

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

## Icons — the ones that are fixed

Most icons are Lucide, picked per context. Two are **not** free choices:

- **"Add to playlist" / "Add to a playlist" / "Add music"** is always
  `AddMusicIcon` from [`media-icons.tsx`](src/components/ui/media-icons.tsx) —
  the note-with-plus. It appears on the playlist page, in the create flow, in
  the song row's menu and sheet, and in the detail menu. It was `ListPlus` in
  the menus for a while, which read as "add a list item" and matched nothing
  else in the flow.
- **`AddMusicIcon` also labels the Selection tab** in the Add-music sheet, so
  the same mark means "music going into a playlist" everywhere it appears.

## Form controls — the shared recipe

`Input`, `Select`, `Combobox`, `DatePicker`, `FileField` and the filter
trigger are **one control in six costumes**. The recipe lived only in the five source files
until it was written down here, which is how `Input`'s own header comment came
to claim `rounded-xl` for a pill.

| Token | Value |
|---|---|
| Height | 40px `h-10` at `default` — see the size ladder below |
| Shape | `rounded-full` |
| Border | `border border-border`, `hover:border-foreground/30` |
| Surface | `bg-background` |
| Focus | `focus-visible:border-ring focus-ring` — the utility draws a 2px `outline` at 20% of `--ring`, no offset |
| Invalid | `aria-invalid:border-destructive invalid-ring` — the same 2px outline in `--destructive` (40% in dark) |
| Text | `text-small font-normal` (19px) |
| Vertical padding | `pt-[6px] pb-[10px]` — **asymmetric, on purpose** |

**A file picker is one of them.** `FileField` wears the same shell — height,
radius, border, hover, `focus-ring-within` — around a `<label>` that wraps an
`sr-only` `<input type="file">`. That arrangement is the component: a label
wrapping an input forwards a click from ANY part of the row, so the filename
and the empty space open the dialog too, which a `Button` beside an `Input`
could never do. Its trigger pill takes `--secondary`, the quiet fill on a
control, and sits 3px inside the shell on every step — 4px from the outer edge
once the border is counted, which is what makes the shoulder even.

### One size ladder, shared with Button

A field and the button next to it are the same height and the same type size,
because they use the same steps:

| `size` | Height | Type | Field padding |
|---|---|---|---|
| `sm` | `h-8` 32px | `text-2xsmall` 16px | `px-3` |
| `default` | `h-10` 40px | `text-small` 19px | `px-4` |
| `lg` | `h-12` 48px | `text-small` 19px | `px-5` | ← **the form default**

**`lg` is what a field renders at unless it is told otherwise.** `Input`,
`SelectTrigger`, `Combobox`, `ChipInput` and `DatePicker` all default to it,
and so does `InputSelect` (which declared a `size` prop and never forwarded it
— the fused control ignored the ladder entirely until this pass). `default`
still exists and a call site can still ask for it; what changed is which step
you get by not choosing. 40px was a desktop-first number for something you
type into on a phone.

**A drag is never a tap.** `useLongPress` swallows the click if the pointer
moved more than 8px between down and up — the same threshold that cancels the
hold, so one gesture cannot be both. The browser's own rule (no click after a
scroll) is not enough: a SHORT drag, the beginning of a rail swipe or a flick
the scroller declines to follow, is not a scroll as far as the browser is
concerned, so the click landed and the card opened the album the finger was
trying to swipe past.

**Hold a card, get its menu.** (And `img { -webkit-touch-callout: none }`, or
iOS answers the same gesture with its own menu — Share / Save to Photos / Copy
Subject — on top of ours. It has to be in force before the finger lands, so it
cannot come from the press handler; the handler declines the desktop
`contextmenu` for the same reason.) Every card answers a long press (450–500ms)
with the **`DetailMenuSheetBody` sheet** — quick actions as tiles across the
top, then the rows — which is the sheet the detail pages and the list rows
already raise. Not the card's own ⋯ dropdown rendered as a sheet: a phone
should get one menu shape per entity, wherever it was reached from, and the
kebab keeps the anchored dropdown, which is the right shape for a mouse.
Wired through `useLongPress` on `AlbumCard`, `PlaylistCard` and `ArtistCard`
(which has no ⋯ at all, on hover or otherwise; the playlist card's press used
to call an `onMore` prop that has no call site, so holding one did nothing).
The hold is visible from the first frame — the returned props carry
`data-pressing`, which `app.css` turns into `scale: 0.98` and a slight
darkening, so the wait reads as the card being TAKEN rather than as a tap that
did not register. A drag past 8px cancels it and hands the gesture back to the
rail; the click that follows a completed press is swallowed, or the card would
open underneath its own menu.

**Touch targets: 32px of paint may carry 44px of target — `touch-target`.**
WCAG 2.2 AA (2.5.8) asks for 24×24 and every control here clears that; 44×44 is
the AAA figure (2.5.5) and Apple's HIG number, and it is the one a fingertip
actually wants. Where the design needs a small glyph — a sheet's back chevron,
a ✕, a filter pill — the utility grows an inert pseudo-element around it to 44
without moving a pixel of the paint. Coarse pointers only: on a mouse the extra
area is invisible slop that steals clicks from the neighbour. Never put it on
two controls closer than 12px apart; overlapping hit areas are worse than small
ones. Measured, at 375px: row select buttons 48, bar controls 32 painted / 44
targeted, filter pills 32 painted / 44 targeted.

**A control sharing a row with a field follows it.** Every button in a form
block moved with the fields — the actions under a dialog's form, the "Sort"
beside a filter input, the ✕ beside an additional-link row (`icon` → `icon-lg`)
— because a 40px button against a 48px field is exactly the mismatch this
ladder exists to remove. Buttons outside form context (chrome, cards, rails)
keep their own size.

**Button at `default` (40px) centres OPTICALLY, not geometrically.** Founders
Grotesk at 19/28.5 lands the cap block 17.5px from the top of the pill and the
baseline 10.5px from the bottom: correctly centred by the line box, and it
still reads low, because the eye centres on the caps rather than on the
ascender and descender space around them. `pb-[3px]` lifts the label 1px
(bottom padding shifts a centred flex child by half its value, and the base
already spends 1px of it). 2px was tried and read too high. The `link`
variant, which sheds its height, spells the same 3px out as four sides so it
lands on that baseline too — measured spread across all seven variants: 0px.
Only this size: `sm`/`lg` are a different metric and the icon sizes have no
baseline to answer to.

The ladder lives in **`src/lib/control-size.ts`**, not in six copies. Six
components take a `size` prop and write it back as `data-size`:

| | `sm` | `default` | `lg` |
|---|---|---|---|
| `Button` | ✓ | ✓ | ✓ |
| `Input` | ✓ | ✓ | ✓ |
| `SelectTrigger` | ✓ | ✓ | ✓ |
| `ComboboxTrigger` | ✓ | ✓ | ✓ |
| `DatePicker` | ✓ | ✓ | ✓ |
| `ChipInput` | ✓ | ✓ (starting height) | ✓ |

So a large button gets a large field beside it, and the pairing holds for
whichever control the form actually needs — the reason to have the ladder at
all is that you should never have to check.

`Textarea` is the one that stays out of the *ladder*: it is a multi-line box,
not a pill, so it has no peer height to match and takes no `size`. It takes
everything else in the recipe — border token, surface, `px-4`, hover border,
focus ring, type size. It quietly did not, on four of those, for as long as
nobody put it next to an Input and looked.

**Type stops climbing at `default`.** 19px is the body size of the whole form
family, and `lg` is a bigger *target*, not bigger text — a 21px control label
beside a 19px one would put back exactly the mismatch this ladder was built to
remove. `sm` drops one step to 16px because 19px in a 32px box leaves no
optical room.

**A control that grows still has to *start* on the ladder.** `ChipInput` did
not: it measured 46.5px because its inner field was padded on top of its own
line box, and `min-h-10` is a floor, so nothing caught it. Where a height is
built up from children rather than declared, size the children
(`CONTROL_STACK[size].child`) and let `min-h` be the floor it claims to be.

**Verify it on the page, not in the file.** The design-system page's *"One size
ladder — every control, every step"* example passes one `size` to a row of
every control and sets no heights. A ragged row is a component that has
drifted. It is deliberately `items-end`: centring a row hides a mismatch by
splitting it in two.

**This was not true until recently, and the mismatch was invisible.** `Input`
sat at `text-base` (21px) while `Button`, `SelectTrigger` and `DatePicker` sat
at `text-small` — and `button.tsx` carried a comment claiming the alignment
held. Call sites had already voted the other way: fourteen `Input`s across the
product passed `className="text-small font-normal"` for no reason other than
undoing the default. `SelectItem` was a second case of the same thing — 21px in
the list, 19px once the value landed in the trigger, so an option changed size
as it was chosen. Both are fixed; the overrides are gone. If a control needs a
different size, reach for the `size` prop, never a type class.

**The 2px lift.** Founders Grotesk sits low in its em box, so symmetric padding
leaves the text visually below centre in a 40px pill. 6/10 raises it by 2px to
the optical centre. The same nudge appears as `pb-px` on `Button`, `Tabs`,
`Chip` and `Badge` — and `FilterButton` documents why a chip does *not* take it.

Right padding varies with what sits on the edge: `pr-4` plain · `pr-2` where a
chevron is flush · `pr-3` with chevron plus count · `pr-10` when `onClear`
reserves room for the ✕. `startIcon` reserves `pl-10`.

**`className` on `Input` lands on the `<input>`, not on the affordance
wrapper.** Positioning classes therefore have to go on a wrapper you supply —
an `absolute` meant for the field's box will move the field inside its wrapper
instead. See [`input.md`](docs/components/input.md).

## Buttons

See [docs/components/button.md](docs/components/button.md). One rule: `default` is 40px (`h-10`) to sit level with Input / Select / DatePicker, and `sm` is the only size that is `font-normal`.

---

## Chips

See [docs/components/chips.md](docs/components/chips.md). One rule: a `Chip`'s selection is the caller's state (`selected` + `onClick`), and the count badge's colours are never patched at the call site — the `count` variant owns both of its states.

---

## Badges

See [docs/components/badge.md](docs/components/badge.md) (`Badge`, `ContentTypeBadge`, and where a content-type badge belongs), [docs/components/status-badge.md](docs/components/status-badge.md), [docs/components/order-status-badge.md](docs/components/order-status-badge.md) and [docs/components/purchased-badge.md](docs/components/purchased-badge.md). One rule: a badge that repeats what the surrounding UI already states is noise — `ContentTypeBadge` only where the type is not otherwise obvious, never beside a subtitle that says the same word.

---

## Context Menu

Title: `text-xs font-normal text-muted-foreground`
Item: `text-base font-normal text-popover-foreground leading-normal`
Container: `w-64 bg-popover border border-border rounded-xl py-1 shadow-lg`

---

## Player components

### PlayerOverlay
The full-screen "Now listening" sheet on phones. See [docs/components/player-overlay.md](docs/components/player-overlay.md). The one rule: when closed it must be `invisible`, not merely translated off-screen — its `.frosted-glass` backdrop-filter ignores the wrapper's `translate` and would keep painting over the tab bar and the mini bar.

### ShuffleToggle (`src/components/ui/shuffle-toggle.tsx`)
Shared shuffle button used by PlayerBar, PlayerBar-B, and PlayerOverlay. Emphasises the control:
- Active state: `bg-primary` + halo ring animating outward (`animate-shuffle-halo`)
- Icon pops on activation: `animate-shuffle-pop` (scale 1→1.35→0.92→1 with slight wobble)
- `key={pulseCount.current}` on the halo + icon re-triggers the animation on every toggle-on
- Repeat keeps a plain low-key secondary toggle — asymmetry is intentional

### PlayerBar (`src/components/ui/player-bar-b.tsx`)
The persistent transport — the 80px glass bar from 640px of its own width, the 56px mini pill below it. See [docs/components/player-bar.md](docs/components/player-bar.md). The one rule: the compact ⇄ desktop switch is a **box** step (`@container` on the bar), never a window gate — the docked editor can leave the bar 294px wide at a 768px window.

### Shared utilities
- **Transport icons** (`src/components/ui/transport-icons.tsx`): `SkipBackFilled`, `PlayFilledAlt`, `SkipForwardFilled` — Carbon-style filled SVGs, accept `className` + `style`
- **Waveform** (`src/components/ui/waveform.tsx`): `@wavesurfer/react` wrapper. Resolves `var(--…)` to rgb for canvas, strips alpha (restored via shadow-DOM `opacity: 0.5` on unplayed canvas). Height responsive via `setOptions({ height })` + patched shadow-DOM `[part="canvases"].minHeight`.
- **Keyframes in `app.css`**: `player-overlay-marquee`, `shuffle-pop`, `shuffle-halo`, plus `.animate-shuffle-pop` / `.animate-shuffle-halo` utility classes

---

## Themes — the prototyper, and what a saved theme is

The design system is its own application now: `?page=DesignSystem` opens **the
muza prototyper** — a narrow header (back · name · tabs · light switch), a
**themer** docked left, and five tabs: Typography · Layout and Spacings ·
Tokens · Components · Product.

The themer is a sidebar rather than a section for one reason: colour is not a
topic you visit, it is a setting you hold while looking at something else. Sat
on the left it stays put across all five tabs, so a hue can be dragged while
the components — or the product — are on screen. Its width is draggable and
remembered.

**Product is the real app in an iframe.** The product has its own shell and
nesting it would put two shells on the same edges; a frame gives it its own
window. Same-origin, so the themer copies its custom properties into that
document — the theme is live in the app, not in a picture of it. The frame is
loaded with `?embed=1`, which hides the product's own "Design system" entry:
without it, the Product tab offers a prototyper inside the prototyper.

### What a theme holds

Two ramps of primitives, and nothing else:

| File | What it is |
|---|---|
| `app/themes/muza-default.json` | the palette exactly as `app.css` declares it, generated from the stylesheet. The way back from any experiment. Do not hand-edit — edit `app.css` and regenerate |
| `app/themes/<name>.json` | a saved theme: per ramp the five curve numbers, the steps pinned to exact values, and every resulting step |
| `app/themes/<name>.css` | the same values as plain declarations, for pasting into `app.css` when a theme wins |

Saving writes real files through a dev-only Vite route (`/__theme`,
`vite-theme-plugin.ts`). The browser cannot write into the repo; the dev server
can. The name is sanitised and the path is pinned to `app/themes/` — a name is
user input, and user input that becomes a path is how a save button turns into
an arbitrary file write.

### Curve, and the steps that refuse it

A ramp can be described by five numbers — hue · chroma · top · bottom ·
contrast (`src/lib/ramp.ts`). **muza's ramps are not**: fitting a curve to the
neutrals misses by 17 L, because the ladder was picked by hand and skips 500
and 600 entirely. So both models run at once. Every step either FOLLOWS the
curve or is PINNED to an exact value, and the row says which. On load every
step is pinned to what `app.css` declares, so the page starts as itself;
unpinning a step is what asks "what would the curve have done".

Nothing is lost on the way: every change lands on an undo stack (⌘Z / ⇧⌘Z),
and `muza-default` is always one click away.

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
- Dark mode managed via `.dark` class on `<html>`, ThemeProvider in `app/root.tsx`
- Toast: `ToastProvider` wraps layout, `useToast()` works anywhere inside

---

## Responsive & pointer — gating rules

**Three measures, and only three.** *Window* (the browser viewport — `useFooterNav()`, `useIsMobile()`, `@media`, Tailwind `md:`) decides the **chrome** and how a thing is **presented**. *Column* (the page content area, what the window leaves after chrome, cap and editor — `@container` on the page shell) decides **how many fit**. *Box* (a component's own width, a **named** `@container/<name>`) is allowed only where the same window can hand a component two different widths, and decides internal reflow only. The words "breakpoint" and "viewport" are reserved for Tailwind's tokens and the browser's own terms. Full write-up, arithmetic and duplication map: [`docs/components/responsive.md`](docs/components/responsive.md).

**Window — two gates, each with a job:**
- **608 = chrome** (`useFooterNav()`, `FOOTER_NAV_BELOW` = 560 + 2×24): tab bar ⇄ icon rail, `MobileAppHeader` ⇄ `Topbar`, mini player ⇄ desktop bar. Anything lifted over the tab bar (`BulkActionBar`) gates here, never on `md`.
- **768 = presentation** (`useIsMobile()` and Tailwind `md:` — the same gate in TS and CSS): dialogs, alert dialogs and toasts leave their sheet / bottom-bar form, dropdowns stop presenting as sheets, the docked playlist editor starts to exist. `sm:` (640) and `lg:` (1024) may reflow **in-page content** (a form going two-column, a table hiding a column) and nothing else — never a chrome or presentation switch. (Before this rule dialogs recentred at `sm` while the hook still said phone: at 640–767 the create-playlist form rendered its phone branch with every action hidden by `sm:hidden`.)
- They are **not folded into one** on purpose: with the tab bar up to 767 the MediaHeader would go horizontal under the mobile detail bar (built for the centred cover), and the mini player slot would receive the 80px desktop bar from a 664px window.
- **1069 = sidebar expands** (`SIDEBAR_COLLAPSE_BELOW` = 780 + 208 + 80 + 1); gutter 24 → 40px. **584** is a gutter-only step (12 → 24px), not a mode. `--page-px` tiers: ≥1069 → 40px, 584–1068 → 24px, < 584 → 12px.

**Column — the ladder:** `304→2 · 464→3 · 692→4 · 928→5 · 1164→6 · 1500→7` card columns (`.grid-cards`, Card Rail; Song Rail borrows 692 / 1164 for its own 2 / 3 song columns). Derived from the cover (143–220px, 16px gap): `N×220 + (N−1)×16` for 464 … 1164; 304 and 1500 are declared exceptions (see responsive.md). The mobile ⇄ desktop **behaviour** boundary (rail swipe mode, MediaHeader stacking) is **560px column** — reached at a **660px window**, not 608: the icon rail arrives at 608 and takes the column back to 508. MediaHeader's full action cluster: 780.

**Box — the four that measure themselves:** `SongListItem` (`@container/row`, 260 / 300 / 380), `PlayerBar` (640 / 688 / 800 — the 640 compact ⇄ desktop switch stays a box step because the docked editor can leave the bar 294px at a 768px window), `PlayerOverlay` (`@container/overlay`, 380), the paywall's two-column split (760). Name the container; an unnamed one binds to whatever ancestor is nearest.

**`@max-[N]` means below N.** Tailwind v4 compiles `@max-[560px]` to `width < 560px` and `max-md:` to `width < 768px` — exclusive — so a step at 560 is `@min-[560px]` / `@max-[560px]`, never `@max-[559px]` (that left the 559px column, a 607px window, matching neither side).

**Gate on the window, NOT `hover:` media queries, when choosing between two component renders.** `[@media(hover:none/hover)]:!hidden` is fine for *cosmetic* show/hide of a control, but to render a *different component* (dropdown vs sheet) use `useIsMobile()`. Reasons: the headless preview reports `hover: hover` even at phone width (so a hover-gated sheet never appears there), and hybrid touch-laptops report `hover: hover` too. Example: `DetailMoreButton` does `if (isMobile) return <Sheet>…; return <DropdownMenu>…`.

---

## Mobile surfaces — sheets

> Component-specific detail lives in [`docs/components/<id>.md`](docs/components/README.md) — one Markdown file per component, rendered behind the ⓘ on its design-system section and read directly by agents. This file keeps the rules that span components. See [`dialog.md`](docs/components/dialog.md), [`alertdialog.md`](docs/components/alertdialog.md), [`responsive.md`](docs/components/responsive.md).

Three escalating surfaces, all bottom-anchored on phones:

**1. Responsive dialog → bottom sheet — the BASE DEFAULT.** **Every** `Dialog` and `AlertDialog` is a **bottom sheet on mobile** and a **centered modal on desktop (md+, 768)** — no per-dialog opt-in; it is baked into the base `DialogContent` / `AlertDialogContent`. Individual dialogs set their **desktop width** (`md:max-w-*`) and height only, and must **not** re-declare the positioning. Everything else about the dialog family — the 12px sheet gutter, the header column, the `text-small` title, `dialogListClass`, the flex scroll body, the footer's edge, the form sheet and the find screen — lives in [docs/components/dialog.md](docs/components/dialog.md); the alert's differences in [docs/components/alertdialog.md](docs/components/alertdialog.md).

**The keyboard is part of the layout.** iOS does NOT shrink the layout viewport when the on-screen keyboard opens — it shrinks the *visual* viewport — so a `fixed; bottom: 0` sheet sits **behind** the keyboard. Every sheet therefore:
- sits at `bottom: var(--kb, 0px)` and is capped to `max-h-[calc(100svh-var(--kb,0px)-8px)]`, scrolling internally, with `scroll-padding-bottom: 8rem` so a field the browser scrolls into view lands clear of the sticky footer;
- keeps its footer **`sticky bottom-[-0.75rem]` on mobile** so the actions can't scroll out of reach (`md:static` — desktop doesn't scroll).

**`svh`, never `dvh`, for a sheet's height.** On iOS the *dynamic* viewport unit reports the height with the browser chrome **collapsed**, so while the URL bar is expanded a sheet sized to `100dvh` is taller than the screen: its top — title, tabs, the ✕ — sits above the visible area. `100svh` is the small (chrome-visible) viewport and always fits. Subtract `env(safe-area-inset-top)` as well on a sheet that fills the height.

`--kb` is published by [`useKeyboardInset`](src/lib/use-keyboard-inset.ts), mounted once in the app shell. It is measured as `window.innerHeight − visualViewport.height` — no `offsetTop` term (that offset moves what you SEE; it does not change how tall the keyboard is, and including it left a REOPENED keyboard reading 0). Opening needs 80px, staying open only 40: iOS animates the keyboard in and the accessory bar lands on its own beat, so a single threshold can be crossed back mid-animation and drop the sheet to full height and back. Open any page with `?kbdebug` to see all of those live on the device (`KeyboardProbe`) — including what `documentElement.clientHeight` would give, which was tried and is wrong here.

The hook also sets **`data-kb="open"`** on the root while the keyboard is up. A `max-height` media query cannot stand in for it: the layout viewport does not shrink, which is the whole reason `--kb` exists. Use it for what a length can't express — below 768 the form sheet's three bands give up their padding through it, because the squeeze is bigger than it sounds: an iPhone in Brave reports 495px of layout with **169px** still visible, and a 48px bar plus a 72px action band would leave the 48px name field 49px to live in. Chrome/Android is handled declaratively by `interactive-widget=resizes-content` in the viewport meta, so `--kb` stays 0 there.

**Opening the keyboard has to happen inside the tap.** iOS raises the virtual keyboard only for a focus that happens during a user gesture, and a dialog focuses its field a frame or two after the tap that opened it. A flow that should start typing therefore focuses a zero-sized stand-in input already in the document from the trigger's own handler (`CreatePlaylistProvider`), and the keyboard follows focus into the real field when the sheet mounts. The same reason a popup's `initialFocus` is given as a FUNCTION there: opened by touch the default is to focus the popup itself and keep the keyboard down.

**Forms go full-screen on phones — `<DialogContent mobile="form">`.** A bottom sheet cannot hold a form once the keyboard is up (~200px left on a 12 mini in Brave; a title + field + toggle + footer need ~240), so any dialog whose **primary action must survive typing** uses the form presentation: anchored top, three bands, only the body scrolls, the confirming action in `DialogFormActions` on the keyboard. The bands, the header rules and the find-screen pattern are in [docs/components/dialog.md](docs/components/dialog.md).

**`viewport-fit=cover` is mandatory** in the viewport meta. Without it `env(safe-area-inset-*)` resolves to **0** and every safe-area pad in the app — mobile header, footer nav, player shell, dropdown sheets, dialog footers, toasts — is silently a no-op.

**2. DropdownMenu auto-sheet.** The app `DropdownMenu` already presents as a bottom sheet below 768 — use it for simple "…" lists. See [docs/components/menu.md](docs/components/menu.md); the one rule: put the trigger on a real `Button` via `render`, and never use `…CheckboxItem` / `…RadioItem` / `…Sub*` in a menu that can render below 768 — they have no sheet counterpart.

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

The Explore page **is** the search surface; results are URL-backed (`?page=Explore&q=…&scope=…`) and identical on desktop and phone. The panel, the results view, the All-tab shelf composition (Top result · one shelf per type · overflow-gated "Show all") and its thresholds live in [docs/components/search.md](docs/components/search.md). The one rule not to miss: a search row or card carries **no** content-type badge — the tabs already name the type.

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
- **Playlist cards carry a byline** — "By you" for your own, "By {name}" for saved ones; see [docs/components/playlist-card.md](docs/components/playlist-card.md).
- **List tables** get an **Added** column + sort, and a **create row** leading the list (the same pattern as Studio's upload row).

---

## Wizard — header · steps · body · footer

A multi-step flow has **four zones, and progress never shares a row with the actions.**

```text
┌──────────────────────────────────────────────┐
│ Upload music                          ⤡   ✕  │  identity + window controls
├──────────────────────────────────────────────┤
│      ①─Release Info ─ ②─Monetisation ─ ③ ─ ④ │  Stepper, alone in its row
├──────────────────────────────────────────────┤
│  body — the only part that scrolls           │
├──────────────────────────────────────────────┤
│  Cancel                       Back      Next │  actions, primary bottom-right
└──────────────────────────────────────────────┘
```

The rule is not tidiness. Progress wants the centre and actions want the right edge, so a shared row makes them fight over the same middle — and the loser is whichever one is positioned absolutely. Upload music centred a 600px stepper across the **whole header** while Cancel / Next sat on it at `ml-auto`, which collided below a 1088px header: a 1296px window with the sidebar, an ordinary laptop. It did not truncate or reflow; the labels went under the buttons and stayed there. The arithmetic is in [`stepper.tsx`](src/components/ui/stepper.tsx) and [the Stepper doc](docs/components/stepper.md).

- **Cancel stays for the whole flow.** It used to be swapped for Back at step 2, so from there the only way out was to minimise.
- **Back is never restricted**, and visited steps are clickable — `onStepSelect` on `Stepper`. Going back used to cost one Back press per step.
- **Forward jumps are not offered.** The flow validates as it goes, so a jump ahead would skip the check that gates the step.
- **The primary action is bottom-right**, where it is read after the form rather than before it.
- **The footer is the ONLY way forward.** Every step in Upload music also drew its own Next (and the last one its own Publish) at the end of its content — five buttons doing what the footer now does, in five places, each with its own size and alignment. A step renders content, not navigation.

Carbon, Atlassian and PatternFly all land on this split; PatternFly is the closest reference since it ships an actual wizard component.

---

## Create playlist / Add music

One flow, started from every entry point via [`create-playlist-context.ts`](src/lib/create-playlist-context.ts) — `useCreatePlaylist().open()`. Entry points: sidebar "+" (expanded header row and collapsed rail), mobile Library header "+", the Playlists grid tile. Same pattern for `useAddToPlaylist()`.

The provider mounts both steps: **New Playlist** (cover tile, name `Input`, "Keep private" setting row) → **Add music**.

**Typing in Add music switches to global search** — not a local filter. The results render with the standard search pattern: content-type **pills** (`MobilePillTabs`), songs selectable via `MediaListItem` + a trailing `SelectTrackButton`, containers as nav rows.

**"Add music" row** leads your own playlist's track list while the header is in its **stacked layout** (`@min-[560px]:hidden`) — a normal list row: `size-12` `bg-secondary` circle with the bespoke `AddMusicIcon`, then the label. Never nest a primary/filled button inside a secondary row.

---

## Playlist edit drawer (desktop)

Owner-only **Edit** on a playlist docks a panel on the right that **persists across navigation** — you can browse to Home, search, open any album, and drag tracks into the playlist still held in the drawer. It is **docked, not an overlay**: it takes width from the content instead of covering it.

- State lives in [`playlist-editor-context.ts`](src/lib/playlist-editor-context.ts); `<PlaylistEditDrawer />` is mounted once at app level.
- **Drag and drop** uses the private MIME type `application/x-muza-song` (`SONG_DRAG_TYPE`) so only Muza rows are accepted. Every `SongListItem` is draggable.
- **Resizable** via [`use-resizable-width.ts`](src/lib/use-resizable-width.ts): handle on the panel's left edge, width remembered in localStorage, re-clamped to the **current** viewport on restore and on window resize (a width stored on a wide screen must not crush a narrow one). While dragging, the width is written straight to the element inside a rAF — React only sees it at drag start and end.
- **⤢ expands the drawer into the full playlist page** in four phases (`grow` → `cover` → `dissolve` → `idle`): the panel leaves the flow (`fixed` + `contain: layout paint`, with a placeholder holding its slot), grows to `main + panel` width, the editor UI fades out, and navigation commits *while covered* so the destination renders at its final width — no flash of the old page, no narrow→wide snap.
- The in-list "Add music" row is **hidden while the drawer is editing that same playlist** — both do the same job.

---

## Touch & gestures — STRICT

Phones are the default surface for the player, so gesture handling is a first-class rule, not polish.

**Never put `touch-action: none` on content you also want to scroll past.** It tells the browser not to pan at all for gestures starting there. Card covers had it, and since the cover is most of a card's area, a swipe along a rail almost always started on one — the rail simply refused to scroll. Covers now leave `touch-action` alone; the rail owns it (see the axis rule below).

**Never synthesise a tap from `pointerup`.** Use the browser's real `click`. It knows things a component cannot: whether the touch turned into a scroll, whether the page was still gliding, whether the finger drifted off the element — and it withholds the click in all of those cases. `useLongPress` therefore listens for `click` and only suppresses the single case the browser can't know about: the click that follows a *completed* long press. An earlier version fired on `pointerup` with an 8px movement guard, which is a crude re-implementation of one small part of that rule; the symptom was a light flick to scroll a page of large covers opening an album instead.

**`touch-action: pan-x` does NOT mean "vertical falls through".** It forbids vertical panning for every touch starting on that element, so a finger on a card couldn't scroll the page at all. Rails list **both** axes (`pan-x pan-y`) and let the browser pick from the gesture.

**Rails snap `mandatory`, not `proximity`.** A flick keeps its full momentum — the browser lets it coast to its natural resting point and then takes the nearest snap point — but it always comes to rest on an exact card boundary. `proximity` only snapped when the rail happened to stop near an edge, so a hard swipe left a card sliced down the middle. Requires a uniform stride (card + 16px gap) and no scroll-padding on the container.

**Nothing may exceed the viewport width on a phone.** Even fully clipped, iOS pans the *visual* viewport when content is wider than the layout viewport — which reads as the whole page drifting sideways. `scrollWidth` will not reveal this when an ancestor clips, so check element rects against `clientWidth`, not container overflow. Fixed paddings are the usual culprit: size hero CTAs with `clamp()` and add `max-w-full`.

---

## Track selection — the pick affordance

`SelectTrackButton` replaces a checkbox wherever tracks are picked (Add music): one plus that rearranges into a check, on a `bg-secondary` plate that fades once picked. See [docs/components/select-track.md](docs/components/select-track.md). The one rule: the **row** is the click target — the mark is `pointer-events-none`, `aria-hidden` and holds no state.

---

## Toasts — mobile shape

See [docs/components/toast.md](docs/components/toast.md) — a bottom bar on phones (lifted over the mini player, tab bar, home indicator and keyboard), the top-right card from 768. The rule not to miss: plain confirmations ("added", "created", "saved") pass `timeout: TOAST_CONFIRM_MS` (2.5s); a toast carrying an **action** (Undo) stays on the 5s default, because 2.5s is too short to read a line and reach a button.
