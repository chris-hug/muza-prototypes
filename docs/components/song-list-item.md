---
title: Song List Item
source: src/components/ui/song-list-item.tsx
related: [media-list-item, song-rail, detail-more-button, responsive]
usage:
  - Artist › Top Songs | /?page=Artist
  - Album detail (track list) | /?page=Album
---

`SongListItem` is one row in a list of **songs** — Top Songs on an artist
page, the track list on an album, a playlist, the Songs shelf on search, the
Songs library. It is a **player row**: tapping anywhere on it toggles play.
Its sibling [Media List Item](media-list-item.md) shares the anatomy
(thumb · title · meta · trailing) but is a **nav** row for lists where songs
sit beside albums and artists; use that one there, this one wherever every
row is a song.

## Two leading slots, one component

The leading slot is chosen by which prop is passed — there is no second
component:

```tsx
// cover mode — rows drawn from different releases (Top Songs, playlist, search, library)
<SongListItem cover={t.cover} title={t.title} artist={t.artist} album={t.album} year={t.year} duration={t.duration} />

// trackNumber mode — one album's own track list; the cover would repeat the header
<SongListItem trackNumber={i + 1} title={t.title} duration={t.duration} />
```

`trackNumber != null` wins; otherwise the row renders `CoverPlayButton` with
`src={cover!}` — so a row with neither prop passes `undefined` into the cover
button. One of the two must be given.

| Mode | Leading slot | Idle | Hover | Playing | Playing + hover |
|---|---|---|---|---|---|
| `cover` | `CoverPlayButton`, 48px `rounded-xs`, `hoverGroup="song"` | cover | `bg-black/40` wash + white Play | wash + white 28px wave | wash + white Pause |
| `trackNumber` | `TrackNumberPlayButton`, 48px `rounded-md` | number in `text-base text-muted-foreground tabular-nums` | Play in `text-foreground` | 28px wave in `text-foreground` | Pause in `text-foreground` |

Both are a single stable DOM with four always-mounted layers crossfading on
`opacity` (`duration-150`) — nothing swaps in JSX, so no state change flickers.
Both bind their hover to the **row** (`group/song`), not the 48px thumb: the
play affordance appears as soon as the pointer is anywhere on the row.

`TrackNumberPlayButton` lives inside `song-list-item.tsx` rather than its own
file because nothing else uses it.

## The meta line is optional

The second line renders only when there is something to put in it:

```tsx
{(badge || artist || album || year) && (<div …>…</div>)}
```

That is what makes the album-detail row a clean single line: every track
shares the header's artist, album and year, so the host passes only
`trackNumber` + `title` + `duration` and the title sits vertically centred
in the 60px row. Pass a meta field in `trackNumber` mode only when a track
actually differs — a guest artist, say.

Order inside the line is `badge` · `artist` · `album` · `year`. The badge is
a `Badge variant="secondary"` and `shrink-0`; the two dots are `aria-hidden`
`shrink-0` spans so they are never the part that ellipses, and each one is
gated on there being something before it (`artist &&` before the album,
`(artist || album) &&` before the year).

## Priority disclosure — four steps by the row's own width

The row is a **named** `@container/row`, so what it shows depends on **its**
width, not the viewport's. Fields shed in priority order, least important
first. Tailwind v4's `@max-[N]` compiles to `@container (width < N)`, so each
step begins one pixel below the number:

| Row width | Shows | What dropped, and why |
|---|---|---|
| ≥ 380px | artist · album · year + duration | everything |
| 300–379px | artist · album + duration | `year` (`@max-[380px]/row:hidden`) — a year is the least informative field on a row that already shows the album |
| 260–299px | artist · album | `duration` (`@max-[300px]/row:hidden` on the trailing span) — the title and meta keep the space; time is the least critical thing after the three meta fields |
| < 260px | artist | `album` (`@max-[260px]/row:hidden` on the album span, dot included) — the artist is the one field that always stays, **when there is one**; see below |

Between the steps, when artist and album both show, the album span carries
`shrink-[2]` against the artist's default `1`: the album gives up two pixels
for every one the artist gives up, so the artist truncates last. Both are
`min-w-0 truncate`.

### Why this row measures itself, when almost nothing else does

This is the only component in the app with steps of its own, and it earns
them twice:

- In a [`SongRail`](../../src/components/app/song-rail.tsx) the row sits in a
  cell of `100% − 48px` (or a column fraction), so on a 320px phone it is
  **248px** wide where the same row in a plain list is 296. The cell is not
  monotonic in the page column either: the rail's own 692 and 1164 steps drop
  it back to 334 and 372.
- Beside the **docked playlist editor** the page column itself narrows with
  no rail involved — 294px at a 768px window, 288px on a 1440px laptop with
  the editor pulled out.

