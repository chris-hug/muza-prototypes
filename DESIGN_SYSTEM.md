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
| `--primary` | `#1E34D8` | `#1E34D8` | brand blue (muza-blue-200) — buttons, links, shuffle-active |
| `--primary-foreground` | `#FAFCF4` | `#FAFCF4` | text on primary bg |
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

Figma primitives now match Muza CSS 1:1 after Figma was updated to adopt Muza's scale (text-xxs = 14 promoted to a first-class primitive, all other sizes shifted up one step).

| Primitive | Figma value | Muza CSS value | Aligned? |
|---|---|---|---|
| `text-xxs` | **14**  | 14  | ✅ |
| `text-xs`  | **16**  | 16  | ✅ |
| `text-sm`  | **18**  | 18  | ✅ |
| `text-base`| **20**  | 20  | ✅ |
| `text-lg`  | **24**  | 24  | ✅ |
| `text-xl`  | **30**  | 30  | ✅ |
| `text-2xl` | **36**  | 36  | ✅ |
| `text-3xl` | **48**  | 48  | ✅ |
| `text-4xl` | **60**  | 60  | ✅ |
| `text-5xl` | **72**  | 72  | ✅ |
| `text-6xl` | **96**  | 96  | ✅ |
| `text-7xl` | **128** | 128 | ✅ |
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
| `ring` | `#1D1C18` (neutrals-900) | `#DADDCD` (neutrals-300) | `--ring` |
| `secondary` | `#F1F3E6` (neutrals-100) | `#2E2C24` (neutrals-800) | `--secondary` |
| `secondary-hover` | `#ECEEDF` (neutrals-200) | `#3C3D33` (neutrals-700) | `--secondary-hover` |
| `secondary` 0%/75% | α | α | (alpha) |
| `secondary-foreground` | `#1D1C18` | `#F9FAF0` | `--secondary-foreground` |
| `chart-1..5` | varied | varied | `--chart-1..5` |
| `sidebar-*` | varied | varied | `--sidebar-*` (same shape as above) |

**Rule: never write hex colours in component code. Always use semantic token classes (`bg-primary`, `text-muted-foreground`, `border-border`) or the CSS variable references.**

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
| `2x small`    | `text-xxs`  | `leading-4`  | `normal`      | 14 / 16 / 0 |
| `extra small` | `text-xs`   | `leading-4`  | `normal`      | 16 / 16 / 0 |
| `small`       | `text-sm`   | `leading-5`  | `wide` (0.25) | 18 / 20 / 0.25 |
| `base`        | `text-base` | `leading-6`  | `normal`      | 20 / 24 / 0 |
| `large`       | `text-lg`   | `leading-7`  | `normal`      | 24 / 28 / 0 |
| `xlarge`      | `text-xl`   | `leading-7`  | `normal`      | 30 / 28 / 0 |
| `2x large`    | `text-2xl`  | `leading-8`  | `normal`      | 36 / 32 / 0 |
| `3x large`    | `text-3xl`  | `leading-9`  | `normal`      | 48 / 36 / 0 |
| `4x large`    | `text-4xl`  | `leading-10` | `normal`      | 60 / 40 / 0 |

### Muza CSS implementation — now fully aligned ✅

Both bugs fixed. Full upper range present; aliases use `var()` references.

| Token (Muza CSS) | Kind | Value | Status |
|---|---|---|---|
| `--text-xxs`   | primitive         | `14px`  | ✅ |
| `--text-xs`    | primitive         | `16px`  | ✅ |
| `--text-sm`    | primitive         | `18px`  | ✅ |
| `--text-base`  | primitive         | `20px`  | ✅ |
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
| `--text-2xsmall` | semantic alias  | `var(--text-xxs)`  → 14 | ✅ wired via var() |
| `--text-xsmall`  | semantic alias  | `var(--text-xs)`   → 16 | ✅ wired via var() |
| `--text-small`   | semantic alias  | `var(--text-sm)`   → 18 | ✅ wired via var() |
| `text-base`      | alias = primitive | — (primitive serves both roles) → 20 | ✅ — use primitive directly |
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
| `list`        | `base`        | `text-base`| 20 | `leading-7`  | `normal` | Regular 400 |
| `table`       | `base`        | `text-base`| 20 | —            | `normal` | Regular 400 |
| `p`           | `small`       | `text-sm`  | 18 | `leading-6`  | `normal` | Regular 400 |
| `inline code` | `small`       | `text-sm`  | 18 | `leading-5`  | `normal` | Semibold 600 mono |
| `small`       | `extra small` | `text-xs`  | 16 | `leading-4`  | `wide` (0.25) | Regular 400 |

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
| `text-xxs` | 14px | **minimum** — chips, badges, button-sm only |
| `text-xs` | 16px | captions, metadata, helper text |
| `text-sm` | 18px | body, labels, inputs, nav sub-items |
| `text-base` | 20px | lead text, nav items, primary content |
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
| `sm` | 32px `h-8` | 12px `px-3` | 14px `text-xxs` | `font-normal` |
| `default` | 36px `h-9` | 16px `px-4` | 18px `text-sm` | `font-medium` |
| `lg` | 40px `h-10` | 32px `px-8` | 18px `text-sm` | `font-medium` |
| `icon-sm` | 32px `size-8` | — | — | — |
| `icon` | 36px `size-9` | — | — | — |
| `icon-lg` | 40px `size-10` | — | — | — |

Ghost hover bg: `hover:bg-secondary` (NOT muted — too light)

---

## Chips (Figma node 21232:6353 filter · 21232:6420 dismissable)

Height: 32px (`h-8`) · Padding: 12px (`px-3`) · Gap: 8px (`gap-2`) · `rounded-full`
Font: 14px `text-xxs` `font-normal`
Variants: **default** (`bg-background border-border hover:bg-muted` — same as outline button) · **selected** (`bg-primary border-primary text-primary-foreground`)
No secondary or ghost variants — those don't exist in Figma.
Dismissable chips use `<ChipDismiss>` with X icon (14px).

---

## Badges

Shape: `rounded-[2px]` · Padding: `pt-[4px] pb-[6px] px-1.5` · Font: `text-xxs font-medium` · Never uppercase

### `<ContentTypeBadge>` (Figma node 21368:27118)
Used on tracks/releases/artists. Always `bg-secondary text-secondary-foreground` + left Lucide icon (12px).
Types: `song` · `album` · `single` · `ep` · `artist` · `playlist`

### `<StatusBadge>` (Figma node 21368:27118)
Track visibility. Always glassmorphism: `backdrop-blur-sm bg-background/50 border-[0.5px] border-neutral-500 text-muted-foreground`.
Always has left icon + right chevron. Statuses: `public` (Globe) · `private` (Lock)

### `<Badge>` primitives (Figma node 26:169)
Design system base variants: `default` (neutral-950) · `secondary` · `outline` (glassmorphism) · `destructive`

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
