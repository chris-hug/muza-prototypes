---
title: Media List Item
source: src/components/ui/media-list-item.tsx
related: [song-list-item, dialog]
usage:
  - Library / search — mixed result list (mobile) | /?page=Albums
---

`MediaListItem` is one row in a **mixed** list — albums, playlists, tracks,
artists and labels sitting together, as in the library's list mode, a search
tab, or a picker sheet. It shares the visual anatomy of
[Song List Item](song-list-item.md) (thumb · title · meta · ⋯) but has a
different job: it is a **nav** row, not a player row. Tapping it goes
somewhere; only a song's cover plays.

No heart, no duration. The only trailing control is the ⋯ menu — or whatever
the host puts in the `trailing` slot instead.

## One row, seven types

`type` is the `ContentType` union from `badge.tsx`: `song`, `album`,
`single`, `ep`, `artist`, `playlist`, `label`. The type drives two things —
what the leading slot draws, and what a tap does.

```tsx
<MediaListItem type="album"    cover={…}  title="Time Out" subtitle="The Dave Brubeck Quartet" meta="1959" onOpen={…} menuItems={<AlbumCardMenuItems />} />
<MediaListItem type="playlist" covers={…} title="Modal Jazz Meditations" subtitle="You" meta="123 Songs" onOpen={…} />
<MediaListItem type="song"     cover={…}  title="Acknowledgement" subtitle="John Coltrane" meta="1965" onOpen={…} onPlay={…} />
<MediaListItem type="artist"   cover={…}  title="Charles Mingus" onOpen={…} />
<MediaListItem type="label"    cover={…}  title="Impulse!" subtitle="12 albums" />
```

| `type` | Leading slot | Second line |
|---|---|---|
| `song` (with `cover`) | `CoverPlayButton` — play / pause / wave overlay | `subtitle` · `meta` |
| `album`, `single`, `ep` | 48px square, `rounded-xs` | `subtitle` · `meta` |
| `playlist` with ≥ 4 `covers` | 48px 2×2 collage of the first four | `subtitle` · `meta` |
| `playlist` with < 4 `covers` | 48px square from `cover ?? covers[0]` | `subtitle` · `meta` |
| `artist` | 48px circle (`rounded-full`) | **none** — the line is gated on `type !== "artist"` |
| `label` | 48px circle, like an artist | `subtitle` · `meta` (search passes the album count as `subtitle`) |

Every thumb is `size-12 shrink-0` with `bg-secondary` behind it, so a missing
or slow image shows a muted block at the right size instead of collapsing the
row. The collage tile is `overflow-hidden` so the four `size-full` images clip
to the outer `rounded-xs` corner.

A label renders like an artist — round avatar and name — because there is no
label page yet; search renders it with no `onOpen` and no menu. Nothing
distinguishes the two visually: the row renders **no badge** for a label (or
for any other type), and the component's own comment, which for a long time
claimed a "Label" badge, now says so.

## What a tap does

The row-body action depends on the type:

```tsx
const activate = type === "song" ? (onOpen ?? onPlay) : onOpen
```

- **Containers always navigate.** `onOpen` is the only thing an album,
  playlist, artist or label row can do; `onPlay` is ignored for them.
- **A song opens its release when `onOpen` is supplied**, and only the cover
  button plays. That is the search-tab and library case: the row is a nav
  row like its neighbours, and the `CoverPlayButton` is the one playable
  surface. With no `onOpen` the whole row plays — the picker case, where a row
  has nowhere to go.
- The song's cover is a `CoverPlayButton` with `hoverGroup="row"`, so its
  play overlay appears when the **whole row** is hovered (`group/row`), not
  just the 48px thumb. `playing` flips the overlay to the wave / pause states
  and paints the row `bg-muted`.

A song **without** a `cover` falls through to the plain square `<img>` and has
no play control at all — the `CoverPlayButton` branch is gated on
`type === "song" && cover`.

### Nested controls win

Row-wide click never fires when a nested button or link was the real target:

```tsx
if ((e.target as Element).closest("button, a")) return
activate?.()
```

