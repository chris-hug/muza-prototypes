---
title: Checkout Card
source: src/components/app/purchases-view.tsx
related: [order-status-badge, avatar, button, product-card]
usage:
  - Purchases hub | /?page=Purchases
---

A `CheckoutCard` is the buyer's receipt for one payment moment on the
Purchases hub: a date · total header strip over one row per shop the cart
spanned, each row with the shop's avatar and order number, up to three item
thumbs and titles, and its own status badge and subtotal. One charge, N
fulfillments — the unit a buyer remembers is when they paid, not which artist
shipped what.

## Why the card is shaped by the checkout, not the order

The cart groups by shop because shipping is per shop, so one checkout creates
N orders behind the scenes — one per artist's shop. The artist sees each as an
"Order" in their own Orders view. The buyer would not recognise those: this
card rejoins them under the payment (`Checkout`), and each shop's slice is a
sub-row (`Fulfillment`). Amazon and Etsy do the same for multi-vendor carts.

```tsx
interface Checkout    { id; number /* payment ref */; date; total /* charged */; fulfillments: Fulfillment[] }
interface Fulfillment { id; orderNumber /* per-shop */; seller: { name; location }; items: OrderItem[]; subtotal; status: OrderStatus; carrier?; trackingNumber?; trackingUrl? }
```

`OrderStatus` is `payment_failed · new · shipped · delivered · refunded ·
cancelled` (`order-status-badge.tsx`).

## Anatomy

| Part | Classes | Why |
|---|---|---|
| Card | `rounded-xl border border-border bg-background overflow-hidden` | the outer is chrome only; nothing on it is clickable |
| Header strip | `flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/30` | a tinted band separates the receipt's identity from its rows |
| Date | `text-small text-foreground tabular-nums` (`formatDate`) | leads the strip — the buyer scans by date |
| Shop count | `· 3 shops` in `text-xsmall text-muted-foreground`, only when more than one | says why there are several rows |
| Total | `text-small font-medium text-foreground tabular-nums` (`formatTotal`) | the amount actually charged |
| Update payment | `Button variant="outline" size="sm"` with a `CreditCard` glyph, only when any fulfillment is `payment_failed` | see below |
| Rows | `<ul class="flex flex-col divide-y divide-border/60">`, one `FulfillmentRow` per fulfillment | hairline between shops |

### `FulfillmentRow` — three columns, one band per shop

`role="button" tabIndex={0}`, Enter and Space activate; `flex items-start
gap-5 px-4 py-4 hover:bg-muted/60 focus-visible:bg-muted/60 transition-colors
cursor-pointer`.

| Column | Classes | Content |
|---|---|---|
| 1 · Shop — the visual stopper | `shrink-0 w-[220px] flex items-start gap-2.5` | `Avatar size-8` (a portrait keyed by the shop name; initials in `text-2xsmall font-medium` while it loads or if it fails), the name `text-small font-medium text-foreground truncate`, the per-shop order number `text-2xsmall text-muted-foreground tabular-nums` |
| 2 · Items — fills the middle | `flex items-start gap-3 flex-1 min-w-0` | thumbs `size-14 rounded-sm object-cover` in `gap-1.5`, then titles `text-small text-foreground leading-snug truncate`, each a `<button>` → `onProductClick(title)`; `×2` in `text-muted-foreground` when quantity > 1 |
| 3 · State | `shrink-0 flex flex-col items-end gap-1` | `OrderStatusBadge`, then the subtotal `text-xsmall text-muted-foreground tabular-nums` |

Thumbs and titles are both capped at **`MAX_INLINE_ITEMS` = 3**; anything
beyond collapses into one `+N more items` caption (`text-2xsmall
text-muted-foreground`), so a ten-item order stays a compact row. Multi-item
orders grow the titles list vertically and the shop column wraps to match.

The seller's **location is not shown**: the buyer chose the seller, and the
status badge says the shipping state, so it was decorative noise. Tracking has
moved to the detail page for the same reason.

### Payment recovery lives in the header

Payment is checkout-level — one charge — so when any fulfillment is
`payment_failed` the card surfaces a **single** "Update payment" button in the
header strip, out of the per-row state column where it competed with the
status badge. The click stops propagation and calls `onUpdatePayment(f)` with
the failed fulfillment.

| Prop | What it does |
|---|---|
| `checkout` | the record |
| `onOpenFulfillment(f)` | a row's click / Enter / Space — opens that fulfillment's detail |
| `onProductClick(title)` | a product title |
| `onUpdatePayment(f)` | the header's recovery button |

## Usage

```tsx
{checkouts.map(c => (
  <CheckoutCard key={c.id} checkout={c}
    onOpenFulfillment={f => setSelected({ checkout: c, fulfillment: f })}
    onProductClick={title => toast({ title, description: "Product page coming soon." })}
    onUpdatePayment={f => toast({ title: `Update payment · ${f.orderNumber}` })} />
))}
```

Used by the Purchases hub (`PurchasesView`, the same file), which mounts
`PurchaseDetailView` for the selected fulfillment; product and payment
handlers toast placeholders there.

## Sizing

Column-filling: the card is as wide as its parent. **Fixed, no steps** — and
the row does not reflow. Its widths are absolute: a 220px shop column, 20px
gaps, three 56px thumbs with 6px between (180px), a 12px gap, the titles, and
the state column. That is **≈ 450px before a single title character**, so on
a 320px phone (296px column) or a 375 (351) the row cannot fit and the
`flex-1` titles column collapses toward zero. See the open questions.

## Behaviour

- **Row → `onOpenFulfillment`**; a product title is a `<button>` that stops
  propagation and calls `onProductClick`; the header button stops propagation
  and calls `onUpdatePayment`. Keyboard: the row is a `tabIndex={0}` button
  role with Enter / Space; the title buttons and the header button are in the
  tab order too.
- **Hover** is pointer-only (`hover:bg-muted/60` under Tailwind v4's
  `@media (hover: hover)`); `focus-visible:bg-muted/60` is the keyboard
  equivalent.
- `formatDate` / `formatTotal` come from `orders-view.tsx`, shared with the
  artist's Orders view so both sides print the same date and money.

## Open questions

- No narrow layout exists (purchases-view.tsx:588–673): the 220px shop column
  and the thumb strip are fixed, so at any column under ~450px the titles are
  crushed and at 296 the row overflows the card. Is the hub desktop-only, or
  is a stacked row wanted below the 560 column step the other page
  compositions use?
- purchases-view.tsx:16–17 (file header) says clicking a sub-row "currently
  toasts a placeholder" · `PurchasesView` sets `selected` and mounts
  `PurchaseDetailView` (:315–316, :26); only the product title and Update
  payment toast (:318–328). The header is stale.
- purchases-view.tsx:559–561 says a real photo "would override this via
  `seller.avatarUrl` when the data exists" · `Fulfillment.seller` is
  `{ name; location }` (:53) — there is no `avatarUrl` field, and the avatar
  is always the pravatar portrait keyed by name (an external request per row).
- The former DS-page intro said "each fulfillment row links to its detail
  page" · true in the app; in the design-system frame the handlers are no-ops.
