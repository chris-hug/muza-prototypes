---
title: Credits Dialog
source: src/components/app/credits-dialog.tsx
related: [dialog, media-header, detail-more-button, album-card]
usage:
  - Album detail › ⓘ button / “…” → Show credits | /?page=Album
  - Any album card / song row → Show credits | /?page=Albums
---

`CreditsDialog` is the release metadata behind every "Show credits" action
and the MediaHeader's ⓘ: a compact header (the ⋯ sheet's: thumb, title, main artist, year · label) over **Credits**
and **Notes**. One dialog per album, and two readings of its Credits: the
**album's** (every musician once, roles merged — the compact overview of the
lineup) when the album's credits are asked for, **track by track** (each
song under a sticky bar, with the people on that take) when a song's are. A
playlist has no release credits.

Credits are a Muza strength — the catalogue is iTunes, MusicBrainz and Discogs
together — so the dialog is built to show a full record the way a jazz listener
reads a sleeve: who played what, on which track, where and when it was
recorded, who produced and engineered it. Benchmarked against Spotify, Apple
Music, Tidal and Qobuz (notes in the Superlist task); Qobuz's structure — a
compact header, Overview / Credits / Review, one row per person with an avatar —
is the model, with its one data bug avoided (below).

**Two layouts are live while they are compared:** `"tabs"` (the default) and
`"page"`, the same sections stacked in one scroll. The live dialog reads
`?credits=page` from the URL. One of them goes when the decision is made.

## Anatomy

```tsx
<DialogContent className="md:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-[88svh] md:h-[min(85vh,44rem)]">
  <CreditsContent
    credits={credits}
    focusTrack={findTrack(credits, title)}   // track by track, at that song; undefined = the album's overview
    layout="tabs"            // or "page"
    heading={<DialogTitle className="sr-only">Credits</DialogTitle>}
    onArtist={name => go(() => openArtist(slugify(name)))}
    onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
    bodyClassName="min-h-0"
  />
</DialogContent>
```

