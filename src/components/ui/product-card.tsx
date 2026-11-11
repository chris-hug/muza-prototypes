"use client"

/*
 * ProductCard — compact vertical product tile used on the
 * Artist profile "Products" rail and Shop discovery feeds.
 *
 * Figma source: file dbSHgvquI2o4TFie2iAJxv › node 21054:5234 →
 * `ProductCardVerticalSmall` (linked via the Artist page Section
 * 8971:98290 Figma annotation).
 *
 * Layout:
 *   ┌────────────────────┐
 *   │                    │   ← image (aspect ~ 188.8 / 142)
 *   │      cover         │
 *   ├────────────────────┤
 *   │ Product title       │   ← 2-line clamp
 *   │ 32$  or more        │   ← price + secondary label
 *   ├────────────────────┤
 *   │   [+ Add to cart]   │   ← full-width pill, secondary surface
 *   └────────────────────┘
 *
 * The card itself is `rounded-2xl` with `border-border`. The cover
 * area sits flush at the top; text + button stack below with the
 * spec'd 12px horizontal padding. The "Add to cart" button is a
 * full-width pill using the design-system Secondary variant.
 */

import { ShoppingCart } from "lucide-react"

import { useCoarsePointer } from "@/lib/use-media-query"
import { cropStyle, type ProductImage } from "@/lib/shop-product"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface ProductCardProps {
  cover:        string
  /** Every product image, cover first, each with the seller's crop. With two
   *  or more, a pointer that can hover sees the second one on hover. */
  images?:      ProductImage[]
  title:        string
  /** Numeric amount — formatted with the trailing currency by the
   *  caller (e.g. `"32 $"` / `"€ 25"` / `"£10"`). Keeps formatting
   *  decisions out of the component. */
  price:        string
  /** Tail label after the price (e.g. "or more"). Optional. */
  priceLabel?:  string
  /** The product's category ("Vinyl", "Apparel" …), as a Badge under the
   *  price — the same label the product dialog shows above its title. */
  badge?:       string
  /** On sale: the old price, formatted like `price`, struck through after it. */
  compareAt?:   string
  /** On sale: the saving ("20% off"), as a Mint badge on the image. */
  discount?:    string
  /** Newly listed — a "New" badge on the image. Meant to be rare: a flag on
   *  every tile is a flag on none. */
  isNew?:       boolean
  onClick?:     () => void
  onAddToCart?: () => void
  className?: string
}

export function ProductCard({
  cover, images, title, price, priceLabel = "or more", badge, compareAt, discount, isNew,
  onClick, onAddToCart, className,
}: ProductCardProps) {
  const coarse = useCoarsePointer()
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group/product flex h-full flex-col bg-background border border-border rounded-2xl overflow-hidden w-full max-w-[220px] min-w-0",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Cover — aspect mirrors Figma (188.8/142 ≈ 1.33). The accent
           fill behind the image shows through if the asset is
           transparent or fails to load. */}
      <div className="relative w-full bg-accent aspect-[188.8/142] overflow-hidden">
        <img
          src={cover}
          alt={title}
          draggable={false}
          style={cropStyle(images?.[0]?.crop)}
          className="size-full object-cover art-edge"
        />
        {/* Second image on hover — the cheapest way to say "there is more
             than one picture" without dots on a 192px tile. `hover:` only
             applies where the pointer can hover, so touch never sees it and
             gets the gallery on the product page instead. Faded, not
             swapped: a hard cut on every mouse pass reads as a flicker. */}
        {images && images.length > 1 && (
          <img
            src={images[1].src}
            style={cropStyle(images[1].crop)}
            alt=""
            aria-hidden
            draggable={false}
            loading="lazy"
            className="absolute inset-0 size-full object-cover art-edge opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover/product:opacity-100"
          />
        )}
        {/* Flags ride on the image, top-left, where a scan of the grid
             finds them before reading a word: "New" (glass, `outline`) and
             the saving (Mint, the badge the dialog shows by the price). On
             the picture, not in the text block, so they cost the tile no
             height and a sale no longer wraps the price row. */}
        {(isNew || discount) && (
          <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
            {isNew && <Badge variant="outline" className="text-foreground">New</Badge>}
            {discount && <Badge variant="new">{discount}</Badge>}
          </div>
        )}
      </div>

      {/* Title + price — 12px horizontal padding, 4px vertical to
           keep the card compact. Title is a button matching AlbumCard
           (text-small + hover underline) and always reserves two
           lines of height so cards in the same row stay flush
           regardless of how long each title is. */}
      {/* One rhythm: 12px from the image, 8px between title, price and
           badge, 12px to the pill. It was 4 / 2 / 6 / 8 — three gaps that
           each looked like a mistake next to the others. */}
      <div className="flex flex-col gap-2 px-3 pt-3 min-w-0">
        {/* Title, price and badge stack from the top at their own height;
             only the pill is pinned to the bottom (`mt-auto` below). A
             two-line reserve on the title used to keep a row flush instead,
             and left a one-line title floating above an empty line. */}
        {/* Plain text on a coarse pointer: the card around it opens the same page. */}
        {coarse ? (
          <p className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 pb-[6px] -mb-[6px]">{title}</p>
        ) : (
          <button
            type="button"
            onClick={stop(onClick)}
            className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 link-underline pb-[6px] -mb-[6px] outline-none cursor-pointer"
          >
            {title}
          </button>
        )}
        {/* `-mt-0.5`: 6px under the title, not the column's 8 — the price
             belongs to the title it prices, the badge less so. */}
        <div className="-mt-0.5 flex items-baseline gap-1 text-small leading-5">
          <span className="font-medium text-foreground">{price}</span>
          {compareAt && (
            <span className="text-xsmall font-normal text-muted-foreground line-through">{compareAt}</span>
          )}

          {priceLabel && (
            <span className="text-xsmall font-normal text-muted-foreground">{priceLabel}</span>
          )}
        </div>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>

      {/* Add-to-cart — full-width pill. Stop propagation so the
           click doesn't also fire the card's onClick (which would
           open the product detail). */}
      {/* `mt-auto`: the one bottom-aligned part, so the pills of a row
           line up however tall each card's text is. */}
      <div className="mt-auto p-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={stop(onAddToCart)}
          className="w-full"
        >
          <ShoppingCart />
          Add to cart
        </Button>
      </div>
    </div>
  )
}
