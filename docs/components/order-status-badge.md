---
title: Order Status Badge
source: src/components/ui/order-status-badge.tsx
related: [badge, status-badge, menu, product-card]
usage:
  - Shop › Orders → order detail status | /?page=Shop&shop-tab=orders
---

`OrderStatusBadge` is where a shop order is in its life — Payment failed,
New, Shipped, Delivered, Refunded, Cancelled — coloured per status. Read-only
in the Orders table and the buyer's Purchases; given `onStatusChange`, it
becomes a dropdown of the transitions the artist may make from there.

## The status set

```tsx
type OrderStatus = "payment_failed" | "new" | "shipped" | "delivered" | "refunded" | "cancelled"
```

`payment_failed` covers every case where the money did not arrive — a
declined retry, a chargeback awaiting evidence — because the artist's
recovery action is the same however the order got there. `STATUS_CONFIG`,
`ALL_STATUSES` and `ALLOWED_TRANSITIONS` are exported beside the component;
`orders-view.tsx` re-exports them for its older import sites.

| Status | Fill | Meaning |
|---|---|---|
| `payment_failed` | `bg-destructive text-destructive-foreground border-destructive` — a filled flare | action required |
| `new` | blue tint | paid, not yet shipped |
| `shipped` | amber tint | on its way |
| `delivered` | green tint | done |
| `refunded` | `bg-muted text-muted-foreground border-border` | closed, money returned |
| `cancelled` | red tint | closed, not fulfilled |

The four tints are Tailwind palette classes (`bg-blue-50 text-blue-700
border-blue-200`, with `dark:bg-blue-500/15 dark:text-blue-200
dark:border-blue-500/30` and the same pattern in amber / green / red): pale
tint plus dark ink in light mode, a translucent mid-tone plus the `-200` ink
and a `/30` border in dark mode, both clearing AA. They are the one place
the app colours a badge outside the semantic tokens — see the open
questions.

## Two modes

```tsx
// Read-only — the Orders table rows, Purchases, the order / purchase detail header.
<OrderStatusBadge status={order.status} />

// Interactive — the artist's Orders table and order detail: a dropdown of
// the transitions allowed from `status`.
<OrderStatusBadge status={order.status} onStatusChange={next => setStatus(next)} />
```

**Read-only** renders a plain `Badge` (`square` shape, 26px) with the
status's classes.

**Interactive** renders a `DropdownMenuTrigger` that mirrors the badge box —
`rounded-sm border pt-[4px] pb-[6px] pl-[6px] pr-[4px] text-2xsmall
font-normal leading-none`, the status colours, `hover:opacity-90`, the 2px
focus ring — plus a 12px `ChevronDown` that rotates while open. The menu
(`align="start"`) lists each allowed status as its own badge, with a muted
"current" after the one you are on (`bg-accent` row).

The interactive form falls back to read-only when the transition list has
only one entry — a terminal status stays a badge even with a handler, so
the artist is never offered a menu with nothing in it.

### Allowed transitions

```text
new        → new · shipped
shipped    → new · shipped · delivered
delivered  → shipped · delivered
cancelled, refunded, payment_failed → (none — read-only)
```

Cancel is deliberately absent: it is destructive (refund plus buyer email),
warrants a reason, and lives in the confirmation flows, not in a row badge.

## Sizing

Fixed, no steps. `w-fit shrink-0 whitespace-nowrap`; the menu is the app
`DropdownMenuContent` at its own width.

## Behaviour

- Read-only: none — it is a `Badge`.
- Interactive: click or Space / Enter opens; arrow keys move; picking calls
  `onStatusChange(next)` and closes. Picking the current status calls it
  too — the row is not disabled.
- The handler owns persistence; the badge never changes on its own.

## Focus

**Keyboard focus is `focus-ring`** — a 2px `outline` at 20% of `--ring`, no offset. One utility for every control in the app, so tabbing through a form looks like one system; pointer clicks show nothing (`outline-none` + `:focus-visible`).

## Open questions

- order-status-badge.tsx:35–39 colours `new` / `shipped` / `delivered` /
  `cancelled` with Tailwind palette classes (`blue-50`, `amber-700` …) · the
  Colors section's rule is semantic tokens only; there is no
  `--status-shipped` token to use instead. Whether these four earn tokens
  or stay palette-literal is not recorded.
- order-status-badge.tsx:45 calls the transitions "forward-only" · the table
  lets `shipped → new` and `delivered → shipped` (order-status-badge.tsx:49–51),
  which is backward. The home.tsx section prose said "allowed forward
  transitions" too. The table is taken as the rule; the word is wrong.
- order-status-badge.tsx:80–81 the interactive trigger is padding-derived
  (`pt-[4px] pb-[6px]` → 27px) while the read-only `Badge` is `h-[26px]` ·
  the two forms differ by 1px in the same table column.
- The interactive trigger is a raw `DropdownMenuTrigger` with badge classes,
  not `buttonVariants` or `Badge` — a third copy of the badge box after
  `Badge` and `ContentTypeBadge`. Whether it should render `Badge` through
  `render` is not recorded.
