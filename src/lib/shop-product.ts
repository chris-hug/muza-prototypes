/*
 * shop-product — what a buyer sees of a product, shared by the artist page's
 * tiles, the product dialog and the Studio listing editor that produces it.
 *
 * The dialog has four shapes (Figma › MUSA Layouts & Flows › Product Modal),
 * and they fall out of three fields rather than a variant name:
 *   · `priceMode`  — "fixed" shows the price in the heading (with the old
 *                    price and the saving when `compareAt` is set); "min" asks
 *                    the buyer to choose a price, at or above `price`.
 *   · `kind`       — Apparel adds Color and Size; music formats do not.
 *   · `linkedSong` — a record whose music is on muza gets a play row, so the
 *                    buyer can listen before buying. No link, no row.
 */

import type { CSSProperties } from "react"

/** The categories the Studio offers when a listing is created. */
export type ProductKind = "Vinyl" | "Compact Disc" | "Cassette" | "Apparel" | "Other"
/** In the Studio's order — the order the shop's filter lists them in. */
export const PRODUCT_KINDS: ProductKind[] = ["Vinyl", "Compact Disc", "Cassette", "Apparel", "Other"]

/** How one image is framed wherever it is shown. `x` / `y` are the focal
 *  point in percent of the image, `zoom` is 1 (fit) to 3. The seller sets it
 *  per image in the listing editor; tiles, thumbnails and the gallery all
 *  crop around the same point, so a 4:3 tile and a 3:2 gallery agree. */
export interface ImageCrop { x: number; y: number; zoom: number }

export interface ProductImage { src: string; crop?: ImageCrop }

export interface ShopProduct {
  id:          string
  title:       string
  /** Artist name, shown with its avatar above the title. */
  artist:      string
  artistImage?: string
  kind:        ProductKind
  /** Cover first, in the seller's order. */
  images:      ProductImage[]
  /** USD. The fixed price, or the minimum for "min". */
  price:       number
  priceMode:   "fixed" | "min"
  /** Fixed price only: the price before a discount. */
  compareAt?:  number
  colors?:     { name: string; value: string }[]
  sizes?:      { label: string; soldOut?: boolean }[]
  /** Newly listed: a "New" flag on the tile. Rare by intent. */
  isNew?:      boolean
  linkedSong?: { title: string; artist: string; album: string; year: number; cover: string; duration?: string }
}

/** Swatch colours by name, for the places that only carry the name (a cart
 *  line stores "Cream", not a colour). One table, so a colour looks the same
 *  in the dialog and in the cart. Product colours are data, not tokens. */
export const COLOR_SWATCHES: Record<string, string> = {
  Black: "#0d0d04",
  White: "#fefffb",
  Cream: "#ecefdf",
  Green: "#3f6b4a",
  Teal:  "#2a9d90",
  Coral: "#e76e50",
  Navy:  "#1f2a44",
  Plaid: "#7a2e3a",
}

export function swatchFor(name: string): string | undefined {
  return COLOR_SWATCHES[name]
}

export const DEFAULT_CROP: ImageCrop = { x: 50, y: 50, zoom: 1 }

/** Inline style for an `<img class="object-cover">` that honours a crop.
 *  The scale origin is the focal point, so zooming keeps that point still. */
export function cropStyle(crop?: ImageCrop): CSSProperties | undefined {
  if (!crop) return undefined
  return {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom !== 1 ? `scale(${crop.zoom})` : undefined,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  }
}

/** The saving as a whole percent, or 0 when the product is not on sale.
 *  One rule for the tile and the dialog, so they cannot disagree. */
export function discountPercent(p: Pick<ShopProduct, "priceMode" | "price" | "compareAt">): number {
  return p.priceMode === "fixed" && p.compareAt && p.compareAt > p.price
    ? Math.round((1 - p.price / p.compareAt) * 100)
    : 0
}