| Part | What it wears | Why |
|---|---|---|
| Header | the ⋯ sheet's identity block (`DetailMenuSheetBody`): `size-18 rounded-xs art-edge` thumb · title `text-small font-medium` · artist `text-small text-muted-foreground` · year · label `text-2xsmall` where the sheet has its content-type badge (the sheet's layout, the dialog's two sizes — see Type). Gutter `px-3`, `md:px-6` | the credits are reached from that sheet's "Credits" tile, so both open on one header instead of two. It replaced a 3:2 cover that spent a third of a phone on the artwork the reader just came from; before that, four equal label/value rows where the title weighed as much as a recording date. **No Album / EP / Single badge:** the sources disagree, and for old jazz the type is a modern label applied afterwards — MusicBrainz editors give a 1940 set of 78s today's categories, Discogs records the format of each pressing (78 RPM, 10", LP), iTunes mostly says "Album" and puts "– EP" in the title. Year and label are what every source agrees on. The catalogue number is an Overview fact. The `heading` slot is an `sr-only` `DialogTitle` ("Album credits") — named for screen readers, not drawn |
| Back (track by track) | `Button ghost sm` "‹ All album credits" on its own line above the identity block, `-ml-2` so the chevron sits on the thumb's edge. Also returns to the Credits tab | the button at the end of the list was the only way back — a long scroll on a ten-track album. Its own line, as a dialog back control: inline it would indent the title |
| Tabs | `TabsList size="sm"` full width: Credits · Notes (Notes only with text). Credits is the default. There was an Overview tab; its facts now sit in the album's Credits (Release, below) | "Show credits" is what was asked for. Header and tab bar hold; only the panel scrolls, so switching tabs never moves the bar. The panel **fades** under the bar: a veil in `--popover` over the content column (clear 15px, eased out to 50px), shown only once the panel is scrolled — at rest there is nothing to fade, and padding the panel by 50px left a band of empty space, so the resting gap is 24px. Not a `mask-image` on the scroller — a mask fades the scrollbar too, and it dissolved with the rows; the veil stops at the gutters and the scrollbar stays whole. The scrollbar is thin, `--muted-foreground` on a clear track. A hard cut left a row sliced in half |
| Release | a `dl` inside the album's Credits, between the people and the Tracks, label `text-muted-foreground`, value `text-foreground`: Recorded (date + studio) · Released · Label (label · catalogue number) · Tracks (count · total minutes) | the session facts a sleeve prints; a row is left out when the catalogue has no value |
| Credits — album | sections Personnel · Composition · Production & Engineering · Artwork & Notes, `text-small font-medium` titles; one row per person in a `divide-y divide-border/60` list; then **Tracks** | the overview of who is on the record — the reading track by track replaced it once and lost exactly that. Opens from the album's ⓘ and the ⋯ "Credits" tile |
| Tracks (album) | number · title · duration · chevron; each row a `<button>` (`min-h-11 py-3`) that switches to track by track, at that song. The number sits centred in a `w-10` column, the avatar's | the key to "(1, 2)" and the way into a song's credits. On the person row's grid, so titles start on the names' line |
| Credits — track by track | one section per track under a sticky bar, then that track's people (`peopleOnTrack`: roles without track numbers plus those naming it, numbers dropped); Production & Engineering and Artwork & Notes follow ONCE under bars of their own; "All album credits" `Button secondary lg` at the end switches back | Qobuz's layout, for a song's question "who is on this take?" — Dolphy is "Bass clarinet" under Hat and Beard, "Flute" under Gazzelloni. Production and the sleeve belong to the record |
| Track bar | `sticky top-0 h-12`, a filled band: `bg-secondary`, the song playing `bg-secondary-hover` with the wave in its button; a 12px fade below. Section bars (Production, Artwork) stay unfilled, `bg-popover`. The band, not a type size, is what tells a song title from a section title and a name — all three are `text-small`, and on one ground they read alike. The whole bar plays the track (or pauses the one playing), with the album row's hover — a `--hover-fill:var(--secondary-hover)` circle grown from the pointer by `press-ripple` — and a pointer cursor; section bars (Production, Artwork) stay inert. `-mx-2 pl-1` in the dialog, so the button's centre lands on the avatars' and the title on the names' edge | rows scroll under the bar instead of under the tab strip, so the bar is the edge and carries the fade; the veil is off on this tab. Same button and playing row as the album page, so playing reads the same in both |
| Person row | `PersonAvatar` `size-10` (portrait, else initials) · name `text-small` (a link) · roles `text-2xsmall text-muted-foreground` · `LibraryHeartButton type="artist"` `icon-sm touch-target` | **one row per person, every role merged** — a name appears once per album ("Tenor saxophone, Composer"). A role can name its tracks: "Bass clarinet (1, 2), Flute (3)", the liner-note convention, instead of a credits block per track repeating the same five names. Every person with an artist page gets the link and the heart. **Without a page** (`profile: false` — sleeve designers, photographers, liner-note writers) the name is plain text and there is no heart; the row keeps its avatar, name and roles, so it reads as credited, not broken. Out to Lunch marks Reid Miles and A. B. Spellman to show the state |
| Initials | first letter of the first and the last word, dots dropped — "Mark Ernestus" ME, "A. B. Spellman" AS | sidemen rarely have a photo, so initials are the common case and wear the portrait's circle, size and `art-edge`. Names are stored as read ("Mark Ernestus"), never as "Ernestus, Mark": Qobuz splits a sort-name at the comma and shows the first name as a role |
| Notes | `text-small leading-relaxed`, "— Muza" under it | prototype copy written for the three curated albums, not quoted liner notes |
| `showCover` | `false` drops the thumb and the side padding | the player shows these credits in place of its artwork, beside its own thumb |
| Links | a value with a handler is a `<button>` carrying `link-underline`; without one it is plain text | title (when `hasAlbumDetail`), main artist and every person navigate. No handler, no underline, no tab stop. `CreditsDialogPreview` passes no-op handlers so the design-system frame shows the links without navigating away |

## Type

