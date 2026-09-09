---
title: Product Card
source: src/components/ui/product-card.tsx
related: [card-rail, album-card, button, checkout-card]
usage:
  - Artist › Shop tab | /?page=Artist
  - Artist › Products rail | /?page=Artist
---

A `ProductCard` is the merch tile on an artist's Shop tab and Products rail:
a landscape cover, a two-line title, the price with an "or more" tail, and a
full-width secondary "Add to cart" pill at the foot. It is a Phase 2 component
— it ships with the Shop, not on day one.

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Card | `group/product flex flex-col bg-background border border-border rounded-2xl overflow-hidden w-full max-w-[220px] min-w-0`, `cursor-pointer` only when `onClick` is passed | a bordered surface, unlike the media cards, because a product is a thing to buy rather than artwork to open; the 220 cap is the cover cap of the card ladder |
| Cover | `relative w-full bg-accent aspect-[188.8/142] overflow-hidden` around an `<img … object-cover>` | 188.8 : 142 (≈ 1.33 : 1) is the Figma frame; the `bg-accent` fill is what shows through a transparent asset |
| Text | `flex flex-col gap-0.5 px-3 py-1 min-w-0` | 12px horizontal padding per the spec, 4px vertical to keep the card compact |
| Title | `<button>` · `text-small font-normal leading-5 text-foreground text-left line-clamp-2 min-h-10`, underline on hover / focus, `pb-[6px] -mb-[6px]` | clamps at two lines **and** reserves two (`min-h-10` = 40px) so a row of tiles stays flush whatever each title's length |
| Price row | `flex items-baseline gap-1 text-small leading-5` — price `font-medium text-foreground`, label `text-xsmall font-normal text-muted-foreground` | the price is the one `font-medium` on the card; the tail is a size and a tone down |
| Add to cart | `p-3 pt-2` → `Button variant="secondary" size="sm" className="w-full"` with a `ShoppingCart` glyph | the design-system Secondary pill, full width |

Figma: file `dbSHgvquI2o4TFie2iAJxv` › `21054:5234` `ProductCardVerticalSmall`,
linked from the Artist page section `8971:98290`.

| Prop | What it does |
|---|---|
| `cover` `title` `price` | required; `price` is a **formatted string** (`"32 $"`, `"€ 25"`) — formatting is the caller's, so the card carries no currency logic |
| `priceLabel` | the tail; defaults to `"or more"`, pass `""` for none |
| `onClick` | the card and the title; opens the product |
| `onAddToCart` | the pill |

## Usage

```tsx
// Artist › Products rail — a Card Rail of tiles.
<CardRail title="Products" showAllLabel="All products">
  {products.map(p => (
    <li key={p.id}><ProductCard cover={p.cover} title={p.title} price={p.price} onClick={…} onAddToCart={…} /></li>
  ))}
</CardRail>

// Artist › Shop tab — the grid.
<ul className="grid-cards">
  {products.map(p => <li key={p.id}><ProductCard … /></li>)}
</ul>
```

Used by the artist page's Products rail and Shop tab (`artist-profile-view.tsx`).

## Sizing

The **column** decides through the parent — a `.grid-cards` track or a
[Card Rail](card-rail.md) `<li>` — with the card's own `max-w-[220px]` cap on
top, the same 220 the media covers cap at. Fixed, no steps: nothing on the
card reads its width. Unlike a square cover the tile's height is not the
track's width; the two reserved title lines and the pill make every tile the
same height regardless.

## Behaviour

- **Card click → `onClick`**; the title is a `<button>` that stops
  propagation and calls the same `onClick`, so the underline hover and the
  keyboard path land on the same action.
- **Add to cart → `onAddToCart`**, propagation stopped so the card's open
  does not also fire.
- No long press, no menu, no hover darkening — the title underline is the only
  hover state.
- Keyboard: the title button and the pill are focusable; the card `<div>`
  itself is not.

## Open questions

- product-card.tsx:78–79 says the title matches AlbumCard at `text-small` ·
  AlbumCard's title is `text-xsmall` (17px, album-card.md), and
  DESIGN_SYSTEM's media-card rule says title and meta are `text-xsmall`. The
  product title is `text-small` (19px, product-card.tsx:86) — is a bought
  thing meant to sit a size up from a played one?
- product-card.tsx:65–67 says the accent fill "shows through if the asset …
  fails to load" · a failed `<img>` renders the browser's broken-image
  glyph and `alt` over the fill, and the card does not use `CoverArt`;
  DESIGN_SYSTEM's missing-artwork rule routes every artwork through a
  branded fallback.
- The only host data (`PRODUCTS`, artist-profile-view.tsx:168–177) points all
  eight products at the same cover; there is no product catalog yet, so the
  design-system example carries its own four items.
