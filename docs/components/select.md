---
title: Select
source: src/components/ui/select.tsx
related: [input, combobox, datepicker, single-select, multi-select, chips]
---

`Select` is the **form-field** dropdown: one value out of a short, fixed list,
sitting inside a form beside `Input`, `Combobox` and `DatePicker`. It wears the
same 40px pill as those controls so a form row reads as one family. It is not
the toolbar picker — sort and filter triggers above a list are `SingleSelect`
and `MultiSelect`, which are menus with a `Button`-style trigger, not fields.

## Anatomy

```tsx
<Select value={carrier} onValueChange={v => setCarrier(v ?? "")}>
  <SelectTrigger>
    <SelectValue placeholder="Pick a carrier" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="DHL">DHL</SelectItem>
    <SelectItem value="UPS">UPS</SelectItem>
  </SelectContent>
</Select>
```

Seven parts, all thin wrappers over `@base-ui/react/select`:

| Part | Renders | Own classes |
|---|---|---|
| `Select` | `SelectPrimitive.Root`, re-exported as is | — |
| `SelectTrigger` | the pill; appends the chevron after `children` | the form-control recipe, `w-fit`, `pr-2 pl-4` |
| `SelectValue` | the picked item's text, or `placeholder` | `flex flex-1 text-left` |
| `SelectContent` | portal → positioner → popup, with the scroll arrows and `List` inside | popup surface, see below |
| `SelectItem` | a row with the ✓ indicator on the right | `rounded-lg py-1.5 pr-8 pl-3 text-base font-normal` |
| `SelectGroup` / `SelectLabel` | a titled cluster of items | `scroll-my-1 p-1` / `px-1.5 py-1 text-xsmall text-muted-foreground` |
| `SelectSeparator` | a hairline | `-mx-1 my-1 h-px bg-border` |

`SelectScrollUpButton` and `SelectScrollDownButton` are exported too, but
`SelectContent` already mounts them (`select.tsx:90–92`); a call site never
adds its own.

**`onValueChange` can hand you `null`.** base-ui types the callback as
`value | null` for a single select (`@base-ui/react` 1.3.0,
`SelectRoot.d.ts:137`), which is why every app call site guards it —
`v => v && cart.setColor(line.id, v)` in `cart-drawer.tsx:292`,
`v => setCarrier(v ?? "")` in `order-detail-view.tsx:506`. Do the same rather
than casting.

## The trigger — the shared recipe in Select's costume

