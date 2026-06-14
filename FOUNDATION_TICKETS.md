# Foundation tickets — May 2026 push

Tier-1 design-system changes since the April 20 overhaul push
(`f8c7885 — Design system pass + Vinyl Create Listing flow`).
Changes to token values, semantic mappings, base-layer styles, and
motion keyframes — everything below the per-component layer. Wire
these up first; components and pages depend on them.

Repo: <https://github.com/chris-hug/muza-prototypes>
Prototype: <https://imjustsittingherelookingatprettycolours.help>

---

## Foundation

### Foundation — tokens, base styles, motion  ·  *updated*

> **Resources**
> - Source: [`app/app.css`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css)
>   - Tier 1 — primitives: [`app.css:216`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css#L216)
>   - Tier 2 — semantic tokens (light): [`app.css:264`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css#L264)
>   - Tier 2 — dark mode: [`app.css:313`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css#L313)
>   - Tier 2 — `.light` forced-light scope: [`app.css:369`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css#L369)
>   - Tier 3 — Tailwind theme mapping: [`app.css:64`](https://github.com/chris-hug/muza-prototypes/blob/main/app/app.css#L64)
> - Live swatches: [Colors](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#colors) · [Typography](https://imjustsittingherelookingatprettycolours.help/?page=DesignSystem#typography)
> - Downstream tickets affected: [`COMPONENT_TICKETS.md`](COMPONENT_TICKETS.md), [`PAGE_TICKETS.md`](PAGE_TICKETS.md)
> - Full diff (April 20 → HEAD): `git diff f8c7885..HEAD -- app/app.css`

**Affects.** Every component + page that consumes these tokens or
motion primitives — practically the whole surface area. Concrete
test surfaces:
- Any dark-mode form (the re-mapped `--input` token).
- Any view rendering photo covers (the global image-outline rule).
- The design-system page itself (the `.light` forced-light scope, which lets it render light + dark swatches side-by-side).
- Anything that uses `PlayingWave` / `CoverPlayButton` (the new motion keyframes).
- Every page navigation (the `pageFadeIn` crossfade).

**Summary.** Five foundation-layer changes since the April 20 push.
All live in [`app/app.css`](app/app.css). Code comments inline give
the why for each; this ticket is the punch-list of what's in scope.

**Changes.**

1. **Dark-mode `--input` re-mapped.** `var(--muza-neutrals-300)` → `var(--muza-neutrals-800)` (light mode unchanged at `var(--muza-neutrals-200)`). Inputs were too bright on dark surfaces; the darker neutral matches the dark-mode panel chrome.

2. **New `.light` forced-light scope.** Mirrors `:root`'s light-mode token mappings so a subtree can opt OUT of an ancestor's `.dark` scope. Used by the design-system kitchen sink to render light + dark swatches side-by-side regardless of the page's current theme. Has to stay in sync with `:root`.

3. **Global image-outline rule.** New base rule `img[class*="object-cover"] { outline: 1px solid rgba(0,0,0,0.1); outline-offset: -1px }` plus a dark variant at `rgba(255,255,255,0.1)`. Every photo — covers, product thumbnails, avatars — gets a 1px inset edge. Targets `object-cover` because that's the cleanest signal of "this is a photo, not a decorative SVG." Pure black/white at 10% opacity per the design rule (a tinted neutral picks up the surface beneath and reads as dirt).

4. **5 new motion keyframes for now-playing + 3D carousel.** Added: `muzaWaveLeft`, `muzaWaveCenter`, `muzaWaveRight` (the three-shape now-playing wave), `muzaCarouselFloat` (subtle Y-float on the carousel wrapper), `muzaCarousel` (the 8s Y-axis rotation). Per-stop `animation-timing-function` shaped at each keyframe — pass `linear` at the call site so the per-stop curves take effect.

5. **`pageFadeIn` keyframe + `.muza-anchor-*` tree-shake guards.** New 250ms `pageFadeIn` (opacity 0→1 + 6px translateY lift) for the route-change crossfade. Plus six dummy `.muza-anchor-*` rules (`carousel`, `carousel-float`, `wave-left`, `wave-center`, `wave-right`, `page-fade-in`) that reference each custom keyframe by name from CSS — without these, Tailwind v4 silently tree-shakes the keyframes from the build because they're only referenced via JSX arbitrary-value classes (`[animation:muzaCarousel_8s_…]`) which the JIT analyzer doesn't parse.

**Rules.**
- Keep `.light` in lockstep with `:root`. Any new semantic token added to `:root` must also be added to `.light` or the design-system swatch panel will resolve wrong.
- Never drop a `.muza-anchor-*` rule without dropping the corresponding JSX usage in the same change. The anchors are load-bearing.
- The image-outline rule targets `[class*="object-cover"]` — works because every photo in the app uses `object-cover`. Photos that need to opt out should override with their own `outline: none`.
- Tokens: if anything in your code relied on the OLD dark `--input` value (`--muza-neutrals-300`), bump it; in practice the only consumer is the `Input` component itself.
- Motion curves: don't override `animation-timing-function` at the call site — the keyframes carry per-stop curves that produce the "snap on the cardinal, hover between" feel. Set `linear` at the call site, let the keyframe do the easing.

---

### Page layout — responsive container & growth tiers  ·  *new*

> **Resources**
> - DS docs: [DESIGN_SYSTEM.md › Layout — page max-width tiers](DESIGN_SYSTEM.md#layout--page-max-width-tiers)
> - PAGE_TICKETS rule: [Pattern B — Container-query rail / grid](PAGE_TICKETS.md#pattern-b--container-query-rail--grid)
> - Touched pages: Home, Library × 3, Album detail, Playlist detail, Artist profile, Settings, Design system kitchen sink
> - Touched primitives: `CardRail`, every Library grid `<ul>`, `MediaHeader` (artist hero)

**Affects.** Every top-level page wrapper, every card grid, every
CardRail, and the artist-profile hero. This is a foundation-level
rule — once you adopt the wrapper class, the rails, grids, and
hero all step together at the right viewport widths.

**Summary.** Pages used to cap at `max-w-[1528px]` with no second
tier — so a 27"+ monitor showed huge white margins, and a half-card
peeked off the right edge of every rail at max width (1528 content
≈ 1448, but grids capped at 1400 → 48px leftover). Replaced with a
**two-tier growth model**: tier 1 caps at 1480 (content area =
exactly 6 cards × 220 + 5 × 16 = 1400, no leftover), tier 2 kicks
in at viewport ≥ 1920px and bumps to 1716 (content area = exactly
7 cards × 220 + 6 × 16 = 1636).

| Tier | Viewport | Page wrapper `max-w` | Content area | Grid / rail cards |
|---|---|---|---|---|
| 1 (default) | < 1920px | `1480px` | 1400px | 6 × 220 |
| 2 (wide screen) | ≥ **1920px** | `1716px` | 1636px | 7 × 220 |

**Apply to every top-level page wrapper:**
```tsx
<div className="@container mx-auto max-w-[1480px] min-[1920px]:max-w-[1716px] px-10 …">
```

**Grids step from 6 → 7 cards at `@container` width ≥ 1500px**
(intentionally above tier-1's 1400 content cap so tier-1 never
collapses 6 big cards into 7 small ones):
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

**Artist hero (`MediaHeader`-adjacent `<section>`) uses the same
dual cap.** Heights are derived from the page wrapper widths via
the hero's intrinsic aspect ratio (`1072/400`):

| Tier | Page wrapper | Hero `max-h` (calc) |
|---|---|---|
| 1 | 1480 | `552px` (= 1480 × 400/1072 ≈ 552) |
| 2 | 1716 | `640px` (= 1716 × 400/1072 ≈ 640) |

```tsx
<section className="aspect-[1072/400] min-h-[320px] max-h-[552px] min-[1920px]:max-h-[640px] …">
```

Past each ceiling the photo crops horizontally via `object-cover`
instead of inflating the hero further.

**Rules.**
- **Three numbers stay in lockstep**: page wrapper `max-w`, hero
  `max-h`, and grid 7-col threshold. Change one → recompute the
  other two. The math is spelled out in the inline comment on the
  hero in `artist-profile-view.tsx`.
- **Every page wrapper that ever shows a CardRail or stepped grid
  must use the dual cap.** Including the Design System kitchen
  sink — otherwise the showcase CardRail behaves differently from
  every real surface that uses it.
- **Don't add a `max-w-[1528px]` wrapper anywhere new.** It's the
  old single-tier value and breaks the grid-step math.
- **Don't hand-tune the 7-col threshold below 1500.** Anything ≤ 1400
  fires during tier 1 and collapses the 6-card layout. Anything
  above ~1600 misses the tier-2 content area.
- **Mobile peek** on the smallest CardRail step (container < 304) is
  intentional — cards are sized to ~60% so a sliver of the next
  card is visible, signaling scrollability. Don't widen them to
  exactly N cards at that breakpoint.
- **Bottom gutter (player clearance).** The player floats over the
  content (desktop bar ~80px at `bottom-5`; mobile footer-nav + mini
  bar ≈ 112px), so the shell's scroll container carries **`pb-32`
  (128px) on every page** — set once on the scroll `<div>` in the root
  shell, not per page. Last content must always scroll clear of the
  bar; nothing hides behind it. Add page-specific bottom space only
  *on top of* this gutter when a layout truly needs it.
