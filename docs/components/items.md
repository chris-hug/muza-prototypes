---
title: Items
source: src/components/app/items-section.tsx
related: [page-section, product-card, order-status-badge]
usage:
  - Shop › Orders → order detail | /?page=Shop&shop-tab=orders
  - Purchases → purchase detail | /?page=Purchases
---

The product lines and the money breakdown of an order, in one boxed
[Page Section](page-section.md) — the same component on the buyer's
purchase detail and the seller's order detail, fed different content. A
line collapses to a single price at quantity 1 and expands to a muted
"unit × qty" over its line total above that.

## Anatomy

| Part | What it is | Tokens |
|---|---|---|
| Card | `<Section title="Items" boxed>` — the heading outside, the rows and the breakdown inside the bordered card | see [Page Section](page-section.md) |
| Row | `flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0`, rows divided by `divide-y` | `divide-border/60` — lighter than the full border, because the thumbnails already separate the items |
| Thumbnail | `size-14 rounded-sm object-cover`, `alt=""` | — |
| Title · subtitle · meta | title truncates; subtitle is the variant (seller) or the product type (buyer); meta is the SKU, `tabular-nums` | `text-small text-foreground` · `text-xsmall text-muted-foreground` · `text-2xsmall text-muted-foreground` |
| Price column | right-aligned, `tabular-nums`, `shrink-0`: at quantity 1 the price alone; above that "$unit × N" over the line total | `text-small text-foreground`; the caption `text-2xsmall text-muted-foreground` |
| Breakdown | `mt-4 pt-4 border-t border-border/60`, rows `py-1`: Subtotal · Discount (only when > 0, the code in parentheses) · Shipping ("Free" at 0) · Tax (only when set and > 0; "Tax · 8% FR VAT" when labelled) | label `text-xsmall text-muted-foreground`, value `text-small text-foreground tabular-nums` |
| Total | `mt-3 pt-3 border-t border-border/60`, `items-baseline` | label `text-small font-medium`, value `text-base font-medium tabular-nums` |

The "× 1" multiplier is noise, so it is never printed; the line total is
the one number a reader compares against the subtotal, so it is the
prominent one. The divider above Total is the same light `/60` as the
inter-item lines on purpose — the total should feel like a settled answer,
not a shouted conclusion.

## Usage

```tsx
<ItemsSection
  items={order.items.map(item => ({
    image:     item.image,
    title:     item.productTitle,
    subtitle:  item.variant,          // the product type on the buyer side
    meta:      `SKU · ${item.sku}`,   // omitted on the buyer side
    unitPrice: item.unitPrice,
    quantity:  item.quantity,
  }))}
  breakdown={{
    subtotal: order.subtotal, discount: order.discount, discountCode: order.discountCode,
    shipping: order.shippingFee, tax: order.tax, taxLabel: order.taxLabel, total: order.total,
  }}
/>
```

Each page keeps a thin adapter from its own order shape onto `ItemLine` /
`ItemsBreakdown` (order-detail-view.tsx, purchase-detail-view.tsx); the
component never sees a page's types. `subtitle` and `meta` are optional and
their lines are skipped when missing, which is how the buyer side is
"the same component, less content". Prices go through `formatTotal()`.

## Sizing

**Fixed, no steps.** The card fills its column — a `max-w-2xl` on a detail
page's spine is the page's decision — and the row's title truncates before
the price column shrinks (`min-w-0` on the text stack, `shrink-0` on the
prices).

## Behaviour

None — it is a read-only summary. Editing quantities or lines is not a job
this card has on either side.

## Open questions

- items-section.tsx:69 guards the Discount row with
  `breakdown.discount && breakdown.discount > 0 && (…)` · when `discount`
  is **`0`** the expression short-circuits to `0`, and React renders a
  literal "0" text node between Subtotal and Shipping. The seller page
  passes exactly that — `getOrderDetail()` sets `discount` to `0` for the
  three orders in four without one (order-detail-view.tsx:175). The Tax
  row uses `!== undefined && > 0` and is safe; Discount should guard the
  same way
- items-section.tsx:20 imports `formatTotal` from `orders-view.tsx` · a
  shared primitive that depends on one page's view module; the buyer's
  purchase detail therefore pulls the seller's orders page into its bundle
