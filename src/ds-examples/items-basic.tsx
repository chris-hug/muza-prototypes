"use client"

/*
 * Items — the seller's view of an order: each line with its variant and
 * SKU, a mixed quantity so one line expands to "unit × qty" over its line
 * total, then the money breakdown with discount, shipping and a labelled
 * tax row.
 *
 * This file is a CALL SITE, not a copy: the real `ItemsSection` fed from a
 * real order the way `order-detail-view.tsx` feeds it — `getOrderDetail()`
 * turns the orders-list stub into the full detail, and the adapter below
 * is the page's own mapping (subtitle = variant, meta = SKU).
 */

import { ItemsSection } from "@/components/app/items-section"
import { ORDERS } from "@/components/app/orders-view"
import { getOrderDetail } from "@/components/app/order-detail-view"

// Order #1057 — two products, one of them ×2.
const ORDER = getOrderDetail(ORDERS[1], ORDERS[1].status)

export default function ItemsBasicExample() {
  return (
    <ItemsSection
      items={ORDER.items.map(item => ({
        image:     item.image,
        title:     item.productTitle,
        subtitle:  item.variant,
        meta:      `SKU · ${item.sku}`,
        unitPrice: item.unitPrice,
        quantity:  item.quantity,
      }))}
      breakdown={{
        subtotal:     ORDER.subtotal,
        discount:     ORDER.discount,
        discountCode: ORDER.discountCode,
        shipping:     ORDER.shippingFee,
        tax:          ORDER.tax,
        taxLabel:     ORDER.taxLabel,
        total:        ORDER.total,
      }}
    />
  )
}
