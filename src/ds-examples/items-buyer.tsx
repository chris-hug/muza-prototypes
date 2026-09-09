"use client"

/*
 * Items — the buyer's view of a purchase: the same component with less
 * content. The subtitle is the product type (no variant, no SKU), shipping
 * is free, and there is no tax row because the breakdown carries none.
 *
 * This file is a CALL SITE, not a copy: the real `ItemsSection` fed from a
 * real checkout the way `purchase-detail-view.tsx` feeds it — one
 * fulfillment of `CHECKOUTS`, the unit price derived from its subtotal.
 */

import { ItemsSection } from "@/components/app/items-section"
import { CHECKOUTS } from "@/components/app/purchases-view"

const FULFILLMENT = CHECKOUTS[0].fulfillments[0]
const QUANTITY    = FULFILLMENT.items.reduce((n, i) => n + i.quantity, 0)

export default function ItemsBuyerExample() {
  return (
    <ItemsSection
      items={FULFILLMENT.items.map(item => ({
        image:     item.image,
        title:     item.productTitle,
        subtitle:  item.type,
        unitPrice: FULFILLMENT.subtotal / QUANTITY,
        quantity:  item.quantity,
      }))}
      breakdown={{
        subtotal: FULFILLMENT.subtotal,
        shipping: 0,
        total:    FULFILLMENT.subtotal,
      }}
    />
  )
}