No prop passed down from a parent can describe both, which is why this is a
container query and not a `dense` flag. The name (`/row`) is not decoration:
an unnamed query resolves to the nearest container ancestor, which is how
`PlayerOverlay` once ended up measuring the design-system page's 1400px
wrapper instead of itself.

### Two exceptions in the code, both deliberate

**The duration step only applies to rows that have a meta line.** On album
detail the per-track artist/album/year would just repeat the header, so they
are not passed — and dropping the duration there empties the right-hand side
and hands 40px to a title that was not asking for it. Those rows keep it at
every width.

**The meta line goes when all of its fields have gone.** The artist page
passes album + year and no artist (the rows are already under that artist's
name), so below 260 both fields hide — and the line used to stand as an empty
20px band under the title. It now carries the matching hide step itself.

### Measuring this in the design system

The width chips on this section are the **row's own** steps, not the page
column's ladder — the default chips start at 304, so three of the four steps
here were unreachable in the very frame meant to show them. The numbers come
from `ROW_STEPS` in the component. Note that the chip sets the row's OUTER
width while a container query reads the CONTENT box, and the row has 8px of
padding a side: the frame adds that back (and goes one pixel under the bound,
since `@max-` is exclusive) so each chip shows the state it is named for.

## The primary action is play — and how nested controls stay out of it

The whole row is `cursor-pointer` with an `onClick` that calls `activate()`.
Activation fires `onPlay` and, when the row is **uncontrolled**, flips a
local `playing` flag:

```tsx
const controlled = playingProp !== undefined
const playing = controlled ? playingProp : localPlaying
const activate = () => { if (!controlled) setLocalPlaying(p => !p); onPlay?.() }
```

Pass `playing` in the app — the global player owns it, so exactly one row
shows the wave and playing another row stops this one. Every host does:
`playing={isThisAlbumPlaying && player.track?.title === t.title}` and an
`onPlay` that toggles when it is already the current track and loads it
otherwise. Omit `playing` only in a self-contained demo, where the local
toggle makes the row work on its own.

The row click is guarded once, for everything:

```tsx
if (target.closest("button, a")) return
activate()
```

| Nested thing | Element | On tap |
|---|---|---|
| Cover / track number | `<button>` | calls `activate()` itself — same toggle, one place |
| Title, artist, album text | `<button>` each | its own `on…Click`; never plays |
| ♥ | `LibraryHeartButton` → `Button`, and `stopPropagation` by default | toggles the library; never plays |
| ⋯ trigger, ⓘ | `Button` | opens the menu / `onInfo`; never plays |
| Duration | plain `<span>` | **falls through to the row and plays** — it is text, not a control |
| Meta gutter, the veil | `pointer-events-none` / not a button | falls through and plays |

No control needs its own `stopPropagation` for the guard to work — being a
`<button>` is enough. The heart still stops propagation because
`LibraryHeartButton` is also dropped into non-row surfaces.

The title, artist and album are `<button>`s **whether or not** a handler was
passed: a title without `onTitleClick` swallows the tap and does nothing
rather than playing. Every text link underlines on hover and on
`focus-visible` (`underline-offset-[3px]`, 1px thickness) and is `truncate`,
so a long title ellipses rather than wrapping.

## Now-playing

```tsx
playing ? "bg-muted" : "bg-background hover:bg-muted"
```

A playing row is `bg-muted` **at rest** — the same surface an idle row only
reaches on hover — so the current track is marked even when the pointer is
elsewhere. The colour is the `--muted` token (`--muza-neutrals-50` in light,
`--muza-neutrals-900` in dark; `app.css`), not an accent: the title keeps
`text-foreground`, nothing turns primary. The second signal is the leading
slot's wave (white on the cover's dark wash; `text-foreground` on a track
number). A filled heart is `fill-primary-text text-primary-text`, but that
is library state, not playback state.

`transition-colors` on the row crossfades background → muted.

### Two gradients have to know about it

Both fading panels on the right paint a gradient that ends in the row's
background colour. If the row is `bg-muted` and the gradient ends in
`--background`, it paints a lighter block over a darker row — a visible seam.
So the always-on veil and the compact touch fade both switch their end
colour with `playing`:

```tsx
playing
  ? "bg-[linear-gradient(to_right,transparent_0px,var(--muted)_24px)]"
  : "bg-[linear-gradient(to_right,transparent_0px,var(--background)_24px)] group-hover/song:bg-[linear-gradient(to_right,transparent_0px,var(--muted)_24px)]"
```

The hover-only icon panel always ends in `--muted`, because it is only ever
visible while the row is hovered, and a hovered row is `bg-muted` either way.

## The trailing cluster — rest, hover, and the veil

The default (non-`compact`) cluster is `flex items-center gap-0.5 shrink-0
relative px-2 py-1.5`. At rest it holds only **♥ + duration**, so the title
and meta get every leftover pixel and nothing truncates early. Two absolutely
positioned layers hang off its left edge:

