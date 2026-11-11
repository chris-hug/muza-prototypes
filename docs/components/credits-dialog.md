---
title: Credits Dialog
source: src/components/app/credits-dialog.tsx
related: [dialog, media-header, detail-more-button, album-card]
usage:
  - Album detail › ⓘ button / “…” → Show credits | /?page=Album
  - Any album card / song row → Show credits | /?page=Albums
---

`CreditsDialog` is the release metadata behind every "Show credits" action
and the MediaHeader's ⓘ: a compact header (the ⋯ sheet's: thumb, title, main artist, Album badge,
year) over **Overview** (the session facts), **Credits**
(one row per person, grouped) and **Notes**. Albums only; a playlist has no
release credits.

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
<DialogContent className="md:max-w-md p-0 gap-0 overflow-hidden flex flex-col h-[88svh] md:h-[min(85vh,44rem)]">
  <CreditsContent
    credits={credits}
    layout="tabs"            // or "page"
    heading={<DialogTitle className="sr-only">Album credits</DialogTitle>}
    onArtist={name => go(() => openArtist(slugify(name)))}
    onAlbum={albumLinkable ? () => go(() => openAlbum(slugify(credits.album))) : undefined}
    bodyClassName="min-h-0"
  />
</DialogContent>
```

| Part | What it wears | Why |
|---|---|---|
| Header | the ⋯ sheet's identity block (`DetailMenuSheetBody`): `size-18 rounded-xs art-edge` thumb · title `text-base font-medium` · artist `text-small text-muted-foreground` · `ContentTypeBadge` "Album" + year `text-xsmall`. Gutter `px-3`, `md:px-6` | the credits are reached from that sheet's "Credits" tile, so both open on one header instead of two. It replaced a 3:2 cover that spent a third of a phone on the artwork the reader just came from; before that, four equal label/value rows where the title weighed as much as a recording date. Label and catalogue number are Overview facts. The `heading` slot is an `sr-only` `DialogTitle` ("Album credits") — named for screen readers, not drawn |
| Tabs | `TabsList size="sm"` full width: Overview · Credits · Notes (Notes only with text). Credits is the default | "Show credits" is what was asked for. Header and tab bar hold; only the panel scrolls, so switching tabs never moves the bar. The tabs dialog has a fixed height (`h-[88svh]`, `md:h-[min(85vh,44rem)]`) so a short Overview and a long Credits list do not resize the sheet under the finger |
| Overview | a `dl`, label `text-muted-foreground`, value `text-foreground`: Recorded (date + studio) · Released · Label (label · catalogue number) · Tracks (count · total minutes) | the session facts a sleeve prints; a row is left out when the catalogue has no value |
| Credits | sections Personnel · Composition · Production & Engineering · Artwork & Notes, `text-small font-medium` titles; rows in a `divide-y divide-border/60` list | MusicBrainz and Discogs name roles differently; four fixed sections keep it from becoming Tidal's twelve role headings. The hairlines read as a ruled liner-note sheet |
| Person row | `PersonAvatar` `size-10` (portrait, else initials) · name `text-small` (a link) · roles `text-2xsmall text-muted-foreground` · `LibraryHeartButton type="artist"` `icon-sm touch-target` | **one row per person, every role merged** — a name appears once per album ("Tenor saxophone, Composer"). A role can name its tracks: "Bass clarinet (1, 2), Flute (3)", the liner-note convention, instead of a credits block per track repeating the same five names. Every person gets the heart: we assume every credited name has an artist page |
| Initials | first letter of the first and the last word, dots dropped — "Mark Ernestus" ME, "A. B. Spellman" AS | sidemen rarely have a photo, so initials are the common case and wear the portrait's circle, size and `art-edge`. Names are stored as read ("Mark Ernestus"), never as "Ernestus, Mark": Qobuz splits a sort-name at the comma and shows the first name as a role |
| Tracks key | number · title · duration, only when a role names tracks | the key to "(1, 2)"; an album with one lineup throughout shows no list it does not need |
| Notes | `text-small leading-relaxed`, "— Muza" under it | prototype copy written for the three curated albums, not quoted liner notes |
| `showCover` | `false` drops the thumb and the side padding | the player shows these credits in place of its artwork, beside its own thumb |
| Links | a value with a handler is a `<button>` carrying `link-underline`; without one it is plain text | title (when `hasAlbumDetail`), main artist and every person navigate. No handler, no underline, no tab stop. `CreditsDialogPreview` passes no-op handlers so the design-system frame shows the links without navigating away |

## Usage

Mounted **once** by `CreditsProvider` (in the app shell; the design-system
page mounts its own). Any descendant opens it by key:

```tsx
const credits = useCredits()
<Button onClick={() => credits.open("a07")}>Show credits</Button>
```

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
below (`max-h-[92vh]`), a centred `md:max-w-md` (448px) modal from there
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
- The player's credits panel renders the same body; not yet checked there with tabs.
- Notes text: show Discogs' notes, Apple's editorial text, or our own? Licensing decides.
- `p-0 gap-0` on the popup cancels only the phone padding; see [dialog.md](dialog.md), open questions.