**Two sizes in the whole dialog.** `text-small` (19px) for content: title,
names, section titles, release facts, Tracks, Notes. `text-2xsmall` (15px) for
everything secondary: roles, year · label, the tab labels, initials. Rank
comes from weight (`font-medium` for the title and section titles) and colour
(`text-muted-foreground`). It had four — 21 · 19 · 17 · 15 — and read as busy
before a single name was read.

## Usage

Mounted **once** by `CreditsProvider` (in the app shell; the design-system
page mounts its own). Any descendant opens it by key:

```tsx
const credits = useCredits()
<Button onClick={() => credits.open("a07")}>Show credits</Button>
<Button onClick={() => credits.open("a06", "Gazzelloni")}>Song credits</Button>  // same dialog, at track 3
```

**Where it opens:** a song's ⋯ "Show credits", a track row's ⓘ on the album
page and the player open **track by track at that song** — its bar stuck at
the top (`focusTrack`). The album's ⓘ and the ⋯ sheet's "Credits" tile open
**the album's overview**. Inside, a Tracks row and "All album credits" switch
between the two (state in `CreditsContent`); the provider keys the dialog by
the request, so a second "Show credits" starts fresh. The player keys the body by the playing title, so the next
track lands on its own section. The jump is measured, not `scrollIntoView`
(which would scroll the sheet and page too), and runs again after the open
transition; it marks the scroller `data-keep-scroll` so a phone sheet's
detent grows the sheet without throwing the reader back to track 1 (see
`dialog.tsx`).

Outside a provider `open` is a no-op, so menus that bake it in never crash.
Data comes from `getCredits(albumKey)` in `album-catalog`. Three albums carry a
full record in `album-credits.ts` (A Love Supreme, Blue Train, Out to Lunch —
the last one because the instrument changes with the track); the rest derive
one row per person from the album's lineup. Production fills the same shape
from iTunes, MusicBrainz and Discogs.

`CreditsDialogPreview albumKey` renders `CreditsContent` inline in a
bordered `bg-popover` card with a plain heading and no handlers — a static
render for the design system.

## Sizing

Reads the **window** at **768** through the base dialog: a bottom sheet
below (`max-h-[92vh]`), a centred `md:max-w-xl` (576px, the purchase and checkout width) modal from there
(`md:max-h-[85vh]`). `p-0` lets the cover header bleed to the edges; the
metadata band pads itself. No column or box step. The preview reads
`useIsMobile()` and drops to full width with top corners only at a phone
chip, so a 375 frame shows the sheet shape.

## Behaviour

- Opening sets the key; `Dialog open={!!credits}`. Closing (✕, backdrop,
  `Escape`) clears it.
- **A link navigates, then dismisses** — `go()` runs the navigation and
  closes the dialog so the destination is visible.
- The album link is offered only when `hasAlbumDetail(slugify(album))` —
  navigating must not land on the default fallback page.
- **Only the content scrolls.** In tabs, the header and the tab bar hold and
  the panel scrolls; in the page layout the whole body scrolls in one box.
  The sheet itself cannot scroll (`DialogContent` pins that).

## Artwork

**Artwork carries `art-edge`** — a 1px outline inset by 1px, pure black at 10% in light and pure white at 10% in dark. Pure, never a tinted neutral: a tinted edge picks up the surface beneath it and reads as dirt along the image. It is an `outline`, so it costs no layout and follows the corner radius. On the header thumb and on every portrait and initials circle.

## Open questions

- Tabs or one page? Both layouts are live (`?credits=page`) until the decision is made; the loser and the URL switch go then.
- In the player the track bars and their fade are `bg-popover` over the frosted glass, so they read as solid bands. They need the glass's own surface, or a translucent bar with its own blur.
- The track bars play without the album page's listening check (`account.canListen` → paywall). Wire it in once the dialog owns that flow.
- An album without a curated record repeats its whole lineup under every track. Correct, but long; collapse identical lineups ("Tracks 1–5: …")?
- Notes text: show Discogs' notes, Apple's editorial text, or our own? Licensing decides.
- `p-0 gap-0` on the popup cancels only the phone padding; see [dialog.md](dialog.md), open questions.