Everything that can be clicked inside the row is a `<button>` — the
`CoverPlayButton`, the subtitle when `onSubtitleClick` is given, the ⋯
trigger — so playing a song or opening the artist never also opens the album
underneath. No `stopPropagation` is needed in any of them.

The guard only recognises `button` and `a`. Bespoke `trailing` content that is
neither (a `ChevronRight` icon, `SelectTrackButton`) lets the tap fall through
to the row, which is the point: in the Add-music picker the **whole row** is
the tick target and `SelectTrackButton` is `pointer-events-none` — a display
affordance, not a control. It is deliberately not a `Checkbox`: a real
checkbox would be a second focusable control inside the row and would catch
the tap that the row is meant to own. The `trailing` JSDoc names
`SelectTrackButton` as its example for that reason.

## Subtitle as a link

`onSubtitleClick` turns the subtitle into a button that underlines on hover
and on keyboard focus, through the shared `link-underline` (the line wipes in from the left over 140ms). Search uses it
to jump to the artist from an album row, or to the owner from a playlist row
that isn't yours (`owned ? undefined : …`). Without the handler the subtitle is
a plain span.

## The meta line truncates, it never runs under the control

The second line is `flex items-center gap-1.5 min-w-0`. Both halves —
subtitle and meta — are `min-w-0` + `truncate`, deliberately **not**
`shrink-0`: a long album title such as "The Black Saint and the Sinner Lady"
could not shrink and ran on under the trailing button instead of ellipsing.

The dot is `shrink-0` and `aria-hidden` — it is punctuation, not content, and
it must never be the part that ellipses.

**This row has no width steps, and no container query.** It used to: the row
was an `@container` and the meta span carried a 240px hide step. An audit of
every placement found that 240 is never reached, so the step had never once
fired:

| Placement | Narrowest real width |
|---|---|
| Page lists (search, the phone library lists) | 296 — a 320px phone leaves a 296px column |
| Add-to-playlist / Add-music bottom sheet | 312 |
| Playlist editor drop zone | 324 |
| Desktop dialogs | 480 |

Both halves are already `min-w-0 truncate`, which handles the overflow the
step was meant to prevent. Unlike [Song List Item](song-list-item.md), this
row is never placed in a rail cell, so it has no narrow context that the page
column does not already describe — and therefore nothing to measure itself
for.

## Trailing — one slot, two occupants

```tsx
// Default: the ⋯ menu. Omit `menuItems` → no menu, no trailing control.
<MediaListItem … menuItems={<AlbumCardMenuItems />} />

// Bespoke: a picker's affordance instead of the menu.
<MediaListItem … trailing={<SelectTrackButton selected={on} />} />
<MediaListItem … trailing={<ChevronRight className="size-4 text-muted-foreground mr-2" />} />
```

`trailing` **wins** when both are passed: a row is one or the other, never a
tick beside a kebab. The ⋯ is a `Button variant="ghost" size="icon-sm"` (32px
around a 16px glyph, `aria-label="More options"`) opening a `DropdownMenu`
aligned `end` with a 6px offset, so the menu hangs off the row's right edge.

The trailing box sits close to the row's right edge: the row's own `pr-1.5`
(6px) is the only inset. A deeper one wasted horizontal space on phones,
where the row is already the full sheet width. In the Add-music picker the
album rows' chevron sits where the tick sits on track rows, so "goes
somewhere" and "selects" are told apart at a glance without a badge.

## Spacing and type

| Part | Value | Why |
|---|---|---|
| Row padding | `pl-2 pr-1.5 py-1.5` — 8 / 6 / 6px | left inset lines the thumb up with the sheet gutter (see below); right is deliberately tighter |
| Gap thumb → text → control | `gap-3` (12px) | same rhythm as Song List Item |
| Row height | 48px thumb + 2 × 6px = 60px | fixed by the thumb, not the text |
| Row radius | `rounded-md` (10px) | the hover surface, not the thumb |
| Square thumb radius | `rounded-xs` (2px) | cover art keeps its corners |
| Title | `text-xsmall font-normal leading-5 text-foreground truncate` | 17px, one line |
| Meta | `text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-5` | same size, lighter weight and colour carry the hierarchy |
| Surfaces | `bg-background [--hover-fill:var(--muted)]`; `bg-muted` while `playing` | `state-fade-quick` between them, and the hover fill grows from where the pointer entered (`press-ripple`) — 260ms in, 100ms out, a list's pace rather than a Button's 440ms |

