---
title: DatePicker
source: src/components/ui/date-picker.tsx
related: [input, select, combobox, popover]
usage:
  - Vinyl — create listing, release date | /?page=Shop
---

`DatePicker` is the form field for one calendar date: the shared 40px pill as
its trigger, and a popover calendar drawn from Muza tokens with no date
library behind it. In the app it dates a scheduled Shop listing.

## Anatomy

```tsx
const [date, setDate] = useState<Date | undefined>()
<DatePicker id="release-date" value={date} onChange={setDate} placeholder="Pick a release date" />
```

| Prop | Type | Note |
|---|---|---|
| `value` | `Date \| undefined` | controlled; there is no `defaultValue` |
| `onChange` | `(date: Date \| undefined) => void` | `undefined` from **Clear** |
| `placeholder` | `string` | default `"Pick a date"` |
| `disabled` | `boolean` | disables the trigger only |
| `id` | `string` | goes on the trigger — pair it with a `Label htmlFor` |
| `className` | `string` | lands on the trigger |

Four regions, top to bottom, inside a `PopoverPrimitive` from base-ui (the
raw primitive — not the app's `Popover` wrapper):

**Trigger** — the form-control recipe from DESIGN_SYSTEM.md › Form controls:
`h-10 rounded-full border border-border hover:border-foreground/30
bg-background`, the `focus-visible` ring, `pt-[6px] pb-[10px]` for the 2px
optical lift, `text-small font-normal`, `disabled:opacity-50`. Its own
choices: `w-full` (a field in a form grid; `Select` is `w-fit`), `px-3`, and
`text-muted-foreground` while empty. The `CalendarIcon` sits `size-4
translate-y-[2px]` — the same nudge `Combobox` gives its chevron, so the glyph
meets the lifted text at its optical centre.

**Month bar** — `ChevronLeft` / `ChevronRight` buttons at `p-1 rounded-lg
hover:bg-accent` with `aria-label`s, the month name `text-small font-medium
text-foreground` between them.

**Grid** — a `grid-cols-7`. Day headers are `h-8 text-xsmall font-medium
text-muted-foreground` (Su … Sa). Day cells are `h-8 w-full rounded-lg
text-small` and wear one of three looks:

| State | Classes |
|---|---|
| selected | `bg-primary text-primary-foreground font-medium` |
| today, not selected | `border border-border text-foreground hover:bg-accent` |
| any other day | `text-foreground hover:bg-accent` |

Blank leading and trailing cells are empty `div`s so every row has seven.

**Footer** — `border-t border-border`, **Today** on the left (`Button ghost
sm`, its `text-2xsmall` raised to `text-xsmall`), **Clear** on the right,
rendered only while a value is set.

The popup is `w-72 rounded-xl bg-popover border border-border p-4 shadow-md
ring-1 ring-foreground/10`, `data-open:animate-in fade-in-0 zoom-in-95
duration-150`, positioned `side="bottom" align="start" sideOffset={6}` in a
`keepMounted` portal at `isolate z-50`.

```text
popup            288px (w-72)
padding          2 × 16 = 32px
column           (288 − 32) / 7 ≈ 36.6px, rows 32px (h-8) + 2px gap
```

## Usage

```tsx
<div className="flex flex-col gap-1.5 w-60">
  <Label htmlFor="release-date">Release date</Label>
  <DatePicker id="release-date" value={date} onChange={setDate} placeholder="Pick a release date" />
</div>
```

The trigger is a `<button>`, so `Label htmlFor` → `id` is what names the
field for a screen reader; a `Label` beside it without the pair is
decoration. In the app the pair comes from `Field` in
`vinyl-create-listing.tsx:950`. The value displays as `April 14, 2026`
(`formatDate`, English month names).

## Sizing

### The size ladder

`size` is `"sm"` (32px) · `"default"` (40px) · `"lg"` (48px) — the shared ladder
from `src/lib/control-size.ts`, the same one `Button` and every other form
control takes, so a large button gets a large field beside it. Type stops
climbing at `default`: 19px at both `default` and `lg`, 16px at `sm`. See
DESIGN_SYSTEM.md › Form controls › One size ladder, and the *"One size ladder —
every control, every step"* example on the design-system page.

The trigger fills whatever column it is given (`w-full`);
the popup is always 288px and always a popover — there is no sheet below 768,
the same as `Select` and `Combobox`: field popups do not swap presentation,
menus do.

## Behaviour

- The visible month is local state (`viewYear` / `viewMonth`), seeded from
  `value` or today; the arrows step it, wrapping the year.
- Picking a day calls `onChange(new Date(viewYear, viewMonth, day))` — local
  midnight — and **leaves the popover open**; the popover closes on outside
  click or Escape. **Today** jumps the view to the current month and selects
  it; **Clear** calls `onChange(undefined)`.
- Keyboard: the trigger opens on Enter / Space; inside, every day is a plain
  `<button>`, so Tab walks the cells one at a time. There are no arrow-key
  moves across the grid, no `role="grid"`, no `aria-selected`.
- No `min` / `max`, no disabled days, no range.

## Open questions

- Horizontal padding is `px-3` (`date-picker.tsx:123`) · the recipe and
  `Input` use `px-4`, `Select` `pl-4`; a date beside an input starts 4px
  further left.
- The popup carries both `border border-border` and `ring-1
  ring-foreground/10` (`date-picker.tsx:146–147`) · `Select`, `Combobox` and
  `DropdownMenu` popups use the ring alone. One extra pixel of edge on this
  popup only.
- Picking a day keeps the popover open (`selectDay` only calls `onChange`,
  `date-picker.tsx:83–86`) · `Select` and `Combobox` close on pick. A second
  tap or an outside click is needed to finish — intentional, to allow a
  correction, or an omission?
- Week starts on Sunday and months are English (`DAYS` / `MONTHS`,
  `date-picker.tsx:22–26`), with no locale prop · the `Input type="time"`
  beside it in `vinyl-create-listing.tsx:954` follows the browser locale, so
  the two halves of "Date · Time" can disagree on convention.
- `Today` / `Clear` override `Button size="sm"`'s `text-2xsmall` to
  `text-xsmall` (`date-picker.tsx:217, 231`) — the only place a `sm` button
  is re-sized.
- The design-system page (`home.tsx:1707–1770`) kept a hand-built static copy
  of the popup — a second render of the same markup that had already drifted
  (Clear shown with no value). Removed; the popup now opens from the real
  trigger in the frame.
