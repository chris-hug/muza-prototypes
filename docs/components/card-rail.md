---
title: Card Rail
status: updated
source: src/components/app/card-rail.tsx
related: [responsive, album-card, song-rail]
---

A `CardRail` is a section divider — separator, title, "Show all", ◀ ▶ — over a
single horizontally-scrolling row of cards. It exists so a shelf on Home, an
artist page or a search result can show the **same card sizes as the Library
grids** at the same page width, while scrolling sideways instead of wrapping.

## Usage

```tsx
// Home / detail rails — "Show all" links to a fuller page, so it always shows.
<CardRail title="New Albums" onShowAll={…}>
  <li><AlbumCard … /></li>
  …
</CardRail>

// A rail that already holds every item: no "Show all" at all.
<CardRail title="Artists on this Album" showAllLabel={null}>…</CardRail>

// Search shelves: "Show all" only when there is off-screen content to reveal.
<CardRail title="Albums" onShowAll={…} showAllOnlyWhenScrollable>…</CardRail>

// A 12+ item shelf an editor opted into the dense phone layout.
<CardRail title="Albums of the week" mobileGrid>…</CardRail>
```

Children are `<li>` elements — the rail is a `<ul>` and every width, snap and
cap rule targets `[&>li]`. A card wrapped in anything else gets none of them.

| Prop | Default | What it does |
|---|---|---|
| `title` | — | `text-base font-medium`, one line, truncates with an ellipsis |
| `showAllLabel` | `"Show all"` | label of the trailing ghost button; `null` removes the button |
| `onShowAll` | — | click handler for that button |
| `showAllOnlyWhenScrollable` | `false` | render "Show all" only while the rail actually overflows |
| `mobileGrid` | `false` | 2-row swipeable grid below a 560px container (see below) |

Used by Home (New Albums, Playlists / Artists / Albums of the week), the artist
page (Top Albums, Products, Curated Playlists, Similar Artists), album and
playlist detail pages, and the Search "All" tab for artists / albums /
playlists with **≥ 2** hits.

## It queries the page's container, not its own

The rail deliberately sets **no `@container` of its own**. Its `@min-[…]`
steps resolve against the nearest container ancestor — the page wrapper that
the Library grids also query — so a rail and a grid at the same page width
always pick the same column step and their cards are identically sized. A rail
dropped into a page without an `@container` ancestor never steps at all (the
Search "All" wrapper sets one for exactly this reason).