- **The veil** — `absolute right-full top-0 bottom-0 w-6 pointer-events-none`,
  a 24px gradient from transparent to the row colour. The meta text dissolves
  into the row just before the icons instead of ending in an ellipsis under
  them. The row is `overflow-clip`, so nothing pokes past the rounded corner.
- **The hover panel** — `absolute right-[calc(100%-6px)] top-1/2
  -translate-y-1/2 … pl-8 pr-0`, `opacity-0 pointer-events-none` until
  `group-hover/song`. It carries ⋯ and ⓘ on its own gradient (transparent →
  `--muted` over 32px, then solid), so the icons mask whatever meta text they
  cover without pushing layout. The `6px` is tuned so ⓘ's right edge sits 2px
  left of the heart. `pointer-events-none` at rest means the invisible panel
  never steals a click meant for the meta text.

Hover order, left to right: **⋯ · ⓘ · ♥ · duration**. All four buttons are
`Button variant="ghost" size="icon-sm"` (32px around a 16px glyph, with the
button's `after:-inset-1` hit-area halo). The ⋯ opens a `DropdownMenu` aligned
`end` with `sideOffset={6}`, hanging off the row's right edge.

The duration is `text-right min-w-10 text-xsmall font-light tracking-[0.02em]
text-muted-foreground leading-4` — the meta line's type on a 40px minimum
track so columns of times line up. No tabular sizing beyond that.

## `compact` — the swipe-rail cluster, chosen by pointer

`compact` is for rows inside a sideways-scrolling
[`SongRail`](../../src/components/app/song-rail.tsx) (Artist › Top Songs; Search › Songs when it has 6+ hits), where the row is a
third of a rail column and every pixel is tight. It drops the duration
**unconditionally** and picks a cluster by pointer capability — both are in
the DOM and CSS media queries hide one:

- **Fine pointer** (`[@media(hover:none)]:!hidden` on the mouse cluster): the
  same three icons as the default row — ♥ always, ⋯ + ⓘ floating in on hover
  on the same 32px gradient panel. No duration.
- **Coarse pointer** (`[@media(hover:hover)]:!hidden` on the touch cluster):
  hover does not exist, so a single **⋯** sits `absolute inset-y-0 right-0` on
  a narrow 28px fade (`pl-7 pr-1`) and opens a `Sheet side="bottom"`
  (`rounded-t-2xl`) with the full action set. The fade lets the meta text
  release behind the button instead of hard-clipping. The wrapper is
  `pointer-events-none` with `[&_button]:pointer-events-auto`, so the fade
  itself never blocks a tap on the row.

The `!` on both `hidden`s beats Tailwind's base `flex` regardless of rule
order. The shared conventions are in [Responsive & Pointer](responsive.md).

The sheet's header is the song itself — 44px cover (`size-11 rounded-xs`),
title, then `artist · album` in `text-small text-muted-foreground` — and its
body is a column of `SheetAction`s, each a full-width `button` wrapped in
`SheetClose` so picking one dismisses the sheet. Items, top to bottom: Save /
Remove from library · Add to playlist · Go to artist · Go to album · Share… /
Copy link · Show credits · Report (destructive). The gated ones follow the
same `hide…` flags as the desktop menu.

## One song menu everywhere

The ⋯ shows `SongMenuItems`, exported from the same file so a
`SongListTable` kebab can show the identical menu. Every song surface gets
the **same** items; a surface hides only what is redundant there:

```tsx
<SongListItem … hideGoToAlbum   />          // album page: you are on it
<SongListItem … hideGoToArtist  />          // artist page's Top Songs
<SongListItem … hideAddToPlaylist />        // inside your own playlist
```

`SongMenuItems`: Share… (native) / Copy link · Save / Remove from library ·
Add to playlist · ─ · Go to artist · Go to album · Show credits · ─ · Report.
"Go to artist" and "Go to album" need both their click handler **and** the
flag clear — a row with no `onAlbumClick` has nowhere to go. Share, library,
credits and report are self-wired: `useShare`, `useUserLibrary` +
`useLibraryToggle`, `useCredits`, and a default "Reported" toast when
`onReport` is omitted, so every row offers all of them. Library state is
keyed by `slugify(`${title}-${artist}`)` — the same id the heart uses, so
the menu's Save/Remove and the ♥ never disagree.

"Show credits" opens the credits dialog for `album` when one is passed and
falls back to `onInfo` otherwise. That is why the album-detail host, which
deliberately passes no `album`, passes `onInfo={() => credits.open(…)}`
instead.

`menuItems` replaces the whole set. It is a legacy escape hatch; prefer the
flags so the menu stays one menu (see "Media menus" in `DESIGN_SYSTEM.md`).

## Draggable

Every row is `draggable`. `onDragStart` sets the song's metadata
(`{ id, title, artist, album, cover, duration }`) as JSON under
`SONG_DRAG_TYPE` — the private `application/x-muza-song` MIME type — with
`effectAllowed = "copy"`, so only the playlist-edit drawer accepts it and
unrelated drop targets ignore the drag.

## Spacing and type

| Part | Value | Why |
|---|---|---|
| Row | `flex items-center gap-3 rounded-md pl-2 pr-2 py-1.5 overflow-clip` | 8 / 8 / 6px; `overflow-clip` so the veil and hover panel clip at the 10px corner |
| Row height | 48px thumb + 2 × 6px = 60px | fixed by the thumb, as in Media List Item |
| Thumb | 48px (`size-12`), `rounded-xs` cover / `rounded-md` number tile | cover art keeps its corners |
| Title | `text-xsmall font-normal leading-5 text-foreground truncate` | 17px, one line |
| Meta | `text-xsmall font-light tracking-[0.02em] text-muted-foreground leading-5` | same 17px, lighter weight and colour carry the hierarchy |
| Duration | as meta, `leading-4 min-w-10 text-right` | 40px track |
| Text column | `flex-1 min-w-0 flex flex-col gap-0.5` | may shrink to zero; 2px between the lines |
| Cluster | `gap-0.5 px-2 py-1.5` | 2px between icons |

Both lines are the same 17px `text-xsmall`, as on Media List Item — two sizes
inside a 60px row read as busy.

## Same anatomy as Media List Item — different job

| | Song List Item | Media List Item |
|---|---|---|
| Row tap | toggles play | navigates; a song plays only without `onOpen` |
| Hover group | `group/song` | `group/row` |
| Right padding | `pr-2` | `pr-1.5` |
| Trailing | ♥ + duration; ⋯ + ⓘ on hover; "…" sheet on touch (`compact`) | ⋯ menu or a bespoke `trailing` |
| Meta disclosure | four steps: 380 / 300 / 260 | one step at 240 |
| Overflow | `overflow-clip` + fading veil | plain truncation |
| Draggable | yes (`application/x-muza-song`) | no |

## Where it is used

- Artist › Top Songs (`artist-profile-view.tsx`) — `compact`, cover mode,
  inside `SongRail`.
- Album detail (`album-detail-view.tsx`) — `trackNumber` mode, no meta,
  `hideGoToAlbum`, credits via `onInfo`.
- Playlist detail (`playlist-detail-view.tsx`) — cover mode, own playlist
  hides "Add to playlist".
- Library › Songs (`library-songs-view.tsx`) — cover mode from the saved-song
  store.
- Search › Songs (`search-results-view.tsx`) — `compact` inside `SongRail`
  for 6+ hits, the full row in the ≤ 5 list.

## Open questions

- song-list-item.tsx:19–20 (header comment) claims the duration is `text-small text-muted-foreground` · source renders it `text-xsmall` (song-list-item.tsx:514). Documented above as `text-xsmall`.
- song-list-item.tsx:341–342 says "year drops first (≤380), then album (≤260)" and :511 says the duration is "Dropped on very tight rows (≤300)" · the variants are `@max-[380px]` / `@max-[260px]` / `@max-[300px]`, which Tailwind v4 compiles to `@container (width < N)` — exclusive, so a row exactly 380px wide still shows the year. The table above matches the compiled CSS; the source comments are off by one.
- song-list-item.tsx:99–101 documents `onAddToLibrary` as the "Always-visible quick action — saves the song to the library (Heart)" · the visible heart is `LibraryHeartButton` (song-list-item.tsx:410, 508), which never calls `onAddToLibrary`; the only caller is `handleSongLibrary` (song-list-item.tsx:238), reached from the compact touch sheet's first action (song-list-item.tsx:440). Documented above without that claim.
- The title is a `<button>` whether or not `onTitleClick` is passed (song-list-item.tsx:333–339) · no `SongListItem` host passes `onTitleClick` (the `onTitleClick` hits in `src/components/app` are all on cards), so in the app the title swallows the tap and does nothing. Documented above as observed.
- The ⓘ button calls `onInfo` directly (song-list-item.tsx:498) while the menu's "Show credits" uses `showCredits` — `credits.open(slugify(album))` when `album` is set, else `onInfo` (song-list-item.tsx:228). A cover-mode row with an `album` but no `onInfo` (playlist, library, search) has a working "Show credits" and an inert ⓘ. Recorded as observed; unclear whether ⓘ should also fall back to the album credits.
- song-list-item.tsx:527 claims a "44px+ hit target" for `SheetAction` · the classes are `px-3 py-3 text-base` with no explicit min-height; the 44 depends on `text-base`'s line height, which is not stated in the file.
