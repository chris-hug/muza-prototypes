---
title: Purchased Badge
source: src/components/ui/purchased-badge.tsx
related: [badge, album-card, media-header, media-list-item]
usage:
  - Album card pricing row | /?page=Albums
  - Media Header meta line | /?page=Album
---

`PurchasedBadge` is the "Owned" mark — a check glyph and the word, in
foreground ink, with no pill around it — shown wherever an album the user
has paid for appears: the `AlbumCard` pricing row, the `MediaHeader` meta
line, the library table's rows.

## Anatomy

```tsx
<span aria-label="Owned" className="inline-flex items-center gap-1 text-small text-foreground">
  <CircleCheckBig className="size-3.5 shrink-0" />
  Owned
</span>
```

One span, one glyph (`CircleCheckBig`, 14px), one word. `text-foreground`,
not `text-muted-foreground`: it sits beside muted meta (a price, a year) and
is meant to be one step more present than them — ownership is the fact the
row is answering. No border and no fill: a `bg-muted` pill was tried and read
too loud next to the surrounding meta in card and header rows.

It is not a `Badge`. A `Badge` is a 26px box with a border slot; this is
inline text that shares the line box of whatever it sits in.

## Usage

```tsx
<PurchasedBadge />                                  // MediaHeader meta line — text-small
<PurchasedBadge className="text-xsmall [&_svg]:size-3" />   // a tighter row
```

`className` is the only prop and it is the size: pass a text-size alias and
the label follows; the glyph is `size-3.5` and is overridden with an
`[&_svg]:size-*` class. `AlbumCard` passes its meta line's own classes
(`text-xsmall font-light tracking-[0.02em] leading-[18px]`) plus
`[&_svg]:size-3`, so "Owned" sits on the exact rhythm of the price line it
replaces (`album-card.tsx:306–309`). The library table
(`media-list-table.tsx:279`) wraps it in an `inline-flex justify-end` to
right-align it in its column.

Both consumers call the component rather than inlining the markup, so a
glyph swap, a size bump or a copy change lands everywhere in one edit.

## Sizing

Fixed, no steps. Inline; it reads none of the three measures. When the row
gets tight it is the neighbour that truncates — the badge is `shrink-0` on
its glyph and one word long.

## Behaviour

None. `aria-label="Owned"` names it for a reader even though the visible
text says the same; the glyph is decorative.

## Open questions

- purchased-badge.tsx:22 says `text-small` "defaults to 18px" · the alias is
  19px (`--text-small: var(--text-sm)`, app.css:256, and the type scale in
  DESIGN_SYSTEM.md).
- The former home.tsx demo labelled a `text-2xsmall [&_svg]:size-3` badge
  "as rendered in AlbumCard's pricing row" · AlbumCard passes `text-xsmall`
  with its meta weight and tracking (album-card.tsx:119–122, 309). The
  example here uses `text-xsmall`.
- `aria-label="Owned"` on a span whose text content is "Owned" is redundant
  for a screen reader; whether the label should instead say more ("Owned —
  purchased album") is not recorded.