The pill is the form-control recipe written down once in
[DESIGN_SYSTEM.md › Form controls — the shared recipe](../../DESIGN_SYSTEM.md#form-controls--the-shared-recipe):
`h-10`, `rounded-full`, `border-border` with `hover:border-foreground/30`,
`bg-background`, the `focus-visible` ring, the asymmetric `pt-[6px] pb-[10px]`
and the shared `aria-invalid` treatment. Read that first; this section covers
only what is Select's own.

| Property | Select | Why |
|---|---|---|
| Width | `w-fit` | a field sizes to its longest option, not to its column — pass `className="w-full"` to fill a grid cell (`cart-drawer.tsx:294`, `shipping-zone-editor.tsx:167`) |
| Horizontal padding | `pl-4 pr-2` | text starts on the same 16px line as `Input`'s `px-4`; the chevron is flush at 8px because it is a glyph, not text |
| Type size | `text-small` (19px) | shared with the filter trigger; `Input`, `Combobox` and `DatePicker` are `text-base` (21px) |
| Value / icon gap | `gap-1.5` (6px) | — |
| Placeholder | `data-placeholder:text-muted-foreground` | base-ui exposes a `placeholder` state on the trigger while nothing is picked (`SelectTrigger.js:227`, `placeholder: !hasSelectedValue`), so the placeholder greys out without a class on `SelectValue` |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-50` | no `pointer-events-none` — see Open questions |
| Overflow | `whitespace-nowrap`, and the value slot forced to `line-clamp-1 flex items-center gap-1.5` via `*:data-[slot=select-value]:…` | a long label truncates inside the pill instead of wrapping it taller than 40px |

The height comes from `data-[size=default]:h-10`, not a bare `h-10`, because
the trigger has a `size` prop: `"default" | "sm"`. `sm` is `h-8` (32px) —
`data-[size=sm]:h-8` — for compact rows, and is what `QtyStepper`'s own `sm`
is sized against (`qty-stepper.tsx:17`). Nothing in the app passes it today.

### The chevron

`SelectTrigger` renders the chevron itself, **after** `children`, through
`SelectPrimitive.Icon` (`select.tsx:51–55`). A call site never adds one.

```tsx
<ChevronDownIcon className="pointer-events-none relative top-[2px] size-4 text-muted-foreground transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
```

Two things are deliberate here. `relative top-[2px]` is the optical nudge: the
6/10 padding lifts the *text* 2px, so a 16px glyph centred in the same box
would sit visibly high against it — the chevron is pushed back down the same
2px (`Combobox` and `DatePicker` do the identical thing with
`translate-y-[2px]`, `combobox.tsx:48`, `date-picker.tsx:134`). And the nudge
is a `top` offset rather than a `translate` so it does not compose with the
`rotate-180` on open — `filter-button.tsx:25–27` records why the same
chevron there keeps the two apart: a rotated translate "visually jumps the
icon mid-animation". `[[aria-expanded=true]_&]` reads the open state straight
off the trigger, so there is no extra prop or data attribute to wire.

Any other svg inside the trigger gets `[&_svg:not([class*='size-'])]:size-4`,
`shrink-0` and `pointer-events-none` — the same defaults as `Button` — so a
leading icon in a `SelectItem` that is echoed into the trigger arrives at 16px.

### Width and the popup

The popup is `w-(--anchor-width)`: exactly as wide as the trigger, with a
`min-w-36` (144px) floor. A `w-fit` trigger is therefore only as wide as its
*current* text, and a popup pinned to it can clip longer options. Two call
sites have escaped this in two different ways:

```tsx
// shipping-zone-editor.tsx:175 — size to content, never narrower than the trigger
<SelectContent className="w-auto min-w-(--anchor-width)">

// upload-music-dialog.tsx:1398 — override the variable itself
<SelectContent className="min-w-64 [--anchor-width:max-content]">
```

Both work; neither is the documented one yet (see Open questions). Until it
is, prefer the first: it keeps the popup's left edge on the trigger's and only
grows to the right.

## The popup

```tsx
<SelectContent side="bottom" sideOffset={4} align="center" alignItemWithTrigger={false}>
```

Those are the defaults (`select.tsx:63–67`). The one that matters is
`alignItemWithTrigger={false}`: base-ui's own default is `true`
(`SelectPositioner.js:49`), which overlaps the popup onto the trigger so the
picked item's text sits exactly where the value text was — the macOS-menu
behaviour. Muza's select drops **below** the pill like every other popover in
the app, so the trigger stays visible while the list is open and the popup
can animate in. `data-[align-trigger=true]:animate-none` is still on the
popup for a call site that opts back in: an overlapping popup that also zooms
would visibly slide the text it is meant to land on.

Surface and motion match `Combobox` and `DropdownMenu`:

| Property | Class | Note |
|---|---|---|
| Surface | `rounded-xl bg-popover p-1 text-popover-foreground` | a popup is a card, not a pill — `rounded-xl` here is correct |
| Edge | `shadow-md ring-1 ring-foreground/10` | a ring instead of a border so it does not add to the width |
| Height | `max-h-(--available-height) overflow-y-auto overflow-x-hidden` | base-ui measures the room to the viewport edge; the scroll arrows take over inside it |
| Enter | `data-open:animate-in fade-in-0 zoom-in-95 duration-100`, plus a 8px `slide-in-from-*` matched to `data-[side=…]` | 100ms — a field's list should feel attached, not presented |
| Stacking | `isolate z-50` on positioner *and* popup | the same pair `Combobox` (`combobox.tsx:87`) and `DatePicker` (`date-picker.tsx:139`) use, so every portalled popup in the app sits on one layer |

The portal is `keepMounted`, so the list is in the DOM while closed. The
items register with the select's store as they mount, and `SelectValue`
resolves its text from that registry (`SelectValue.js:32–51`) — so a
controlled `value` shows its label before the list has ever been opened, and
the first open is a transition rather than a mount.

The scroll arrows (`SelectScrollUpButton` / `SelectScrollDownButton`) are
`bg-popover py-1` strips with a 16px chevron, pinned `top-0` / `bottom-0` at
`z-10` inside the popup. base-ui renders each one only while the list actually
overflows in that direction, and never for a touch-opened list
(`SelectScrollArrow.js:42`, `:174`).

## Items, groups, separators

```tsx
<SelectContent>
  <SelectGroup>
    <SelectLabel>Country</SelectLabel>
    <SelectItem value="de"><MapPin className="text-muted-foreground" />Germany</SelectItem>
    <SelectItem value="uk" disabled>
      United Kingdom
      <span className="ml-auto text-2xsmall text-muted-foreground">In use</span>
    </SelectItem>
  </SelectGroup>
  <SelectSeparator />
  <SelectItem value="other">Other</SelectItem>
</SelectContent>
```

An item is `flex items-center gap-1.5 rounded-lg py-1.5 pr-8 pl-3 text-base
font-normal`. The asymmetry is the ✓: `ItemIndicator` is `absolute right-2`
in a `size-4` box, so `pr-8` (32px) reserves 8px inset + 16px glyph + 8px gap
on the right of every row, picked or not, and labels stay on one left edge
when the selection moves. The row is 21px `text-base` while the trigger is
19px `text-small` — the list is where you read, the pill is where you glance.

`ItemText` is `flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap`, so
children are laid out as a row: a leading icon (auto-sized to 16px), the label,
and anything with `ml-auto` pushed to the right edge before the ✓ — the
"In use" tag in `shipping-zone-editor.tsx:190` is exactly this.
`whitespace-nowrap` is why a long label widens the popup rather than wrapping;
pair it with the width escape above.

Highlight is `focus:bg-accent focus:text-accent-foreground` — base-ui moves
DOM focus to the highlighted item, so keyboard and pointer share one state
and there is no separate `data-highlighted` rule (Combobox carries both
because its focus stays in the input). Disabled items are
`data-disabled:pointer-events-none data-disabled:opacity-50`.

A group is `p-1` with `scroll-my-1`, so scrolling an item into view via the
arrows leaves the group's own padding visible instead of cutting the label
off. The label is `text-xsmall` (17px) muted — two steps under the item text,
so it reads as a heading without competing. A separator is `-mx-1` to run
under the popup's `p-1` from edge to edge.

## Labelling

```tsx
<div className="flex flex-col gap-1.5">
  <Label htmlFor="select-genre">Genre</Label>
  <Select>
    <SelectTrigger id="select-genre"><SelectValue placeholder="Pick a genre" /></SelectTrigger>
    …
  </Select>
</div>
```

A visible `Label` sits above the field at `gap-1.5` (6px), the same gap as an
`Input`'s hint below it. The trigger is a `<button>`, so `htmlFor` pointing at
its `id` is what a screen reader reads as the field's name; a `Label` beside
the field with no `htmlFor` is decoration. Inside a phone sheet the label is
usually dropped for space (see [Dialog](dialog.md) — the form sheet's three
bands); keep an `aria-label` on the trigger then.

## Related controls

- **`InputSelect`** (`input-select.tsx`) — an `Input` with
  `rounded-r-none -mr-px focus-visible:z-10` fused to a `SelectTrigger` with
  `rounded-l-none w-auto shrink-0`: one pill, one seam, for a price with its
  currency.
- **`Combobox`** — the same pill with a text input inside: use it when the
  list is long enough to want typing. Its focus ring is `focus-within:`
  because the ring belongs to the wrapper, not the input.
- **`SingleSelect`** / **`MultiSelect`** — toolbar pickers over a list or
  grid. Same chevron, but a `Button` or `filterTriggerCls` trigger with the
  `pb-px` nudge, not the field recipe. `home.tsx:2945` draws the line: those
  sit in toolbars, `Select` lives inside forms.

## Open questions

- `select.tsx:44` header comment claims `rounded-xl, text-base` · source says `rounded-full` and `text-small` on the same line (`select.tsx:45`). The identical stale comment in `input.tsx` was already corrected; this one was not.
- `disabled:cursor-not-allowed disabled:opacity-50` only (`select.tsx:45`) — `Input` adds `disabled:pointer-events-none` (`input.tsx:53`). Already open in `input.md`; recorded here because Select is one of the controls named there.
- `data-[size=sm]:rounded-full` and `data-[size=sm]:text-small` (`select.tsx:45`) restate the base `rounded-full` and `text-small` on the same class list — no-ops. Leftovers from a shadcn recipe where `sm` differed, or placeholders for a size that was meant to diverge?
- `size="sm"` keeps the default `pt-[6px] pb-[10px]` inside a 32px box (`select.tsx:45`); no call site passes `size="sm"` (grep over `src` and `app`), so the compact trigger has never been checked for optical centring against `Button sm` / `QtyStepper sm`, which `qty-stepper.tsx:17` says it aligns with.
- Popup width escape: `shipping-zone-editor.tsx:175` uses `w-auto min-w-(--anchor-width)`, `upload-music-dialog.tsx:1398` uses `min-w-64 [--anchor-width:max-content]`. Two solutions to one problem — one should become the rule (or a `SelectContent` prop) and the other migrate.
- Item text is `text-base` 21px (`select.tsx:121`) while the trigger is `text-small` 19px (`select.tsx:45`); `Combobox` items are also `text-base` (`combobox.tsx:149`) but its input is `text-base` too, so only Select changes size between pill and list. Intentional?
- Label-to-field gap: the design-system section and `shipping-zone-editor` use `gap-1.5` (`home.tsx:2871`), `order-detail-view.tsx:504` uses `gap-2`. Which is the rule?
- The design-system section (`home.tsx:2869–2908`) has no descriptive paragraph, unlike its `MultiSelect` and `SingleSelect` neighbours, and no `usage` links; the real call sites are `cart-drawer.tsx`, `order-detail-view.tsx`, `report-view.tsx`, `shipping-zone-editor.tsx`, `upload-music-dialog.tsx` and `input-select.tsx`.
