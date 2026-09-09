---
title: NumberField
source: src/components/ui/qty-stepper.tsx
related: [input, select, button]
usage:
  - Orders › Refund (quantity) | /?page=Orders
---

`QtyStepper` is the − / count / + control for a quantity — cart lines, refund
quantities, anything with a small integer that is stepped rather than typed.
It is sized to the form-control family (40px beside an `Input`, 32px beside
the `sm` sizes) and is base-ui's `NumberField` underneath, so clamping,
boundary disabling and keyboard stepping come from the primitive, not from
hand-kept `atMin` / `atMax` flags.

## Anatomy

```tsx
<NumberField.Root value min max step disabled className="shrink-0">
  <NumberField.Group className="flex items-center gap-0.5 border border-border rounded-full px-1 h-10">
    <NumberField.Decrement aria-label="Decrease quantity"><Minus /></NumberField.Decrement>
    <NumberField.Input readOnly className="text-center text-small tabular-nums" />
    <NumberField.Increment aria-label="Increase quantity"><Plus /></NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

| Part | Classes | Why |
|---|---|---|
| Group (the pill) | `flex items-center gap-0.5 border border-border rounded-full px-1` + the size's height; `block` adds `w-full justify-between`; disabled adds `opacity-50 pointer-events-none` | the border is the same hairline as `Input`; `px-1` is the 4px ring between the pill and the round buttons |
| − / + | `flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors` + the size's box | round, so the hover fill is a disc inside the pill; muted until hovered, so the number is what you read |
| Value | `bg-transparent text-center text-small text-foreground tabular-nums outline-none border-0 cursor-default` + the size's `min-w` | `text-small` (19px) matches `SelectTrigger`'s text, one step under `Input`'s `text-base`; `tabular-nums` so 9 → 10 does not nudge the buttons |

Two sizes, both derived from a neighbour rather than chosen:

| `size` | Pill | Button | Glyph | Value floor | Pairs with |
|---|---|---|---|---|---|
| `default` | `h-10` (40px) | `size-8` | `size-3.5` | `min-w-[20px]` | `Input`, `SelectTrigger`, `Button` default |
| `sm` | `h-8` (32px) | `size-6` | `size-3` | `min-w-[16px]` | `Button` `sm`, `SelectTrigger` `sm` |

A `size-8` button in an `h-10` pill with `px-1` leaves 4px on every side of
the disc — the hover fill never touches the border.

Props: `value` / `onChange` (controlled, required), `min` (default **1**),
`max` (none), `step` (1), `disabled`, `size`, `block`, `className`,
`ariaLabel` — the suffix for the two buttons' labels, "Decrease quantity for
Sun Ra T-shirt"; without it, "Decrease quantity".

## Usage

```tsx
// Cart line — fills its grid cell beside the price input.
<QtyStepper value={line.qty} onChange={n => cart.setQty(line.id, n)}
  max={line.stock ?? Number.POSITIVE_INFINITY}
  ariaLabel={`quantity for ${line.productTitle}`} block />

// Refund row — compact, and zero is a legal answer.
<QtyStepper size="sm" value={qty} min={0} max={max} onChange={setQty}
  ariaLabel={`Refund quantity for ${item.title}`} />
```

Those are the two call sites (`cart-drawer.tsx:327`, `refund-flow.tsx:149`).

## Sizing

Fixed, no steps. The control is intrinsic (`shrink-0`): two fixed discs plus
a value that widens with its digits. `block` makes the root `w-full` and
spreads − / value / + across the parent, which is how the cart's 2 × 2
price / quantity grid keeps the stepper as wide as the price field beside it.
It reads none of the three measures.

## Behaviour

- − / + step by `step` and clamp to `min` / `max`; base-ui disables the button
  at the boundary, so at `max` the + sits at `opacity-40` with no hover fill.
- Keyboard, with the value focused: ↑ / ↓ step, PgUp / PgDn take the large
  step, Home / End jump to the bounds — all from the primitive.
- The value is `readOnly` (`qty-stepper.tsx:100`): typing does nothing, by
  design — "typing 999 in a stepper feels wrong" for a cart line. Focus still
  lands on it, which is what makes the keyboard steps work.
- `onValueChange` hands `null` for an empty field; the wrapper maps that to
  `min` (`qty-stepper.tsx:71`). With a read-only input that path only fires
  programmatically.
- `disabled` is applied twice — on the primitive (buttons and input) and as
  `pointer-events-none opacity-50` on the group — so the whole pill fades,
  not just the discs.

## Open questions

- The section is titled **NumberField** and its id is `numberfield`; the
  component is `QtyStepper` in `qty-stepper.tsx`. The title names the base-ui
  primitive, not the export — no other section does. Rename the section, or
  export a `NumberField` alias?
- Header comment (`qty-stepper.tsx:8–9`) lists "text-entry through the inner
  input (clamped to min/max)" and "mouse-wheel + scrub gestures" among what
  base-ui gives. The input is `readOnly` and no `NumberField.ScrubArea` is
  mounted, so neither is wired. The list describes the primitive, not the
  component.
- `min` defaults to 1 (a cart line cannot reach zero — removal is a separate
  action), and the refund flow passes `min={0}`. Both are right, but the
  default was undocumented until now and a new call site may expect 0.
- `size="sm"` is documented as aligned with `SelectTrigger` `sm`, which no
  call site uses (see `select.md`); `Button` `sm` is its only real neighbour
  today (refund rows).
- `ds-sources.ts` had no `numberfield` entry, so the section showed no
  "Changed" date and no source link; added in this pass. The id still does
  not match the file name.
- The buttons have `hover:` states and no `active:` state, so on touch a tap
  gives no visual feedback at all; the sheet menu rows use `active:bg-muted`
  for exactly this.
