---
title: Input
source: src/components/ui/input.tsx
related: [select, combobox, datepicker, chips, button, dialog, chip-input, otp-input]
usage:
  - Settings | /?page=Settings
  - Playlists → Create playlist | /?page=Playlists
  - Upload music | /?page=Music
---

`Input` is the single-line text field. It is the reference **form control**:
Select, Combobox, DatePicker and the filter trigger all share its 40px pill,
its border, its focus ring and its optical-centring padding, so a row of mixed
controls reads as one family. Everything an input needs around itself — a
leading icon, a clear button, helper or error copy — is a **prop**, not a
hand-rolled wrapper, so the field owns the padding those affordances cost.

## Anatomy

```tsx
// Plain field — nothing but the <input>. Zero wrappers.
<Input placeholder="Playlist name" aria-label="Playlist name" />

// Helper copy below the field.
<Input placeholder="e.g. Kendrick Lamar" hint="Your public display name on Muza." />

// Validation — flips the hint destructive and announces it as an error.
<Input type="email" aria-invalid="true" hint="Enter a valid email address." hintTone="error" />

// Search field — icon in, clear ✕ out once there is a value.
<Input startIcon={<Search />} value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ("")} />
```

The component renders **one of three shapes**, chosen only by which props are
present, and every extra layer is additive — a call site that passes none of
them gets a bare `<input data-slot="input">` and nothing else:

| Props present | DOM |
|---|---|
| none | `<input data-slot="input">` |
| `startIcon` and/or `onClear` | `<div data-slot="input-affordances" class="relative w-full min-w-0">` around the input, with the icon `<span>` and/or the clear `<button>` overlaid |
| `hint` | `<Field.Root data-slot="input-wrapper" class="flex flex-col gap-1.5 w-full">` around whichever of the two above applies, plus the hint |

The wrapper is `min-w-0` because a grid or flex item defaults to
`min-width: auto`; without it a wide placeholder or a long value would force
the field to overflow its column instead of shrinking with it.

## The form-control recipe

