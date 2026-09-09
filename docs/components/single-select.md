---
title: SingleSelect
source: src/components/ui/single-select.tsx
related: [multi-select, menu, select, button]
usage:
  - Artist › Discography (sort) | /?page=Artist
---

`SingleSelect` is the toolbar picker for one value out of a few — sort order
above the Discography grid, and with a different icon any "pick one of N"
trigger (density, layout). It is a `Button` that opens a `DropdownMenu`, so it
wears the outline pill, not the form-field recipe; the form's own
single-value control is `Select`.

## Anatomy

```text
[icon]  current label  [⌄]   →   menu of options
```

**Trigger** — `DropdownMenuTrigger render={<Button variant="outline"
className="font-normal" />}`: the real `Button` at its default size (`h-10
px-[18px] text-small`), `outline` (`border-border bg-background/20
backdrop-blur-lg text-foreground hover:bg-muted hover:border-foreground/30`),
with `font-normal` overriding the button's `font-medium` — the trigger shows
a value, not a command. `Button` sizes the two glyphs to 16px
(`[&_svg:not([class*='size-'])]:size-4`) and spaces them at `gap-2`.

- **Leading icon** — `ArrowUpDown strokeWidth={1.5}` by default (the sort
  case); any node to replace it; `icon={null}` for none.
- **Label** — `label ?? current.label`: the picked option's text, or a fixed
  word when the trigger names the category and the menu carries the
  qualifier ("Recording date" → newest / oldest).
- **Chevron** — `ChevronDown strokeWidth={1.5}`.

**Popup** — `DropdownMenuContent align={align}` (default `"start"`), one
`DropdownMenuItem` per option → `onChange(value)`. Item and surface are the
app menu's (`dropdownMenuItemClass`: `rounded-lg px-2.5 py-1.5 text-base`).

Props: `value`, `options` (readonly `{ value, label }[]`), `onChange`,
`label`, `icon`, `className`, `align`. The value type is generic
(`V extends string`), so a union of sort keys stays a union through
`onChange`.

## Usage

```tsx
type Sort = "year-desc" | "year-asc" | "title-az"
const [sort, setSort] = useState<Sort>("year-desc")

<SingleSelect value={sort} onChange={setSort} label="Recording date"
  options={[
    { value: "year-desc", label: "Recording date (newest)" },
    { value: "year-asc",  label: "Recording date (oldest)" },
    { value: "title-az",  label: "Title (A–Z)" },
  ]} />
```

That is the one call site (`artist-profile-view.tsx:572`), shown only while
the Discography is in grid view.

## Sizing

**Window**, one step: **768**. The trigger is fixed — a default `Button` —
and the popup is `DropdownMenu`, a bottom sheet below the presentation gate
(see `multi-select.md` — the same surface, the same sheet). In the frame the
375 chip opens the sheet.

## Behaviour

- Pick → `onChange(value)`; the item closes the menu (default `closeOnClick`),
  and in sheet mode it is a `SheetClose`.
- Keyboard from base-ui `Menu`: arrows, typeahead on the labels, Esc.
- A `value` not in `options` shows an empty label rather than throwing.

## Open questions

- **No ✓.** The page prose said the menu "shows the current option with a
  right-side ✓", and `multi-select.tsx:132–135` states the rule "single-select
  menus use the right ✓". The source renders plain `DropdownMenuItem`s
  (`single-select.tsx:64`): nothing marks the current option in the open
  list — no indicator, no `aria-checked`, no `DropdownMenuRadioItem`. Either
  the rule or the component is wrong.
- The chevron is a bare `ChevronDown` (`single-select.tsx:60`): no `top-[2px]`
  optical nudge and no `[[aria-expanded=true]_&]:rotate-180`, unlike
  `FilterChevron` beside it in the same toolbar and `SelectTrigger`'s chevron.
  Three chevrons, two behaviours.
- Trigger recipe differs from `MultiSelect`'s: glass `bg-background/20
  backdrop-blur-lg` vs solid `bg-background`; `px-[18px]` vs `pl-4 pr-3`;
  no active state. A picked sort is arguably not "active" the way a filter
  is, but the two pills sit on one row and do not match.
- `font-normal` overrides `Button`'s label rule (DESIGN_SYSTEM.md › Font
  weight: button labels are medium). Deliberate, and undocumented until now.
- The header comment (`single-select.tsx:9`) lists Library and Orders as
  sort-button users; neither renders `SingleSelect` (grep). One call site.
