---
title: Playlist Card
source: src/components/ui/playlist-card.tsx
related: [album-card, artist-card, card-rail, detail-more-button, responsive]
usage:
  - Library › Playlists | /?page=Playlists
  - Artist › Curated Playlists | /?page=Artist
---

A `PlaylistCard` is a 2×2 cover collage over a title and a `N Songs · By …`
byline. It follows the [Album Card](album-card.md) model exactly — the cover
and the title open the playlist, the hover cluster plays and saves without
navigating — and adds one link: the owner. `PlaylistCreateCard` is the "+"
tile that leads the user's own grid so creating a playlist is a peer to
opening one.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Card | `group/playlist flex flex-col gap-1 text-left w-full min-w-0` | no width of its own; `gap-1` (4px) is the one rhythm from cover to title to byline |
| Cover | `relative aspect-square w-full overflow-hidden cursor-pointer select-none`, driven by `useLongPress` | no `touch-action` on purpose — a swipe along a rail usually starts on artwork, and `touch-none` here stopped the rail panning (see [Album Card](album-card.md#the-cover-carries-no-touch-action)) |
| Collage | `grid size-full grid-cols-2 grid-rows-2` of the first **four** `covers`; fewer than four → one `<img>` of `covers[0]` filling the square | four tiles is the smallest grid that reads as "several albums" |
| Gradient | `bg-gradient-to-t from-black/45 via-black/10 to-transparent`, `opacity-0` → `group-hover` / `group-focus-within` | always black, not a token — the buttons over it are light-on-dark glass in both themes |
| Cluster | `absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between`, same hover / focus-within reveal; stops `pointerdown`, `pointerup` and `click` | a press on a button must neither open the page nor start the cover's long-press timer |
| Title | `<button>` · `text-xsmall leading-[18px] font-normal text-foreground text-left line-clamp-2`, underline on hover / focus, `pb-[6px] -mb-[6px]` | two-line clamp keeps card heights predictable; the padding gives the underline room under an `overflow: hidden` clamp |
| Byline | `flex items-center gap-1.5 min-w-0 text-xsmall font-light tracking-[0.02em] leading-[18px] text-muted-foreground` | the media-tile meta type — same 17px as the title, weight and colour carry the hierarchy |

The cluster buttons are the Album Card's: `COVER_BTN` = `border-0
bg-neutral-100/50 text-neutral-900 backdrop-blur-xs hover:bg-neutral-100`,
24px (`size-6`, 12px glyph) for the leading button, 40px (`size-10`, 16px
glyph) for Play. Why `border-0` and why fixed neutrals rather than tokens is
explained once, in [Album Card](album-card.md#cover-buttons-border-0-because-button-clips-its-background).

Figma: file `L9yw4Yaec9YtAXGxP8q4fu` › "Record Cover" — `19272:1584` /
`1639` Playlist default / hover, `19272:1606` / `1658` My Playlist (Edit
instead of the heart), `19272:1625` / `1629` Add (the create tile).

## Three states of the byline and the cluster

| | Leading cluster button | Byline | Menu's destructive row |
|---|---|---|---|
| Another user's playlist (`owner`) | ♥ `LibraryHeartButton` (`type="playlist"`, keyed `slugify(title)`) | `42 Songs · By Sarah K` — the name is a button → `onOwnerClick` | Report |
| Already saved (`inLibrary`) | nothing — the heart is dropped, "Remove from library" lives in the menu | as above | Report |
| Your own (`owned`) | Edit (`Pencil`) → `onEdit` | `42 Songs · By you` — plain text, not a link | Delete playlist (`onDelete`) |

The byline is **always** shown, so a mixed "All" grid is legible at a glance:
"By you" marks your own, "By {name}" marks a saved one — the cue Spotify and
Tidal use. `songCount` is formatted with `toLocaleString()` and the noun
follows the count (`1 Song`, `1,234 Songs`).

| Prop | What it does |
|---|---|
| `title` `covers` `songCount` | required; `covers` is 1–4 URLs |
| `owner` | the byline name; ignored when `owned` |
| `owned` | your own playlist — Edit replaces the heart, "By you", Delete replaces Report |
| `inLibrary` | saved — drops the heart, the menu shows "Remove from library" |
| `onEdit` `onDelete` `onReport` `onShowInfo` `onAdd` `onRemove` | menu / cluster handlers; a row only renders when its handler exists |
| `onGoToOwner` | defaults to `openArtist(slugify(owner))` for a non-owned playlist with an owner |
| `onGoToPlaylist` | off by default — the card *is* the playlist, a "Go to playlist" row would navigate to itself |
| `onTitleClick` / `onOwnerClick` | override the text destinations; the title falls back to opening the playlist |
| `onMore` | called after a long press on the cover; the host renders the sheet |
| `onPlay` | **declared but unused** — the card plays itself (below) |

## Usage

```tsx
// Library › Playlists — the create tile first, then the grid.
<div className="@container">
  <ul className="grid-cards">
    <li><PlaylistCreateCard onClick={() => createPlaylist.open()} /></li>
    <li><PlaylistCard title="Blue Note Essentials" covers={…} songCount={64} owned onEdit={…} /></li>
    <li><PlaylistCard title="Blue Note Late Night" covers={…} songCount={28} owner="Sarah K" onOwnerClick={…} /></li>
  </ul>
</div>
```

Used by Library › Playlists and the library's All tab, the artist page's
Curated Playlists rail, the playlist page's Similar Playlists rail, the Home
rails, and the Playlists shelf on search.

## The card is a nav surface; Play and Save are buttons

| Target | Action |
|---|---|
| cover — tap / click | `openPlaylist(slugify(title))` |
| cover — long press (450–500ms, 8px tolerance) | the playlist's own `DetailMenuSheetBody` sheet |
| title | open the playlist (or `onTitleClick`) |
| owner name | `onOwnerClick` |
| Play (hover) | the playlist's **first track**, context = the playlist title — never navigates |
| ♥ (hover) | toggles the library store; fills when saved; toasts Saved / Removed with Undo |
| ⋯ (hover) | `PlaylistCardMenu` — the shared playlist menu |

Play is self-contained: the card resolves `getPlaylistDetail(key).tracks[0]`
and hands it to the player. The legacy `onPlay` prop is deliberately not
called, so a host cannot turn Play back into a link. On mount the card
registers itself (`registerPlaylists`, idempotent, never overriding a richer
record) so a card synthesised from bare props still opens a real detail page.

## Hold it, and the playlist's own sheet comes up

A long press on the cover raises **`DetailMenuSheetBody`** — the same sheet the
playlist detail page and the list rows raise — not the card's ⋯ dropdown
rendered as a sheet. One menu shape per entity, wherever it was reached from;
the kebab keeps its anchored dropdown, which is the right shape for a mouse.

The card raises it **itself**. It used to call an `onMore` prop that no host
passed, so holding a playlist card did nothing anywhere in the app — the
affordance existed only in this document.

- **The hold is visible from the first frame.** `data-pressing` on the card
  becomes `scale: 0.98` and a slight darkening, so the 450–500ms wait reads as
  the card being taken rather than as a tap that missed.
- **A drag past 8px cancels it** and hands the gesture back to the rail, and
  the click that follows a completed press is swallowed — or the playlist
  opens underneath its own menu.
- **iOS's image menu has to be declined first**
  (`img { -webkit-touch-callout: none }`, globally), or Safari's own
  Share / Save to Photos sheet arrives on top of ours and takes the gesture.

The numbers are shared with the sheet drag — see [Gesture](gesture.md).

The tap is the browser's own `click`, forwarded by `useLongPress`, never one
synthesised on `pointerup` — the reasoning is in
[Album Card](album-card.md#the-tap-is-the-browsers-click-never-a-synthesised-one).

## One menu, keyed by slug

`PlaylistCardMenu` renders `PlaylistCardMenuItems`, which is
`DetailMenuItems kind="playlist"` — the same item list the playlist page's "…"
shows ([Detail Menu](detail-more-button.md)). Save / Remove is baked
store-bound on `libraryType="playlist"`, `libraryId=slugify(title)`, so every
card offers it without the host wiring `onAdd` / `onRemove`; `owned` routes
the destructive row to `onDelete` instead. The menu has "Go to owner", never
"Go to artist": a playlist has an owner. The ⋯ trigger is a styled native
button rather than a `Button` (`cover-card-menu.tsx`) to avoid a nested-button
edge case in the menu primitive.

## `PlaylistCreateCard`

```tsx
<PlaylistCreateCard onClick={…} label="Create New Playlist" />
```

A `<button>` · `group/create flex flex-col gap-1 text-center w-full min-w-0
rounded-lg`, the same focus ring as the cards. The tile is
`aspect-square rounded-xs bg-muted/60`, tightening to `bg-muted` on hover,
with a `size-12 rounded-full bg-foreground text-background` disc holding a
`size-5` plus that scales to 1.04 on hover. The label is
`text-small font-normal leading-5 text-foreground truncate`.

## Sizing

The **column** decides, through the parent — a `.grid-cards` track or a
[Card Rail](card-rail.md) `<li>` — exactly as for Album Card. Fixed, no steps
of its own. Card Rail's `mobileGrid` hides an Album Card's year below a 560px
column; a Playlist Card carries no `data-card-year`, so its byline is not
touched there.

## Missing artwork

There is **no** branded fallback here: `CompositeCover` renders raw `<img>`s.
With fewer than four covers the single tile is `covers[0]`; with an empty
array that is `undefined`, and the square is blank. Album Card and Media List
Item go through `CoverArt`; see the open questions.

## Artwork and links

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius.

**Text that navigates carries `link-underline`** — the line is a background gradient whose width runs 0 → 100% over 140ms, so it wipes in from the left and retracts the same way. `text-decoration` cannot be drawn, only faded. Title and owner are the two links.

## Open questions

- playlist-card.tsx:18–20 (header) says an own playlist's subtitle is
  "1234 Songs" with **no** owner line, per Figma · source always renders the
  dot and "By you" (playlist-card.tsx:217–219), and DESIGN_SYSTEM's Library
  views rule agrees with the source. Documented as the source.
- A non-owned card with no `owner` renders `42 Songs ·` with a trailing dot
  and nothing after it — the dot is unconditional (playlist-card.tsx:217)
  while the name is gated on `showOwner`. Every current host passes an owner
  or `owned`, so it has not shown; is that the intended empty state?
- `CompositeCover` has no `CoverArt` fallback (playlist-card.tsx:240–264),
  against DESIGN_SYSTEM's "every piece of release artwork goes through a
  branded fallback" rule; an empty `covers` renders a blank square.
- `PlaylistCreateCard`'s label is `text-small` (19px,
  playlist-create-card.tsx:71) beside card titles at `text-xsmall` (17px) in
  the same grid.
- ~~a long press calls `onMore`, which no host passes, so it does nothing~~ ·
  **answered by the touch pass.** The card raises the sheet itself now, so it
  no longer depends on a host wiring a prop — see "Hold it" below.
- `onPlay` is declared (playlist-card.tsx:55) and never read (:104–108).
