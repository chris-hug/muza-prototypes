---
title: Song Rail
source: src/components/app/song-rail.tsx
related: [card-rail, song-list-item, search, responsive]
usage:
  - Artist › Top Songs | /?page=Artist&artist=sun-ra
  - Search › Songs group | /?page=Explore&q=blue
---

A `SongRail` is the row-shaped sibling of [Card Rail](card-rail.md): it chunks
pre-rendered [Song List Item](song-list-item.md) rows into columns of three and
scrolls them sideways under the same separator · title · "Show all" · ◀ ▶
header. It is one shell for Artist › Top Songs and Search › Songs — each host
passes its own rows, so the rail stays data-agnostic.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Section | `flex flex-col gap-4 min-w-0 overflow-x-clip` | `min-w-0` so a flex parent cannot let the row grow to its content and leak a horizontal scroll to the page; `clip` rather than `hidden` so the vertical axis stays visible for focus rings |
| Header | `flex flex-col gap-2 pt-6` — `Separator`, then `h2 text-base font-medium text-foreground truncate min-w-0` with a `shrink-0` control cluster | the long title truncates; the controls never squeeze |
| Show all | `Button variant="ghost" size="sm"`, `@max-[560px]:!bg-secondary !text-secondary-foreground hover:!bg-secondary-hover` | below a 560px column a ghost link alone reads as text; the `!` beats the ghost variant's own hover fill |
| Arrows | two `outline` `icon-sm` buttons in `[@media(hover:none)]:!hidden @max-[692px]:hidden` | a pointer affordance for the multi-column layout only |
| Rail | `<ul>` · `min-w-0 flex gap-6 items-start overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth touch-pan-x touch-pan-y overscroll-x-contain`, scrollbar hidden, `[&>li]:shrink-0 [&>li]:snap-start` | the same scrolling rules as Card Rail, with a **24px** column gap instead of 16 |
| Column | `<li>` → inner `<ul class="flex flex-col gap-1">` of up to `ROWS_PER_COLUMN` = 3 rows | `gap-1` is the list rhythm every song list uses |

The control cluster — "Show all" **and** the arrows — is rendered only while
the rail actually overflows (`scrollWidth − clientWidth > 1`, recomputed on a
`ResizeObserver` and a `MutationObserver` of the children). A rail that shows
every row gets neither.

| Prop | What it does |
|---|---|
| `title` | the heading |
| `rows` | pre-rendered, **keyed** song rows; the rail slices them three per column |
| `onShowAll` | optional; omitted → no "Show all" ever (Artist › Top Songs); present → shown on overflow, opens the fuller view |

`ROWS_PER_COLUMN` is exported so a host can size its data to whole columns.

## Usage

```tsx
// Artist › Top Songs — player-wired rows, no "Show all".
<SongRail
  title="Top Songs"
  rows={tracks.map(t => (
    <SongListItem key={t.id} compact cover={t.cover} title={t.title} album={t.album} year={t.year}
      playing={isCurrent(t)} onPlay={() => play(t)} hideGoToArtist />
  ))}
/>

// Search › Songs — `SearchSongRow`s, "Show all" opens the Songs tab.
<SongRail title="Songs" rows={songs.map(r => <SearchSongRow key={r.id} r={r} compact />)} onShowAll={() => setTab("song")} />
```

Rows are passed in **`compact`**: a third of a rail column is tight, so the
row drops its duration and swaps its trailing cluster by pointer — see
[Song List Item](song-list-item.md#compact--the-swipe-rail-cluster-chosen-by-pointer).

## Sizing

The rail reads the **column** — it sets no `@container` of its own, so its
`@min-[…]` steps resolve against the page shell (or Search's `@container`
wrapper), the same container the card ladder reads. Two steps, borrowed from
the card ladder's 4- and 6-column points:

```text
column < 692     1 column   [&>li]:w-[calc(100% − 48px)]        the next column peeks 24px (48 − the 24px gap)
column ≥ 692     2 columns  @min-[692px]:  (100% − 24px) / 2      exact, arrows carry the scroll
column ≥ 1164    3 columns  @min-[1164px]: (100% − 48px) / 3      exact
```

Why the step numbers are shared: at 692 the card rail shows four covers and
at 1164 six, so two song columns sit over four cards and three over six, and
a page that stacks a Song Rail over a Card Rail reads as one grid (the
alignment is approximate — see the open questions).

What a row gets inside a column is what makes Song List Item measure itself:

```text
320px phone → 296px column → 248px cell      (296 − 48)
375px phone → 351px column → 303px cell
692px column                → 334px cell     ((692 − 24) / 2) — narrower than the 644px cell at 691
1164px column               → 372px cell     ((1164 − 48) / 3) — narrower than the 570px cell at 1163
```

The cell is **not monotonic** in the column: each new column takes width back
from the rows. That is why the row's 260 / 300 / 380 steps are its own box, not
a prop the rail could pass down.

Below 692 the rail is in **swipe mode**: arrows hidden, the cut-off next
column is the cue, "Show all" firms into the secondary pill below 560. From
692 the columns fit exactly and the arrows, pointer-only, carry the
affordance.

## Behaviour

- **Snap is mandatory.** `snap-x snap-mandatory` (not `proximity`): a flick
  keeps its momentum and always comes to rest on a column edge, so a hard
  swipe never leaves a column sliced down the middle.
- **Both touch axes are listed.** `touch-pan-x touch-pan-y` — `pan-x` alone
  forbids vertical panning for a touch that starts in the rail, so a finger
  on a row could not scroll the page. `overscroll-x-contain` stops a swipe
  past the end rubber-banding the body.
- **An arrow press scrolls by `clientWidth` + the column gap** (read from
  `getComputedStyle(el).columnGap`), so the next page starts after the gap
  rather than a half-gap short; snap absorbs the rounding.
- Each row keeps its own wiring — play, credits, navigation — the rail never
  touches a row.

## Where it is used

- Artist › Top Songs (`artist-profile-view.tsx`) — player-wired `compact`
  rows, `hideGoToArtist`, no `onShowAll`.
- Search › Songs on the All tab (`search-results-view.tsx`) — at **≥ 6**
  hits; `onShowAll` opens the Songs tab. ≤ 5 hits render a plain list of full
  rows instead — six is the first count that fills two whole columns.

## Open questions

- song-rail.tsx:16–17 and DESIGN_SYSTEM.md say the columns "line up with the
  CardRail card columns at the same page width" · the arithmetic is close, not
  exact: at a 692px column two cards plus their 16px gap span
  `(692 − 48) / 2 + 16 = 338px` while a song column is `(692 − 24) / 2 = 334px`
  (4px short); at 1164 the figures are 377.3 and 372 (5.3px short). The
  difference is the two rails' gaps — 16 versus 24.
- "Show all" firms into the pill below **560** (song-rail.tsx:77) while the
  arrows hide below **692** (:85). Card Rail switches both at 560, and the
  reason for the pill there is "the chevrons are gone". Here, between 560 and
  691, the ghost "Show all" stands beside no chevrons — the state the pill was
  meant to avoid.
- Card Rail renders "Show all" by default and gates it on overflow only with
  `showAllOnlyWhenScrollable`; Song Rail gates it on overflow **always**
  (song-rail.tsx:70). Intended asymmetry, or should Song Rail take the same
  flag?