Both lines are the **same** 17px `text-xsmall` — the meta line is
distinguished by weight (`font-light`), colour and a hair of tracking, not by
size. Two sizes inside a 60px row read as busy. The title / meta column is
`flex-1 min-w-0 gap-0.5` so it takes whatever the thumb and control leave and
is allowed to shrink to zero.

## Inside a dialog: the row brings its own `pl-2`

`dialogListClass` in [`dialog.tsx`](../../src/components/ui/dialog.tsx) is
`flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto -mx-2` — a negative
margin **without** a matching `px-2`. The row's own `pl-2` restores the 8px, so
every cover lands exactly on the sheet's gutter line with the title, the
field and the footer. A scroll container that wrapped these rows in a
symmetric `px-2` would double it and push every cover 8px past the gutter.
Letting the rows' hover surface bleed 8px into the gutter is the point of the
negative margin, not a side effect.

```tsx
<div className={cn(dialogListClass, "gap-2")}>
  {songs.map(s => <MediaListItem key={s.id} type="song" … />)}
</div>
```

## Same anatomy as Song List Item — different job

| | Song List Item | Media List Item |
|---|---|---|
| Row tap | toggles play | navigates (`onOpen`); song plays only without `onOpen` |
| Hover group | `group/song` | `group/row` |
| Right padding | `pr-2` | `pr-1.5` |
| Trailing | ♥ + duration, More / Info on hover, "…" sheet on touch | ⋯ menu or a bespoke `trailing` |
| Meta disclosure | four container-width steps | one step at 240px |
| Overflow | `overflow-clip` with a fading veil | plain truncation |
| Draggable | yes (`application/x-muza-song`) | no |

Where a song is listed as a song — Top Songs, an album, a playlist, the
Songs shelf on search's All tab — use Song List Item. `MediaListItem` is for a
song that sits **beside** albums and artists as a peer.

## Where it is used

- Search: every row of a specific tab (Songs / Artists / Albums / Playlists /
  Labels) in `search-results-view.tsx`.
- Library list mode (`media-list-table.tsx`) — nav rows whose kebab reuses the
  card menus.
- Add music (`add-music-dialog.tsx`) — song rows with a `SelectTrackButton`
  trailing, album rows with a chevron.
- Add to playlist (`add-to-playlist-dialog.tsx`) — playlist rows, `onOpen`
  adds.
- Playlist edit drawer (`playlist-edit-drawer.tsx`).

Content-type badges: `DESIGN_SYSTEM.md` lists "Library list rows /
`MediaListItem`" under **no badge** — a single-type view or a search tab
already names the type — and the component renders none. The design-system
page's Media List Item section used to say a `ContentTypeBadge` labels each
row; it now describes the adaptive thumb only.

## Artwork

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. All three leading shapes carry it at `size-12`: the round artist portrait, the 2×2 playlist collage and the square cover.

## Open questions

- The `playing` prop is documented "Song only" (media-list-item.tsx:48) · the `bg-muted` row surface is applied for any type when `playing` is true (media-list-item.tsx:85); only the `CoverPlayButton` branch is song-gated.
- The header comment says the leading slot is "2×2 collage (playlist)" (media-list-item.tsx:16–17) · the collage needs `covers.length >= 4`; a playlist with fewer tiles gets a single square from `cover ?? covers[0]` (media-list-item.tsx:186, 199). Documented above as observed; confirm the fallback is intended rather than a 2- or 3-tile collage that was never built.
- No source states why the meta step was 240px rather than another value (media-list-item.tsx:114) — the rationale above stops at "one field to drop"; the number itself is unexplained.
