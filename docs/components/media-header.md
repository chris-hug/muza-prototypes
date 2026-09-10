---
title: Media Header
source: src/components/ui/media-header.tsx
related: [artist-header, detail-more-button, card-rail, status-badge, purchased-badge, responsive]
usage:
  - Album detail | /?page=Album
  - Playlist detail | /?page=Playlist
---

The header of an album or playlist page — cover, title, the owner · type ·
year line, then the buy CTA, Play / Shuffle and the action cluster. One
component with four variants (`album` · `my-album` · `playlist` ·
`my-playlist`); the owned variants swap the save heart for Edit, and the
playlist variants render a 2×2 composite cover with no format.

## Anatomy

| Part | What it is | Tokens |
|---|---|---|
| Cover | a `268px` square from 560 up (`rounded-xs shadow-sm`); below 560 it is centred and inset — `calc(100% − 72px)`, capped at 320 — so the floating detail bar's back chevron and "…" sit in the gutters *beside* its top rather than on it | — |
| Composite cover | when `covers` has **four** entries (playlists), a `grid-cols-2 grid-rows-2` of them; with fewer it falls back to the single `cover`, which is why playlists must always pass `cover` too | — |
| Title | `MarqueeText` as the page `h1` — one line, never wraps; when it does not fit it scrolls back and forth so the whole name is readable | `text-large` stacked, `text-2xlarge` from 560; `font-semibold leading-[1.2] text-foreground` |
| Meta line | owner (avatar `size-6 min-w-6 rounded-full` + name), the type (`Disc3` + format, or `ListMusic` + "Playlist"), the year — or the playlist's "42 tracks · 3h 12m" passed in `year` — then the visibility `StatusBadge` on owned variants and the `PurchasedBadge` when `purchased` | `text-small font-normal leading-none text-muted-foreground`; the name `font-medium truncate`; owner `hover:text-foreground` |
| CTA | `hasBuyingOption` → **Unlock All Songs – $x** (`outline-primary`, `lg`); else `downloadable` → **Download MP3** (`outline`); else `addDownloadPrice` → **Add download – $x** (`outline-primary`); else nothing. Full width of its column in both tiers | — |
| Play · Shuffle | Play is the `default` `lg` button with the icon only (`px-0 min-w-12`), flipping to Pause with `aria-pressed` when `playing`; Shuffle is the shared `ShuffleToggle` in `secondary`, `min-w-12 h-12`, lit `primary` when `shuffleActive` — the same pop / halo the player bars use | — |
| Action cluster | 48px `outline` `icon-lg` buttons (`size-12`): the heart (a store-bound `LibraryHeartButton` when `libraryId` is set, otherwise a plain Heart → `onAdd`) **or** Edit when owned; `ShareButton`; Info (albums only); the "…" `DetailMoreButton` | `variant="outline"` carries the glass — `bg-background/20 backdrop-blur-lg border` |

The `min-w-12` on Play, Shuffle and the heart is why a `flex-1` button on a
tight row never squeezes narrower than a circle; `min-w-6` on the owner
avatar is why it never becomes an oval — the name yields (`min-w-0
truncate`) instead.

## Two action rows, one set of intents

Below 560 the actions are **one full-width row**: Play · Shuffle · a third
slot · Info.

- The third slot is the heart for a release or someone else's playlist,
  **Add music** on your own playlist when `onAddMusic` is passed (filling it
  is the job that matters there; Edit is already a quick-action tile in the
  "…" sheet, and a pencil beside Add music would split one intent in two),
  and the Edit pencil on an owned album.
- Info is omitted for playlists — they have no release credits.
- Share and everything else live in the top bar's "…", which the page
  publishes to the mobile chrome (see [Detail Menu](detail-more-button.md)).

From 560 up the row is CTA + Play / Shuffle in a **234px column** on the
left and the cluster on the right. The "…" is pinned right and **stays in
every horizontal tier**; the rest of the cluster — heart / Edit, Share,
Info — appears only from 780.

Info opens the credits dialog for albums (`useCredits().open(slugify(title))`
— the provider has a no-op default, so no wiring is needed); a playlist's
Info is whatever `onInfo` does. The "…" gets the same library binding as the
heart, so the menu's Save and the heart flip together, and its navigation
routes to `onOwnerClick` — as "Go to artist" for a release, "Go to owner"
for a playlist.

## Usage

```tsx
<MediaHeader
  variant="album"
  cover={ALBUM.cover}
  title={ALBUM.title}
  owner={ALBUM.artist}
  ownerAvatar={ALBUM.artistAvatar}
  format={ALBUM.format}
  year={ALBUM.year}
  onOwnerClick={() => openArtist(slugify(ALBUM.artist))}
  libraryType="album" libraryId={ALBUM.id} libraryName={ALBUM.title}
  playing={isThisAlbumPlaying}
  shuffleActive={player.shuffle}
  onPlay={…} onShuffle={…}
  hasBuyingOption={!isPurchased && !!ALBUM.buyingPrice}
  buyingPrice={ALBUM.buyingPrice}
  purchased={isPurchased}
  downloadable={isDownloadable}
/>
```

