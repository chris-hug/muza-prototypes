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

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ProductCardProps {
  cover:        string
  title:        string
  /** Numeric amount — formatted with the trailing currency by the
   *  caller (e.g. `"32 $"` / `"€ 25"` / `"£10"`). Keeps formatting
   *  decisions out of the component. */
  price:        string
  /** Tail label after the price (e.g. "or more"). Optional. */
  priceLabel?:  string
  onClick?:     () => void
  onAddToCart?: () => void
  className?: string
}

export function ProductCard({
  cover, title, price, priceLabel = "or more",
  onClick, onAddToCart, className,
}: ProductCardProps) {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group/product flex flex-col bg-background border border-border rounded-2xl overflow-hidden w-full max-w-[220px] min-w-0",
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
          className="size-full object-cover"
        />
      </div>

      {/* Title + price — 12px horizontal padding, 4px vertical to
           keep the card compact. Title is a button matching AlbumCard
           (text-small + hover underline) and always reserves two
           lines of height so cards in the same row stay flush
           regardless of how long each title is. */}
      <div className="flex flex-col gap-0.5 px-3 py-1 min-w-0">
        <button
          type="button"
          onClick={stop(onClick)}
          className="text-small font-normal leading-5 text-foreground text-left line-clamp-2 min-h-10 hover:underline focus-visible:underline underline-offset-[3px] [text-decoration-thickness:1px] [text-decoration-skip-ink:auto] pb-[6px] -mb-[6px] outline-none cursor-pointer"
        >
          {title}
        </button>
        <div className="flex items-baseline gap-1 text-small leading-5">
          <span className="font-medium text-foreground">{price}</span>
          {priceLabel && (
            <span className="text-xsmall font-normal text-muted-foreground">{priceLabel}</span>
          )}
        </div>
      </div>

      {/* Add-to-cart — full-width pill. Stop propagation so the
           click doesn't also fire the card's onClick (which would
           open the product detail). */}
      <div className="p-3 pt-2">
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
