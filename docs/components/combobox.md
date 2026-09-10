---
title: Combobox
source: src/components/ui/combobox.tsx
related: [select, input, multi-select, chips]
usage:
  - Upload music → Upload as | /?page=Music
---

`Combobox` is the form field for a long list — a country, an artist or label
to upload as — where typing beats scrolling: the pill is an input with a
chevron, and the popup filters as you type. It shares the form-control recipe
with `Input` and `Select`; reach for it over `Select` once the list runs past
a dozen rows.

## Anatomy

Eight exports over `@base-ui/react/combobox`: `Combobox` (the Root, re-exported
as is), `ComboboxValue`, `ComboboxTrigger`, `ComboboxContent`, `ComboboxGroup`,
`ComboboxGroupLabel`, `ComboboxItem`, `ComboboxSeparator`.

**Trigger** — `ComboboxPrimitive.InputGroup` wearing the pill: `relative flex
w-full items-center rounded-full border border-border bg-background h-10 px-3
pt-[6px] pb-[10px] gap-2 hover:border-foreground/30 focus-within:border-ring
focus-ring-within`. Inside: a `size-4
text-muted-foreground translate-y-[2px]` search glyph (`showSearchIcon`,
default on), the input (`flex-1 bg-transparent text-small font-normal
placeholder:text-muted-foreground`), and the chevron button (`tabIndex={-1}`,
`ChevronDownIcon relative top-[2px] size-4`, rotating on `aria-expanded`).

Where it departs from `Input`, and why:

| Property | Combobox | Reason |
|---|---|---|
| Horizontal padding | `px-3` | with the glyph and `gap-2` the text starts at 12 + 16 + 8 = 36px — near `Input`'s `pl-10` for an icon field, not its plain `px-4` |
| Focus | `focus-within:` | the ring belongs to the wrapper: focus is on the inner input, the pill is the group |
| Chevron nudge | `top-[2px]`, glyph `translate-y-[2px]` | the 6/10 pair lifts the text 2px; the glyphs are pushed back down to meet it (`Select` and `DatePicker` do the same) |
| Invalid / hint | none | see Open questions |

**Popup** — `ComboboxPrimitive.Popup` in a `keepMounted` portal, positioner
`isolate z-50`, `sideOffset` 4: `w-(--anchor-width) min-w-48 rounded-xl
bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10
duration-100`, entering with `fade-in-0 zoom-in-95` and an 8px slide from the
side it opens on. It holds the `List` and an `Empty` ("No results found.",
`py-4 text-center text-small text-muted-foreground`) that base-ui shows only
when the filtered list is empty.