A playlist passes `covers` (four), `year={PLAYLIST.trackMeta}`, no `format`,
and `variant={owned ? "my-playlist" : "playlist"}` with `onEdit` /
`onAddMusic` when owned. Back navigation is **not** here: each detail page
draws its own chevron in the gutter, so the header stays the identity and
the actions.

Prefer the library binding over `onAdd`: the plain heart is a snapshot, and
the card hearts on the same page can go stale against it. The binding needs
a `UserLibraryProvider` above (the app shell mounts one).

## Sizing

The header measures the **column** — it is a bare `@container` on the page
shell's width — and steps twice:

```text
< 560   stacked     cover on top, centred; title text-large; one action row
≥ 560   horizontal  cover left at 268, content right; h-[300px] py-4;
                    CTA + Play / Shuffle in a 234px column; "…" pinned right
≥ 780   full        heart / Edit + Share + Info reappear beside the "…"
```

**780** is arithmetic: the left column (234) + gap (12) + the cluster (216)
must fit inside `column − 300` (the cover and its gaps), plus a small
buffer. It is the number the sidebar's auto-collapse is derived from —
`1069 = 780 + 208 + 80 + 1` — so the expanded sidebar gives way at exactly
the window where it would push the header out of this tier.

**560** is the number the chrome gate is derived from — `608 = 560 + 2 × 24`
— and the width [Card Rail](card-rail.md) switches from swipe-peek to grid
at, so the two flip together. Read it carefully: at a 608 window the icon
rail arrives and the column drops to 508, so the header stays **stacked
until a 660 window** (`660 − 52 − 48 = 560`). Both constants live in
`use-media-query.ts` and must match the `@min-[560px]` / `@min-[780px]`
class literals here; nothing executable checks that.

The **meta line measures its own box** — `@container/meta` — because its
width is not the column's: in the horizontal tier the fixed cover and its
gaps make it `column − 300`. Its one step is the year, `@max-[320px]/meta:
hidden`, which fires on 320–343px phones (stacked) and in the icon-rail
band where the column sits at 560–619 (windows 660–719). A second step,
the type chip below 240, was removed: this line is never narrower than 260
(`560 − 300`) in the horizontal tier or 296 (a 320 phone) stacked, so it
could never fire. The owner is the highest priority and only truncates once
the year is gone.

In the frame the window chips read: 375 → 351 stacked · 584 → 536 stacked ·
608 → 508 stacked · 768 → 692 horizontal, "…" only · 1069 → 781 full.

## Behaviour

- **Play** and **Shuffle** are the host's: the Album page treats Play as
  pause / resume when this album is already the source and otherwise starts
  track 1; turning Shuffle on also starts playback, since shuffling implies
  playing, so Play flips to Pause. Both read the player store back through
  `playing` and `shuffleActive`.
- **The heart** is the live `LibraryHeartButton` — filled when saved,
  toggling with the toast every save affordance fires.
- **Visibility** on `my-*` variants is the interactive `StatusBadge`; the
  pick comes back through `onVisibilityChange`.
- **Purchased**: the page drops the buy CTA (`hasBuyingOption={false}`) and
  the inline badge carries the state; the download tier surfaces
  **Download MP3** in the freed slot, a stream-tier purchase can offer
  **Add download – $x** via `addDownloadPrice`.
- The title's marquee only runs when the text overflows its line.

## Artwork

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. On the cover and on every tile of the 2×2 playlist collage, plus the `size-6` owner avatar beside the meta line.

## Open questions

- media-header.tsx:3 says the header is "256px-tall" · the horizontal tier
  is `h-[300px]` plus `py-4` (media-header.tsx:301), so the box is 300 and
  the cover 268
- media-header.tsx:86–88 tells the host to set `hasBuyingOption={false}`
  whenever `purchased` is true · nothing enforces it: `ctaButton` checks
  `hasBuyingOption` first (media-header.tsx:235), so a purchased album that
  still passes it shows "Unlock All Songs"
- `onMore` is in `MediaHeaderProps` (media-header.tsx:118) and destructured
  · it is never used — the "…" is the `DetailMoreButton`, which takes its
  own props
- the `h1` is `font-semibold` (media-header.tsx:323) · DESIGN_SYSTEM.md › "Font
  weight rules" allows semibold "only H1 and H2", so it is permitted, but the sibling
  `ArtistHero` `h1` is `font-medium` (artist-hero.tsx:84) — the two page
  titles disagree on weight
- responsive.md:266 says four components measure their own box and "each
  names its container" · this header's meta line is the named
  `@container/meta`, but the header root is a bare `@container` measuring
  the column — a fifth "technically" per responsive.md:279, and the note
  there is the only place that says so
