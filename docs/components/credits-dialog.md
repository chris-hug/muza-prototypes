---
title: Credits Dialog
source: src/components/app/credits-dialog.tsx
related: [dialog, media-header, detail-more-button, album-card, media-list-item]
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

**Two versions are live (Nov 2026).** The **current** version
(`variant="current"`, what the app opens) shows only what the button asked.
The **draft** (`variant="draft"`) — the anatomy tables below — is the earlier,
fuller reading, built to show the depth of the catalogue; it stays while the
current version settles.
Album and song open on the album's floating cover (below), scrolling away with the list.
**From an album:** the cover floating over a blurred band (below), album name, main artist · year, **Musicians** — every
person who plays, with their instruments only (Composer, Arranger, Producer
and the like dropped, no track numbers) — then **Production & Engineering**
and **Artwork & Notes** as in the draft, and last the draft's **album
card** (8px from the sides and the bottom, `rounded-md` — concentric with the dialog) (main artist, recorded, released, label · catalogue number, songs,
run time; inert). **From a song:** only that song. Its head is the album's **floating cover** with the song's title and the main artist under it (`songCover`, the default) or, as the alternative still being judged, the same centred title and artist as **text only** (`songCover={false}` — the two differ only by the picture). Then three sections, in this order, all with the person row's shape: **Composer(s)** — the song first — (only the writing roles — composer, lyricist — from any group: a leader's "Composer" sits in his personnel entry), then **Album**, then the **Musicians** on that take. The Album section is the library's own album row, `MediaListItem type="album"` (cover, title, artist · year, the row opens the album), with a chevron as `trailing` — a phone has no hover to say it is tappable. A song stops
at its musicians — no release facts, no production, no track list, no
switching to the album:
you get where you came from, as Spotify and YouTube Music do (see the
comparison at `/research/credits`). Same fixed height as the draft, 80svh — except a **song**, which follows its content (capped at 80svh): a few names left half a fixed sheet empty. The album head floats: a band of the blurred cover with a hard edge — the cover blurred 8px (16 hid the picture) and saturated 1.5×, under a 25% tint of the sheet in dark mode only (in light the tint read as a grey veil) and the header's and player's grain and sheen (`.glass-grain`) (the player's `.frosted-glass` was tried: it hid the cover and its backdrop-filter broke the rounded corners); the cover (260px in the desktop dialog; **200px in a phone sheet** — under 420px wide, by container query — so the musicians read with little or no scrolling; 384, 320 and 280 were too big) crosses it, the band ending at 60% of the cover, so ~40% hangs on the sheet; title and artist in the album page's stacked-header sizes and spacing (`MediaHeader` below 560: cover → title 16px, title `text-large font-semibold`, 12px to the meta line (6 in a sheet under 420px wide), artist regular weight, 16px to the first section). The album title is **not** a link — the credits are opened from the album, so it would only lead back, centred. Tried and dropped: the cover over a blurred 3:2 copy with the text below (a banner), the cover full-bleed with the title on it (too loud), and a 192, 240 or 288px cover (a thumbnail). The
**app opens the current version**; `?credits=draft` (or `?credits=page`) brings the draft
back, in the dialog and the player alike (`creditsMode()`). The design system
shows both, the current version first.

**Two layouts are live while they are compared:** `"tabs"` (the default) and
`"page"`, the same sections stacked in one scroll. The live dialog reads
`?credits=page` from the URL. One of them goes when the decision is made.

## Anatomy

```tsx
<DialogContent fixedHeight className="sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-[80svh] max-h-[80svh]">
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
| Header | the ⋯ sheet's identity block (`DetailMenuSheetBody`): `size-18 rounded-xs art-edge` thumb · title `text-small font-medium` · artist `text-small text-muted-foreground` · year · label `text-2xsmall` where the sheet has its content-type badge (the sheet's layout, the dialog's two sizes — see Type). Gutter `px-3`, `sm:px-6` | the credits are reached from that sheet's "Credits" tile, so both open on one header instead of two. It replaced a 3:2 cover that spent a third of a phone on the artwork the reader just came from; before that, four equal label/value rows where the title weighed as much as a recording date. **No Album / EP / Single badge:** the sources disagree, and for old jazz the type is a modern label applied afterwards — MusicBrainz editors give a 1940 set of 78s today's categories, Discogs records the format of each pressing (78 RPM, 10", LP), iTunes mostly says "Album" and puts "– EP" in the title. Year and label are what every source agrees on. The catalogue number is an Overview fact. The `heading` slot is an `sr-only` `DialogTitle` ("Album credits") — named for screen readers, not drawn |
| All album credits (track by track) | `Button ghost sm` "All album credits ›" on its own line above the head, left-aligned (`-ml-2`, text on the thumb's edge) and on the ✕'s centre line (`-mt-2`); the album card at the end does the same | tried and dropped: a pill under the head (a second, smaller thing about the same album); the whole head as one clickable row with the label at its end (its hover ran into the ✕, and held clear of it the label floated) |
| Album card (track by track) | at the end of the list: the album's name with "All album credits ›", then the Release facts led by "Main artist"; `rounded-md bg-muted p-4` (10px: 8px in from the dialog's 18px corner — concentric), the whole card opens the album's credits (`role="button"`, `press-ripple`, hover fill `secondary`) | the release facts would split a song from its credits anywhere else; with the way to the album's credits they are one thing, so one card — the pill that used to sit under it said the same thing twice |
| Tabs | `TabsList size="sm"` full width: Credits · Notes — only when there are Notes; one tab gets no strip. Credits is the default. There was an Overview tab; its facts now sit in the album's Credits (Release, below) | "Show credits" is what was asked for. Header and tab bar hold; only the panel scrolls, so switching tabs never moves the bar. **The head is glass over the panel**, as Tidal does it: the panel runs the full body height, the head (identity + tabs) lies over its top as `.sheet-glass` (the sheet's colour at 72% over a 12px blur), and rows slide UNDER it, blurred and faintly legible, instead of fading out at an edge. A 1px hairline (`shadow-[0_1px_0_var(--border)]`) appears under the head once the panel has scrolled. The head's height is measured (`ResizeObserver` → `--head-h`): it is the panel's top padding (+12px) and the sticky bars' `top`. The scrollbar is thin, `--muted-foreground` on a clear track. Tried and dropped: a hard cut (a row sliced in half); a white gradient veil (paled the rows, read as a band); a masked blur under each sticky bar (a smear with a visible start) |
| Release | the **album card** — the same card that ends the track-by-track reading (album name, then the facts led by Main artist: Recorded (date + studio) · Released · Label (label · catalogue number) · Songs · Run time), inert here, LAST, after the Tracks; `-mx-2` like the bars | one set of facts, one look and one place — the end — in both readings; a row is left out when the catalogue has no value |
| Credits — album | sections Personnel · Composition · Production & Engineering · Artwork & Notes, `text-small font-medium` titles; one row per person in a `divide-y divide-border/60` list; then **Tracks**, then the album card | the overview of who is on the record — the reading track by track replaced it once and lost exactly that. Opens from the album's ⓘ and the ⋯ "Credits" tile |
| Tracks (album) | the track-by-track reading's bars, not sticky, 4px apart, and GHOST: no fill at rest, `muted` hover fill, playing `bg-secondary` — five filled bands stacked read as a wall; `TrackNumberPlayButton` that plays, title `font-medium`, duration, chevron; the bar opens that song's credits (`role="button"`, hover fill `secondary`) | one song looks like one song in both readings; it was a ruled text list here and a band there |
| Credits — track by track | one section per track under a sticky bar, then that track's people (`peopleOnTrack`: roles without track numbers plus those naming it, numbers dropped); Production & Engineering and Artwork & Notes follow ONCE under bars of their own; then the album card | Qobuz's layout, for a song's question "who is on this take?" — Dolphy is "Bass clarinet" under Hat and Beard, "Flute" under Gazzelloni. Production and the sleeve belong to the record |
| Track bar | sticks under the glass head (`top: var(--head-h)`), FULL dialog width (`-mx-4`) with NO radius — stuck, it is the head's lower edge, a band, not a card under it (rounded bottom corners still read as a card); `pl-3 pr-4` put the button and title back on the rows' grid. A square `bg-popover` sticky shell around a rounded `h-12` band — a rounded band that was itself sticky let rows show through its corners. Every bar and list is a SIBLING in one container: a bar sticky inside its own section was pushed off before the next arrived, and the previous song's last rows flashed past the top edge. Band: a filled band in the lightest fill, `bg-muted`; the song playing `bg-secondary` with the wave in its button (`secondary` / `secondary-hover` read as heavy slabs); NO fade below — Tidal's track headers have none. Section bars (Production, Artwork) stay unfilled, `bg-popover`. The band, not a type size, is what tells a song title from a section title and a name — all three are `text-small`, and on one ground they read alike. The whole bar plays the track (or pauses the one playing), with the album row's hover — a `--hover-fill:var(--secondary)` circle grown from the pointer by `press-ripple` — a pointer cursor, and the play icon on a hover ANYWHERE on the bar (`TrackNumberPlayButton hoverGroup="trackbar"`), since a click anywhere plays; section bars (Production, Artwork) stay inert. the padding lands the button's centre on the avatars' and the title on the names' edge | Same button and playing row as the album page, so playing reads the same in both |
| Person row | the library's own row, `MediaListItem type="artist" size="lg"` (both versions, current and draft): 48px portrait or initials · name `text-small` · roles as its second line · `LibraryHeartButton` as `trailing`; the row opens the artist. Rows sit in a plain column, no hairlines (the row's hover surface replaces them) | **one row per person, every role merged** — a name appears once per album ("Tenor saxophone, Composer"). A role can name its tracks: "Bass clarinet (1, 2), Flute (3)", the liner-note convention. **Without a page** (`profile: false` — sleeve designers, photographers, liner-note writers) no `onOpen`, no heart, no hover: credited, not a link. It was a bespoke row (40px avatar, `divide-y`); the library row keeps one person looking the same in search, the library and here |
| Initials | drawn by `MediaListItem`'s artist slot: first letter of the first and the last word, dots dropped — "Mark Ernestus" ME, "A. B. Spellman" AS | sidemen rarely have a photo, so initials are the common case and wear the portrait's circle, size and `art-edge`. Names are stored as read ("Mark Ernestus"), never as "Ernestus, Mark": Qobuz splits a sort-name at the comma and shows the first name as a role |
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
**the album's overview**. Inside, a Tracks row switches in; "All album credits ›" above the head and the album card switch back (state in `CreditsContent`); the provider keys the dialog by
the request, so a second "Show credits" starts fresh. The player keys the body by the playing title, so the next
track lands on its own section. The jump is measured, not `scrollIntoView`
(which would scroll the sheet and page too), and runs again after the open
transition.

Outside a provider `open` is a no-op, so menus that bake it in never crash.
Data comes from `getCredits(albumKey)` in `album-catalog`. Three albums carry a
full record in `album-credits.ts` (A Love Supreme, Blue Train, Out to Lunch —
the instrument changes with the track — and Black Radio, a different lineup
on nearly every track, transcribed from MusicBrainz's recording-level
credits); the rest derive
one row per person from the album's lineup. Production fills the same shape
from iTunes, MusicBrainz and Discogs.

`CreditsDialogPreview albumKey` renders `CreditsContent` inline in a
bordered `bg-popover` card with a plain heading and no handlers — a static
render for the design system.

## Sizing

**Gutter and top, the same at every size:** 16px sides (`px-4`, the ✕'s
inset) and 24px above the head (`pt-6`). At the bottom the album card ends
8px from the sheet's edge — the 8px it keeps at the sides (more on a phone
with a home indicator). It was 12px on a phone and 24px from
`sm` — two layouts of one dialog — and at 12 the bars and the album card,
which bleed 8px past the gutter, sat 4px from the sheet's edge, and the thumb
right under the grabber.

Reads the **window** at **640** through the base dialog: a bottom sheet
below, a centred `sm:max-w-xl` (576px, the purchase and checkout width) modal
from there. **One height, always: `h-[80svh]`** — phone and desktop, tabs and
page, album and track by track. A height that followed the content resized
the sheet when the reading changed, and the base sheet's
grow-on-first-scroll detent jumped it to nearly full screen the moment it was
scrolled; `fixedHeight` turns that off (see [dialog.md](dialog.md)).
**Whole pixels:** the height is `round(down, 80svh, 1px)` and from `sm` the
sheet sits at a whole `10svh` from the top (`sm:translate-y-0`) instead of
the base `top-1/2 -translate-y-1/2`. 80svh is fractional, and half of it put
the sheet at y = 120.1 — every sticky track bar snapped between pixel rows as
the panel scrolled and wobbled 1–2px. `p-0` lets the cover header bleed to the edges; the
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

- Does the draft go? It is live (`?credits=draft`) until the current version has settled; then it and the URL switch go.
- Tabs or one page (draft)? Both layouts are live (`?credits=page`) until the decision is made; the loser and the URL switch go then.
- In the player the track bars and their fade are `bg-popover` over the frosted glass, so they read as solid bands. They need the glass's own surface, or a translucent bar with its own blur.
- The track bars play without the album page's listening check (`account.canListen` → paywall). Wire it in once the dialog owns that flow.
- An album without a curated record repeats its whole lineup under every track. Correct, but long; collapse identical lineups ("Tracks 1–5: …")?
- Notes text: show Discogs' notes, Apple's editorial text, or our own? Licensing decides.
- `p-0 gap-0` on the popup cancels only the phone padding; see [dialog.md](dialog.md), open questions.
