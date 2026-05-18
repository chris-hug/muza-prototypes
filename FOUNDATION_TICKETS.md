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
