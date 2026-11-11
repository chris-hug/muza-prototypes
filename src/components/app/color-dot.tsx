/*
 * ColorDot — the small swatch beside a colour name: in the product dialog's
 * colour chips and in the cart's colour select, so a buyer sees the same
 * mark for "Cream" in both places. The colour is the product's own, as data,
 * which is why it is an inline style and not a token. The border keeps a
 * cream dot visible on a cream surface.
 */

import { swatchFor } from "@/lib/shop-product"

export function ColorDot({ name, value }: { name: string; value?: string }) {
  const fill = value ?? swatchFor(name)
  if (!fill) return null
  return <span aria-hidden className="size-3.5 shrink-0 rounded-full border border-border" style={{ background: fill }} />
}
