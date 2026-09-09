---
title: Popover
source: src/components/ui/popover.tsx
related: [menu, tooltip, datepicker, dialog]
usage:
  - nothing directly — DatePicker and Select use their own anchored popups
---

`Popover` is the anchored surface for a small piece of content that belongs to one control — an info card, a compact panel of settings — opened by click and dismissed by clicking away. It wraps base-ui's Popover; a list of actions is the `Menu`, a hint is a `Tooltip`.

## Anatomy

| Part | What it is | Wears |
|---|---|---|
| `Popover` | base-ui `Popover.Root` — the open state | — |
| `PopoverTrigger` | `Popover.Trigger`. Pass the real control through `render` (`render={<Button variant="outline" />}`) so the trigger *is* a `Button`, not a button inside a button | the control's own |
| `PopoverAnchor` | something to position against when it is not the trigger | — |
| `PopoverContent` | `Portal` (`keepMounted`) → `Positioner` (`isolate z-50`) → `Popup` | `w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md` |

The popup is **288px wide** (`w-72`) with 16px padding, on the `popover` surface — the same surface dialogs and menus use, so a popover reads as a layer of the same family. It enters with `fade-in-0 zoom-in-95` from its `--transform-origin` and slides 8px in from the side it opens on (`data-[side=bottom]:slide-in-from-top-2` and the three others).

Positioning defaults: `side="bottom"`, `align="center"`, `sideOffset={4}`. `side="right"` puts a panel beside an icon button; base-ui flips to the opposite side when the chosen one has no room.

## Usage

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Track info</PopoverTrigger>
  <PopoverContent>
    <p className="text-small font-medium leading-none">{track.title}</p>
    <p className="text-xsmall text-muted-foreground">{album.artist} · {album.title}</p>
  </PopoverContent>
</Popover>
```

Inside is plain markup: the popover sets only the surface, so a title is `text-small font-medium`, labels are `text-xsmall text-muted-foreground`, a `Separator` divides, and a `Button size="sm" className="w-full"` closes a card with its one action.

## Sizing

Fixed, no steps. `w-72` = 288px fits the narrowest column the app has — a 320px phone leaves 296 — with 4px to spare on each side. The popup does not shrink with the column, and there is no `useIsMobile` swap: a popover is a popover at every window. Pass `className="w-…"` for a wider panel.

## Behaviour

- Opens on click of the trigger; closes on outside press and Escape; focus returns to the trigger (base-ui defaults — the popover is non-modal).
- `keepMounted` on the portal keeps the popup's DOM after close, so reopening does not remount stateful content: the equaliser's sliders keep their positions.
- The positioner is `isolate z-50`, its own stacking context, so a popover over a table with sticky `z-10` headers sits above them.

## Open questions

- `DatePicker` (`date-picker.tsx:4`) imports `@base-ui/react/popover` directly and carries its own copy of the popup classes (`w-72 rounded-xl bg-popover border border-border p-4`, line 146) rather than rendering `PopoverContent`. The two match today; nothing keeps them matching.
- The wrapper itself renders only on the design-system page.
- `DESIGN_SYSTEM.md` "Context Menu" gives a menu container `w-64 … py-1 shadow-lg`; this popup is `w-72 p-4 shadow-md`. Different components, but the shadow step differs with no stated reason.
- No phone presentation. Dropdowns present as sheets below 768 (`responsive.md`); a popover stays anchored. Right for a 288px card — but not written down as a decision.
