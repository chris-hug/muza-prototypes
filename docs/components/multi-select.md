---
title: MultiSelect
source: src/components/ui/multi-select.tsx
related: [single-select, menu, filter-menu, checkbox, chips, select]
usage:
  - Studio › Music filters | /?page=Music
  - Artist › Discography | /?page=Artist
---

`MultiSelect` is the toolbar filter that narrows a list or grid to a subset:
a pill trigger with a count, a menu of left-checkbox rows that stays open
while you tick, and a "Clear all" row once anything is selected. Studio ›
Music's Status / Type / Artist / Label / Monetisation filters and the
Discography's release-kind filter are it. It pairs with `SingleSelect` (one
value) and is not the form-field `Select`.

## Anatomy

**Trigger** — `filterTriggerCls(active)` from `filter-button.tsx`, the filter
recipe shared with the filter menu:

| State | Classes |
|---|---|
| base | `inline-flex items-center gap-1.5 h-10 pl-4 pr-3 rounded-full border pb-px text-small font-normal whitespace-nowrap`, the shared `focus-visible` ring |
| idle | `border-border bg-background text-foreground hover:border-foreground/30` |
| active (`selected.size > 0`) | `border-foreground/40 bg-muted text-foreground` |

Inside it: the `label`, then `FilterCount` (`min-w-[16px] h-4 px-1
rounded-full bg-foreground text-background text-2xsmall font-medium
tabular-nums`, absent at 0), then `FilterChevron` (`size-4
text-muted-foreground relative top-[2px]`, rotating 180° on
`aria-expanded`). `pb-px` rather than `Input`'s `pt-[6px] pb-[10px]` because
at `text-small font-normal` the 6/10 pair sits the text too high
(`filter-button.tsx:10–13`); `pr-3` is the "chevron plus count" right padding
from the recipe.

**Popup** — `DropdownMenuContent align="start"` with `minWidth` (default
`min-w-44`), so it is the app menu surface: `rounded-xl bg-popover p-1
shadow-md ring-1 ring-foreground/10`.

**Search band** (`searchable`) — `flex items-center gap-2 px-2.5 py-1.5 mb-1
border-b border-border`: a `size-3.5` Search glyph, a `text-xsmall` input with
`onKeyDown={e => e.stopPropagation()}` so base-ui's typeahead does not eat the
keystrokes, and a `size-3` ✕ while there is text. The list below gets
`maxOptionsHeight` (`max-h-52`) + `overflow-y-auto`; an empty result is "No
results" in `py-6 text-center text-xsmall text-muted-foreground`.

**Row** — `DropdownMenuItem closeOnClick={false} className="gap-2"` holding a
`Checkbox` that is visual only (`pointer-events-none after:hidden
tabIndex={-1}`) and the `label`, which is a `ReactNode` so a call site can put
a count `Badge` beside it (the Discography does).

**Clear row** — `DropdownMenuSeparator` + a `text-muted-foreground`
`DropdownMenuItem` labelled `clearLabel` ("Clear all") → `onChange(new Set())`.
Only while something is selected.

Props: `label`, `options` (`{ value, label, disabled? }`), `selected`
(`Set<string>`), `onChange(next: Set<string>)`, `searchable`,
`searchPlaceholder`, `maxOptionsHeight`, `clearLabel`, `minWidth`, `disabled`.

## Usage

```tsx
const [type, setType] = useState<Set<string>>(new Set())

<MultiSelect label="Type" selected={type} onChange={setType}
  options={[{ value: "album", label: "Album" }, { value: "single", label: "Single" }]} />

// Long list — the searchable shape Studio › Music uses for artists.
<MultiSelect label="Artist" searchable searchPlaceholder="Search artists…" minWidth="min-w-52"
  options={artists.map(a => ({ value: a, label: a }))} selected={artist} onChange={setArtist} />
```

Selection is a `Set` the parent owns; the component never keeps it and never
mutates it — `toggle` builds a new Set. The trigger label is **fixed**: the
count says how many, the label says what.

## Sizing

**Window**, one step: **768**, the presentation gate. The trigger itself is
fixed — `h-10`, intrinsic width, `whitespace-nowrap` — and wraps with its
neighbours in a `flex-wrap` row (`artist-profile-view.tsx:552–556` records
why: four controls overflowed a 336px row and iOS let you pan to the
overflow). The popup is `DropdownMenu`, which below 768 presents as a bottom
sheet (`useIsMobile()` in `dropdown-menu.tsx:19`): rows become `SheetClose`
buttons at `px-3 py-3 text-base rounded-xl`, the surface `rounded-t-2xl px-2
pt-3 max-h-[80vh]` with a drag handle. Inside the frame the window chip is
the window, so the 375 chip opens the sheet.

## Behaviour

- Tick → `toggle(value)`; on desktop `closeOnClick={false}` keeps the menu
  open, so three ticks are one open.
- Search filters client-side on the label when it is a string, else on the
  `value`; it clears on close and takes focus on open (one `requestAnimationFrame`
  after the menu mounts).
- The `Checkbox` is decoration: `pointer-events-none` so the row owns hover
  and click, `after:hidden` to drop the checkbox's own expanded hit area
  (the row is the target), `tabIndex={-1}` so it is not a second tab stop.
- A disabled option is a disabled `DropdownMenuItem`; `disabled` on the
  component disables the trigger.
- Open state is uncontrolled — base-ui sets `aria-expanded`, the chevron
  reads it, and `onOpenChange` is used only for the search focus / reset.

## Open questions

- **The sheet closes on every tick.** Below 768 `DropdownMenuItem` renders a
  `SheetClose` and does not forward `...props` (`dropdown-menu.tsx:157–190`),
  so `closeOnClick={false}` (`multi-select.tsx:141`) never arrives: on a phone
  every tap on an option dismisses the sheet, and picking three types is
  three opens. "The menu stays open while you toggle" holds from 768 up only.
- Header comment (`multi-select.tsx:10`) says options are `Menu.CheckboxItem`
  with `checked` + `onCheckedChange`; the body renders a plain
  `DropdownMenuItem` with a decorative `Checkbox` (`multi-select.tsx:132–150`).
  `DropdownMenuCheckboxItem` exists (`dropdown-menu.tsx:256`) and would give
  `role="menuitemcheckbox"` + `aria-checked`; today a screen reader hears a
  plain item and a checkbox it cannot reach.
- In sheet mode the row applies `[&_svg]:size-5` (`dropdown-menu.tsx:181`),
  which would size the `Checkbox`'s ✓ glyph to 20px inside its `size-4` box.
  Unverified on device; the desktop popup has no such rule.
- The search matches `typeof o.label === "string" ? o.label : o.value`
  (`multi-select.tsx:79`). The Discography passes ReactNode labels, so a search
  there would match the internal kind key, not the visible word. Latent —
  only `studio-music.tsx:345` passes `searchable` today.
- Two height caps, three paths: `searchable` sets `max-h-52` on the list; an
  unsearchable list relies on `DropdownMenuContent`'s
  `max-h-(--available-height)`; the sheet on `max-h-[80vh]`.
- The trigger is `filterTriggerCls` (solid `bg-background`, `pb-px`,
  `pl-4 pr-3`) while `SingleSelect` beside it in the same toolbar is
  `Button variant="outline"` (`bg-background/20 backdrop-blur-lg`, `px-[18px]`).
  Two pill recipes on one row (`artist-profile-view.tsx:557–579`).
