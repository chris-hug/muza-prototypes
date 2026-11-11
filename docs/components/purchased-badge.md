---
title: Purchased Badge
source: src/components/ui/purchased-badge.tsx
related: [badge, album-card, media-header, media-list-item, song-list-item]
usage:
  - Album card pricing row | /?page=Albums
  - Media Header meta line | /?page=Album
  - Songs table, under the title | /?page=Songs
---

`PurchasedBadge` is the "Owned" mark: a `Badge` in `variant="secondary"`,
`shape="square-xs"` — an 18px label, the word only, on the `bg-accent` fill
the count pills use. It shows wherever an album the user has paid for
appears: the `AlbumCard` pricing row, the `MediaHeader` meta line, the
library table's Price column, and — for a song whose album is bought — the
song list row and the Songs table.

Its sibling is `LocalBadge` ("Local", `src/components/ui/local-badge.tsx`):
the same badge, followed by plain meta text — the file format, or why the
source cannot play ("Not connected"). The two are one family on purpose:
"is this mine" is answered the same way whether you bought it on muza or it
is your own file.

## Anatomy

```tsx
<Badge variant="secondary" shape="square-xs" className="shrink-0">Owned</Badge>
```

No glyph. It used to be a `CircleCheckBig` and the word in foreground ink,
and before that a `bg-muted` 26px pill; the pill read too loud beside the
meta, and at 18px a glyph is detail nobody reads — the word already says it.
`square-xs` owns its line height, so the word sits the same in a card's
18px line and a header's tighter one (see [badge](badge.md)).

## Usage

```tsx
<PurchasedBadge />           // card pricing row, header meta, table cell
<LocalBadge detail="FLAC" /> // a local album: badge + format
```

`className` is passed through (layout only — `shrink-0` is already on). The
library table wraps it in an `inline-flex justify-end` to right-align it in
the Price column; the Songs table puts it under the title, since a track has
no Price column and beside the title it moved with each title's length.
A list row (`SongListItem`, `MediaListItem`) takes the word as its `badge`
prop and draws the same badge at the head of its second line.

## Sizing

Fixed: 18px tall, `px-1.5`, `text-2xsmall`. Inline; it reads none of the
three measures. When the row gets tight the neighbour truncates — the badge
is `shrink-0` and one word long.

## Behaviour

None.