The column ladder itself — `304→2 · 464→3 · 692→4 · 928→5 · 1164→6 · 1500→7`,
16px column gap, 220px card cap — is shared with `.grid-cards` and the Song
Rail and is documented once in [Responsive](responsive.md#the-other-ladder-container-columns).
Card width at each step is `(100% − (N−1)·16px) / N`, so N cards and N−1 gaps
fill the row exactly and the rail's tracks land on the grid's tracks.

## Two modes, split at a 560px container

The column ladder decides *how many*; a second threshold decides *how the row
behaves*. Below a **560px** container the rail is in **swipe mode**; from 560
up it is in **grid mode**. 560 is the MediaHeader's stacking breakpoint, so a
page flips to its phone reading in one go rather than component by component.
With the sidebar collapsing below 1069px viewport, container ≈ viewport − 133,
and the two land at the same viewport width.

### Grid mode (≥ 560)

Cards fit exactly N per row, no partial card. The `<li>` floor drops to
`min-w-[143px]` so the ladder's calc governs. At 560 the 3-column width loses
its peek reserve (`(100% − 32px) / 3` instead of `(100% − 72px) / 3`), which is
what makes 560–691 a clean 3-up grid rather than 2 cards and a sliver.

### Swipe mode (< 560)

Every `<li>` is floored **and** capped at 220px (`min-w-[220px]` +
`max-w-[220px]`), so cards lock to the ladder's maximum size and the row shows
one or two big cards with the next one cut off at the right edge — the "this
scrolls" cue on touch. Because the floor is 220 and the ladder's calc never
exceeds 203px below 560, the width classes are inert here; what is visible is
simply how many 236px strides (card + gap) fit:

```text
container 296 (320px phone, Display Zoom)   1 card + 60px of the next
container 351 (375px phone)                 1 card + 115px of the next
container 480                               2 cards + 8px of the next
container 559                               2 cards + 87px of the next
container 560 (grid mode)                   3 cards of 176px, no peek
```

The "Show all" ghost button also firms into a **secondary pill** here
(`@max-[559px]:!bg-secondary`), because the chevrons are gone and a ghost link
alone reads as text rather than a tappable affordance. The `!` is needed to
beat the ghost variant's own hover background.

## Scrolling: snap is mandatory, and both touch axes are listed

```tsx
<ul className="… snap-x snap-mandatory scroll-smooth touch-pan-x touch-pan-y overscroll-x-contain …">
  <li className="snap-start …">
```

- **`snap-x snap-mandatory`, not `proximity`.** Mandatory does not shorten a
  flick: momentum runs to its natural resting point and the browser then takes
  the nearest snap point, so a hard swipe still lands on a card edge instead
  of leaving a card sliced down the middle. `proximity` only snapped when the
  rail happened to stop near an edge. This needs a **uniform stride** (card +
  16px gap) and **no `scroll-padding`** on the container — the rail has
  neither a padding nor a per-item margin that would break the stride.
- **`touch-pan-x touch-pan-y` — both axes.** `pan-x` alone does not mean
  "vertical falls through": it forbids vertical panning for any touch that
  starts inside the rail, so a finger on a card could not scroll the page.
  Listing both lets the browser choose the axis from the gesture. The same
  rule is why covers carry **no** `touch-action` of their own: a cover is most
  of a card's area, so a `touch-none` there made the rail refuse to scroll.
- **`overscroll-x-contain`** stops a swipe past the end from rubber-banding the
  body.
- **Overflow is contained twice.** The `<ul>` is `min-w-0 overflow-x-auto
  overflow-y-hidden`; the `<section>` is `min-w-0 overflow-x-clip`. Without
  `min-w-0` a flex parent lets the row grow to its content width and the
  horizontal scroll leaks up to the page — on iOS that reads as the whole page
  drifting sideways. `clip` rather than `hidden` on the section so the vertical
  axis stays `visible` and card focus rings / hover overlays are not cut.
- The OS scrollbar is hidden (`[scrollbar-width:none]` + the WebKit
  pseudo-element). Navigation is the swipe or the arrows.

Both of these are the settled rule. The design-system page once described the
rail as `touch-action: pan-x` with a "free-form" swipe; that prose was wrong
on both counts and has been corrected to the shipped `snap-x snap-mandatory`
and `touch-pan-x touch-pan-y`.

## Arrows and "Show all"

The header order is **[Show all] then ◀ ▶**, in a `shrink-0` cluster so a long
title truncates instead of squeezing the controls.

The arrows are a **pointer affordance for grid mode only**, gated three ways:

| Gate | Where | Why |
|---|---|---|
| rail actually overflows | `showArrows` state | arrows on a row that cannot scroll read as broken |
| pointer device | `[@media(hover:none)]:!hidden` | on touch the native swipe is the cue |
| container ≥ 560 | `@max-[559px]:hidden` | below 560 the cut-off card is the cue, so arrows would be redundant |

`showArrows` is recomputed on scroll, on a `ResizeObserver` (window resize
*and* sidebar collapse both change `clientWidth`) and on a `MutationObserver`
of the children (mocked data that arrives a frame after mount). A 1px
tolerance absorbs sub-pixel `scrollLeft` values. Each arrow disables at its own
end.

An arrow press scrolls by **`clientWidth` + one gap**. `clientWidth` covers N
cards and N−1 gaps; the next page starts after the N-th gap, so without the
extra 16px the row drifted a half-gap left on every press. Snap then re-aligns
whatever rounding is left.

"Show all" renders when `showAllLabel` is truthy **and** either
`showAllOnlyWhenScrollable` is off or the rail overflows. Home and detail rails
leave the default (the link goes to a fuller page than the rail holds);
search shelves pass `showAllOnlyWhenScrollable` because a section that already
shows every hit would reveal nothing.

## `mobileGrid` — the dense phone layout

For shelves of **12+** entries an editor can opt into a 2-row, column-major
grid below 560 (`grid grid-flow-col grid-rows-2`), swiped across columns.
Fewer than about 12 and the two rows look sparse; the count and the editor
toggle are the **host's** decision — the component only takes the boolean.
From 560 up it collapses to `grid-rows-1` with the exact N-per-row widths and
is indistinguishable from the default rail.

Below 560 the column width uses the peek formula `(100% − 40px − (N−1)·16px) / N`
with **no 220 floor**, so — unlike swipe mode — the calc does govern and the
column count runs one ahead of the ladder:

```text
container < 304    auto-cols 40%                 2 columns + a sliver
container 304–463  (100% − 72px) / 3             3 columns · 24px peek   (93px cards at 351)
container 464–559  (100% − 88px) / 4             4 columns · 24px peek
```

The 24px peek is the 40px reserve minus one 16px gap: the next column starts
exactly 24px before the right edge. The year on an `AlbumCard`
(`data-card-year`) is hidden below 560 so the meta line does not crowd at
these widths; it returns on the single row from 560 up.

## The base declaration must be a real layout

Under any container-query ladder the un-prefixed declaration is what renders
below the first rung **and** on every engine without container queries (older
iOS Safari). It must therefore be a layout in its own right, not the ladder's
bottom step. `.grid-cards` learned this the hard way: its base was
`repeat(1, minmax(143px, 220px))`, which on a 296px-wide container (a 320px
phone in Display Zoom) produced one narrow column with an empty band beside it,
and any wider card overflowed sideways. Its base is now
`repeat(auto-fill, minmax(128px, 1fr))` — see
[Responsive](responsive.md#the-other-ladder-container-columns).

The rail's bases follow the same rule: `[&>li]:w-[60%]` in row mode is
overridden by the 220 floor into one full card plus a peek, and
`auto-cols-[40%]` in grid mode gives two columns plus a sliver. Neither
depends on a `@min-[…]` step firing.

## Spacing

| Part | Value |
|---|---|
| Section top | `pt-6` above the separator |
| Separator → header row | `gap-2` |
| Header → rail | `gap-4` |
| Column gap | 16px (`gap-4`, `gap-x-4`) — not the page gutter |
| Row gap (`mobileGrid`) | 24px (`gap-y-6`) |
| Card cap | 220px |

## Open questions

- **Peek arithmetic below 560 is undecided.** The doc above records the measured behaviour; the comments and the design-system page still describe a different one, and nobody has ruled which is the intent:
  - `card-rail.tsx:38` and `home.tsx:4278` claim a "~24px peek" in swipe (row) mode · source floors `<li>` at 220px below 560 (card-rail.tsx:293) and the calc never exceeds 203px there, so the peek is `container − k·236`: 60px at 296, 115px at 351, 8px at 480, 87px at 559. 24px is what the `mobileGrid` formula yields (40 reserve − 16 gap, card-rail.tsx:274), not the row mode.
  - `home.tsx:4268–4273` lists visible cards stepping `304→2, 464→3` · in row mode below 560 the 220 floor overrides those widths (card-rail.tsx:293–296): a 304 container shows 1 card, two full cards appear only from 472. The classes step there; the visible count does not.
  - `card-rail.tsx:56` and `home.tsx:4311` claim `mobileGrid` shows "~2× the cards per screen" · at a 351 container it is 2 rows × 3 columns = 6 full cards (card-rail.tsx:267, 274) against 1 full card in row mode — closer to 6×.
  - `mobileGrid` at a 296 container yields 75px columns (`(296 − 72) / 3`, card-rail.tsx:274) with no floor. Is `AlbumCard` meant to render that small?
- **The 472–496 near-blind band.** In row mode a container of 472–496 shows the third card at 0–24px, so the "peek is the cue" argument has a near-blind band right where the arrows are also hidden (card-rail.tsx:194, 293). Intended?