`FIELD_CLS` in `input.tsx` is the recipe the other controls copy — Input,
Select, Combobox, DatePicker and the filter trigger are one control in five
costumes. The shared recipe (the `sm` / `default` / `lg` height and type
ladder, `rounded-full`, `border-border` with `hover:border-foreground/30`,
`bg-background`, the `focus-visible` ring, `text-small font-normal`, the
asymmetric optical-lift padding, the right-padding variants and the
`className`-lands-on-the-input rule) is
written down once, in
[DESIGN_SYSTEM.md › Form controls — the shared recipe](../../DESIGN_SYSTEM.md#form-controls--the-shared-recipe).
Do not restate it per control; this section covers only what is Input's own.

Where Input differs from its siblings:

| Property | Input | Siblings |
|---|---|---|
| Horizontal padding | `CONTROL_PAD_X` — `px-3` / `px-4` / `px-5` | Select takes only the left half of it (`pl-3`/`pl-4`/`pl-5`) because `pr-2` stays flush to the chevron; Combobox and DatePicker are one step tighter at every size, having a glyph on each edge |
| Size prop | `sm` · `default` · `lg` | `SelectTrigger`, `ComboboxTrigger`, `DatePicker`, `ChipInput` and `Button` take the same three. `Textarea` takes none — it is a box, not a pill, with no peer height to match |
| Type size | `text-small` (19px) | the whole family sits here now — Select, Combobox, DatePicker, Textarea, ChipInput and `Button` `default` |
| Focus | `focus-visible:` | Combobox uses `focus-within:` (the ring belongs to the wrapper) |
| Disabled | `disabled:pointer-events-none` **plus** `cursor-not-allowed opacity-50` | Select, Combobox and DatePicker carry only the cursor and the 50% fade |
| Invalid | `aria-invalid:border-destructive invalid-ring`, dark `border-destructive/50` | shared with Select, Textarea, Checkbox, Radio and Switch. `invalid-ring` is a 2px outline at 20% of `--destructive` (40% in dark, where `--destructive` is `red-900` and 20% of it against a near-black field is a warning nobody sees) — the same geometry `focus-ring` draws, so focused-and-invalid can only ever differ in colour |

**The default is `lg` (48px).** A field renders at 48 unless a call site asks
for another step, and every button in a form block asks for `lg` with it, so a
field and its action stay one row. `default` (40px) is still on the ladder and
still reachable by prop — it was the desktop-first number, and it is no longer
what you get by not choosing.

Why the two agree at all: the height is also Button `lg`, so an input
and its action sit on the same baseline without per-row fixes — a row like
`<Input /> <Button>Invite</Button>` needs no height overrides (commit
`9f31908` aligned Button to the input height, not the other way round). The
`lg` button is 48px; where a field sits beside one, the field is bumped to
`h-12` at the call site (the Add-music find band does this).

The shape is a pill, `rounded-full`, and has been since the first commit. The
file's header comment used to say `rounded-xl` — a leftover from the Figma
node 65:533 spec that was never what shipped — and now says `rounded-full`,
matching the class and the Design System's recipe.

### Optical centring — `pt-[6px] pb-[10px]`

The vertical padding is deliberately **asymmetric**. Founders Grotesk sits low
in its em box, so symmetric padding leaves the glyphs visibly below the
centre of a 40px pill; 6 over 10 lifts them by 2px onto the optical centre.
The arithmetic:

```text
h-10 box                40px  (border-box)
minus 1px border ×2     38px
minus pt 6 + pb 10      22px  content
line box (19px × 1.5)   28.5px
```

The line box is taller than the content area, so the text is not boxed in by
the padding — the padding only decides where the box sits. Symmetric 8/8 would
centre it; 6 over 10 moves it **up 2px** onto the optical centre. Select, Combobox and DatePicker carry
the same pair so a mixed row keeps one text baseline. The same nudge appears
as `pb-px` on Button, Tabs, Chip and Badge — a smaller lift for a heavier
weight and a shorter line box.

It is a **text-small / font-normal** recipe. The filter trigger and Chips use
the Button-style `pb-px` nudge instead — `filter-button.tsx:10`
records that the 6/10 pair "sits too high for chips because the lighter
`font-normal` weight exposes more empty space above the glyphs than below".
Do not mix the two recipes inside one control.

## `className` lands on the `<input>`, not the wrapper

`className` is merged into the **field's** class list, after `FIELD_CLS` and
after the affordance padding (`input.tsx:69–75`). It never reaches
`data-slot="input-affordances"` or `data-slot="input-wrapper"`. The Design
System's Form-controls section states the same rule; this is the long form.

```tsx
// Sizing and surface overrides belong on the field — this is what className is for.
<Input startIcon={<Search />} onClear={clear} className="h-12 bg-popover shadow-lg" />

// Positioning does NOT. This makes the <input> absolute *inside* its own
// relative wrapper; the icon and ✕ stay put and the field slides out from
// under them. Position the parent element instead.
<Input startIcon={<Search />} className="absolute inset-x-0 bottom-0" />   // wrong
<div className="absolute inset-x-0 bottom-0"><Input startIcon={<Search />} /></div>
```

The consequence: any `absolute`, `fixed`, `inset-*`, `mx-*` or `w-*` meant for
the *box the field occupies* must go on an element **you** own around the
`Input`. The wrapper is `w-full`, so it fills whatever you give it. This rule
exists because of a real bug: an `absolute` class was put on the `Input`
itself rather than on the box around it, which detached the field from its
wrapper while the ✕ and icon stayed behind.

Overrides that *do* belong on `className`: `h-9` / `h-12` (height), `flex-1`
and `max-w-*` (how the field shares a row), `bg-popover shadow-lg` (surface
when the field floats over content), `rounded-r-none -mr-px` (the seam in
`InputSelect`).

## Affordances — `startIcon` and `onClear`

Both overlay the field from the outside; the field reserves the room:

| Prop | Overlay | Field padding |
|---|---|---|
| `startIcon` | `absolute left-4 top-1/2 -translate-y-1/2`, `text-muted-foreground`, glyph forced to `[&_svg]:size-4` (16px), `aria-hidden`, `pointer-events-none` | `pl-10` (40px) |
| `onClear` | `<button type="button" aria-label="Clear">` with an `<X />`, `absolute right-3 top-1/2 -translate-y-1/2`, `text-muted-foreground hover:text-foreground focus-visible:text-foreground` | `pr-10` (40px) |

The reservation is 40px on both sides but the arithmetic differs: on the left
it is 16px gutter + 16px glyph + 8px gap; on the right the ✕ sits at
`right-3` (12px), so it is 12px inset + 16px glyph + 12px gap. The icon sits
at the same `left-4` as the text would, so an icon field and a plain field
keep the same left rhythm — only the text moves.

`onClear` is not a "show a ✕" switch: the button renders only while
`props.value` is truthy (`showClear = !!onClear && !!props.value`,
`input.tsx:63`). It therefore needs a **controlled** field — with
`defaultValue` the prop is never read and the ✕ never appears. The button is
`type="button"` so it cannot submit an enclosing form, and it is a real button
so it is reachable by keyboard.

Pass the icon **bare** (`startIcon={<Search />}`); the slot sets the size.
Passing a pre-sized `<Search className="size-5" />` fights the `[&_svg]:size-4`
rule and the outcome depends on class order.

Why props and not a per-call-site wrapper: before `699e4da` every search field
re-rolled the same `relative` box, the same `absolute left-4` icon and the same
`pl-10 pr-9` overrides. The Input owns the padding the affordances cost, so a
new search field cannot get the reservation wrong. `LibrarySearchField`
(`src/components/app/library-search-field.tsx`) still hand-rolls the wrapper
with `h-9 pl-10 pr-9` — a migration candidate, not a second pattern.

## Hints — `hint` and `hintTone`

```tsx
<Input hint="Used as your URL slug." />
<Input aria-invalid="true" hintTone="error" hint="Enter a valid email address." />
```

A hint is `text-2xsmall leading-snug` (15px) in `text-muted-foreground`,
`gap-1.5` (6px) under the field. At 15px it is the smallest sanctioned step,
which keeps it clearly subordinate to the 19px field text without dropping
under the type floor.

With `hint` present the field is wrapped in base-ui `Field.Root`, which is
what wires the hint's generated id into the input's `aria-describedby` — no
`useId` at the call site. `hintTone="error"` renders `Field.Error match={true}`
in `text-destructive` instead of `Field.Description`, so screen readers announce
it as a validation message rather than a description. `hintTone` colours the
copy only; the field's red border and ring come from `aria-invalid`, which the
call site still sets (Textarea sets it for you from `hintTone`; Input does not).

Textarea mirrors the same `hint` / `hintTone` API by hand (no base-ui
Textarea primitive), so helper copy under a text area looks and reads the same.

## Sizing

Fixed, no steps. The pill is 40px tall and `w-full`: it fills whatever box
the call site gives it and reads none of the three measures — the only
horizontal numbers it owns are the affordance reservations (`pl-10` /
`pr-10`). What narrows a field is its container: a phone sheet's 12px gutter,
a dialog's column, a grid cell. The one height step is a call-site override
— `h-12` where the field sits beside a `lg` button (the Add-music find band),
`h-9` in the one toolbar field that has not migrated (see Open questions).

## In a sheet

Inside a phone sheet the field is usually the only thing the sheet asks for,
so it takes focus on open and drops its label (see [Dialog](dialog.md) — the
form sheet's three bands). Keep the `aria-label`. When a search field floats
alone over a list it gets `bg-popover shadow-lg` via `className`, and loses
both again the moment a second control joins the band; the *band* is what
moves, never the field, because re-parenting the input remounts it and throws
away focus.

## Related controls

- **`InputSelect`** — an `Input` with `rounded-r-none -mr-px focus-visible:z-10`
  fused to a `SelectTrigger` with `rounded-l-none`; one pill, one seam.
- **`ChipInput`** — a text field that turns commas into chips (own section).
- **`Textarea`** — the same recipe and the same hint API, keeping only what a
  multi-line box has to: `rounded-lg` instead of the pill, `min-h-16` as a
  floor that reads as more-than-one-line before anything is typed, and no
  `size` prop. It had drifted on four values — `border-input` (a lighter
  border than the field above it), `bg-transparent`, `px-2.5` (its placeholder
  started 6px left of the Input's) and no hover border. All four now match.
- **`InputOTP`** — the six-cell code field (own section).

## The `--input` token

`Input` uses `bg-background`, not `bg-input` — and that is correct. `--input`
is a **shadcn convention name** we keep because we work inside that system;
what it actually colours here is inactive tracks and fills: `Progress`,
`Slider`, `Meter`, the unchecked `Switch`, and every `dark:bg-input/30`
surface. `Textarea`'s border used to be on this list by accident, which is
exactly the confusion the name invites — it is a FIELD, so it takes
`border-border` like the rest of the family. Pointing the field at it would repaint all of
those. The name is inherited, the usage is deliberate, and neither changes.

## Open questions

- ~~Type size disagreed across the family.~~ Settled: every form control is `text-small` (19px), and the `sm / default / lg` ladder is now one module (`src/lib/control-size.ts`) that `Button`, `Input`, `SelectTrigger`, `ComboboxTrigger`, `DatePicker` and `ChipInput` all read. See DESIGN_SYSTEM.md › Form controls › One size ladder.
- `LibrarySearchField` (`library-search-field.tsx:18–36`) still hand-rolls the icon + clear wrapper with `h-9 pl-10 pr-9` instead of `startIcon` / `onClear`, and is the only 36px input in the app. Migrate, or document 36px as a sanctioned toolbar height?
- The `absolute`-on-the-field bug is documented here from the source's class-merge order (input.tsx:69–75); no commit in history shows the offending call site, so the exact place it happened is unrecorded.
- `disabled:pointer-events-none` (input.tsx:53) is on Input only — Select, Combobox and DatePicker use `disabled:cursor-not-allowed disabled:opacity-50` without it. Intentional (a disabled input should not show a not-allowed cursor at all?) or drift?
