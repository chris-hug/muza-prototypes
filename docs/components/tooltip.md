---
title: Tooltip
source: src/components/ui/tooltip.tsx
related: [button, popover]
usage:
  - Report — chart legend | /?page=Wallet
  - Vinyl — create listing, field help | /?page=Shop
---

`Tooltip` is the small ink label that appears over a control on hover or
keyboard focus — the name of an icon button, a keyboard shortcut, the reason
a button is disabled. It is pointer and keyboard only: a touch never opens
it, so nothing a phone user needs may live only in a tooltip.

## Anatomy

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Search"><Search /></Button>} />
    <TooltipContent side="bottom">Search · ⌘K</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Four parts over `@base-ui/react/tooltip`:

| Part | Renders | Own classes / defaults |
|---|---|---|
| `TooltipProvider` | base-ui's delay group | **`delay={0}`** (`tooltip.tsx:8`) — base-ui's own default is 600ms |
| `Tooltip` | the root, re-exported | — |
| `TooltipTrigger` | the trigger; `render` swaps in the real control | — |
| `TooltipContent` | portal → positioner → popup → arrow | `side="top"`, `sideOffset={4}`, `align="center"` (`:30–33`) |

The popup (`:53`): `inline-flex w-fit max-w-xs rounded-md bg-foreground
px-3 py-1.5 text-xsmall text-background`, with a 100-ish ms
`fade-in-0 zoom-in-95` plus an 8px slide from the side it opens on. Ink on
the page's own background inverted — `bg-foreground text-background` — so a
tooltip is legible on any surface without a border, in both themes. The
arrow is a `size-2.5` rotated square in the same `bg-foreground`,
translated onto the popup's edge per side (`:59`). `max-w-xs` (320px) wraps
a long sentence rather than letting it run across the screen.

A `kbd` child (`data-slot=kbd`) gets `pr-1.5` on the popup and its own
rounding — the "⌘K" case.

## Usage

```tsx
// A disabled button cannot receive pointer events — wrap it
// vinyl-create-listing.tsx:1119–1128
<TooltipProvider delay={200}>
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      {button}
    </TooltipTrigger>
    <TooltipContent side="bottom">Finish shop setup to publish. Save Draft in the meantime.</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

That is the one call site in the app. Pass the real control through
`render` so the trigger *is* the button (no extra wrapper in the DOM, focus
and hover land on one element). A tooltip never replaces an `aria-label`
on an icon button — it is the visual copy of it.

## Sizing

Fixed, no steps. The popup is `w-fit` up to `max-w-xs`; base-ui flips
`side` when there is no room on the requested one.

## Behaviour

- Opens on **hover** (`mouseOnly` — a touch does not count) after the
  delay, and on **keyboard focus** immediately; closes on leave, blur or
  Escape.
- Inside one `TooltipProvider` the delay is shared and, once one tooltip is
  open, moving to a sibling opens it instantly — a row of icon buttons
  reads as one surface.
- `delay` lives on the **trigger** in base-ui 1.3 (`TooltipTrigger.d.ts:33`)
  and on the provider; a trigger's own value wins.

## Open questions

- Delay: the wrapper's `TooltipProvider` defaults to `0` (`tooltip.tsx:8`),
  the old page demo used that, the one app call site passes `200`, and
  base-ui without a provider waits 600. An instant tooltip on every hover
  is a flicker on a dense toolbar; the app's 200ms looks like the intended
  value and should probably be the wrapper's default.
- `report-view.tsx:412` and `:427` render a `<Tooltip>` — that is Recharts'
  chart tooltip, not this component. Same name, different thing; a grep for
  call sites over-counts by two.
- Only one real use in the app, and every icon button elsewhere relies on
  `aria-label` alone with no visible name. Whether icon buttons *should*
  carry tooltips as a rule is not written down anywhere.