**Item** — `relative flex w-full cursor-default items-center gap-2 rounded-lg
px-2.5 py-1.5 text-small font-normal`, highlighted by both `focus:bg-accent`
and `data-highlighted:bg-accent` (see Behaviour), `data-disabled:opacity-50`,
inner svgs auto-sized to 16px. The ✓ is `ItemIndicator` at `ml-auto` — in
flow, on the right; `hideIndicator` removes it for rows that carry their own
trailing chrome (the upload dialog's avatar rows).

**Group label** `px-2.5 py-1.5 text-xsmall font-normal text-muted-foreground`;
**separator** `-mx-1 my-1 h-px bg-border`.

## Usage

```tsx
<Combobox
  items={COUNTRY_CODES}
  itemToStringLabel={c => countryName(String(c))}
  value={country}
  onValueChange={v => v && setCountry(String(v))}
>
  <ComboboxTrigger placeholder="Search countries…" />
  <ComboboxContent className="max-h-[280px] overflow-y-auto">
    {(code: string) => (
      <ComboboxItem key={code} value={code}>{countryName(code)}</ComboboxItem>
    )}
  </ComboboxContent>
</Combobox>
```

**Filtering needs both `items` on the root and a function child on
`ComboboxContent`** (`combobox.tsx:70–75`): base-ui filters only then. Static
`<ComboboxItem>` children render every row whatever is typed — a dropdown, not
a combobox. The country fields (`cart-drawer.tsx:557`,
`shop-settings-view.tsx:420`) and the release picker
(`vinyl-create-listing.tsx:187`) use the pair; the upload dialog's "Upload as"
(`upload-music-dialog.tsx:940`) uses static grouped children with a controlled
`inputValue`, a short list where filtering is not the point.

`itemToStringLabel` is what the input shows once an item is picked (a code
becomes a name). `onValueChange` can hand back `null`, as `Select`'s does —
guard with `v && …`.

## Sizing

### The size ladder

`size` is `"sm"` (32px) · `"default"` (40px) · `"lg"` (48px) — the shared ladder
from `src/lib/control-size.ts`, the same one `Button` and every other form
control takes, so a large button gets a large field beside it. Type stops
climbing at `default`: 19px at both `default` and `lg`, 16px at `sm`. See
DESIGN_SYSTEM.md › Form controls › One size ladder, and the *"One size ladder —
every control, every step"* example on the design-system page.

The pill is `w-full` and fills its column; the popup is the
trigger's width with a `min-w-48` (192px) floor. It reads none of the three
measures. The popup has **no height cap of its own** — every long-list call
site writes `max-h-[280px] overflow-y-auto` on `ComboboxContent`, which is
five rows and a half at `py-1.5`, enough to show there is more.

The inner input carries `min-w-0`, which is load-bearing rather than tidy: a
flex item's `min-width` is `auto` and an `<input>`'s intrinsic width is about
189px, so `flex-1` alone could not shrink it. Every Combobox narrower than
~230px used to push its own input and chevron out past the pill's right edge —
found by putting three of them in a 170px column in the size-ladder example.

Below the presentation gate the list is a **bottom sheet**, like `Select` and
`DatePicker`. A `w-(--anchor-width)` popup is a desktop shape: it inherits the
field's width and opens beside it, which on a phone means a narrow list
halfway up the screen, away from the thumb, with the keyboard about to cover
whatever is left. Same two class strings the other two import from
`dialog.tsx` — one definition, three surfaces.

## Behaviour

- Typing filters (with `items`); ↑ / ↓ move the highlight while DOM focus
  stays in the input — which is why the item carries both `focus:` and
  `data-highlighted:` rules, where `Select` (which moves focus to the item)
  needs only `focus:`.
- The chevron toggles the list and is `tabIndex={-1}`: the input is the one
  tab stop.
- Enter picks the highlighted item, Esc closes; the ✓ marks the picked item
  when the list reopens.
- The "No results found." row is base-ui's `Empty`, rendered only when the
  filtered list is empty.

## Focus and motion

The **shell** owns the ring: `focus-ring-within`, because the caret lives in an `<input>` inside it. Same 2px outline at 20% of `--ring` that `focus-ring` draws elsewhere.

**Colour changes fade through `state-fade`** — `color, background-color, border-color, outline-color, opacity` on `cubic-bezier(0.2,0,0,1)`, 440ms in and 100ms out. The split needs no second mechanism: the transition that runs on the way in is the one declared on `:hover`, the one on the way out is the one on the element. The options carry it, so the highlight eases as you arrow through the list.

## Open questions

- `ComboboxTrigger` accepts no `id` (`combobox.tsx:29–33`), so `<Label
  htmlFor="addr-country">` (`cart-drawer.tsx:556`) and `htmlFor="tax-residency"`
  (`shop-settings-view.tsx:419`) point at nothing and the field has no
  accessible name from its label. Pass `id` (and `aria-label`) through to the
  input.
- No height cap in the component: `Select`'s popup is
  `max-h-(--available-height)`; here every long list writes `max-h-[280px]
  overflow-y-auto` by hand. Move the cap in, or write 280 down as the rule.
- Three floors for one surface: `min-w-48` here, `min-w-36` on `Select`,
  `min-w-44` on `DropdownMenu`.
- Item padding is `px-2.5` with the ✓ in flow (`ml-auto`); `Select`'s is
  `pl-3 pr-8` with an absolute ✓ that reserves its room on every row. The two
  lists sit 2px apart on the left and reserve differently on the right.
- No `aria-invalid` styling and no `hint` — the only member of the form
  family that cannot show an error inline. Country is required at checkout;
  how is a missing one shown?
- The file's own header `Usage` block (`combobox.tsx:16–23`) shows static
  children, which do not filter; a reader copying it gets a dropdown.
- `ComboboxValue` is exported and used nowhere.
