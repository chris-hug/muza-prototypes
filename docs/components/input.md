---
title: Input
source: src/components/ui/input.tsx
related: [select, combobox, datepicker, chips, button, dialog, chip-input, otp-input]
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
costumes. The shared recipe (40px `h-10`, `rounded-full`, `border-border`
with `hover:border-foreground/30`, `bg-background`, the `focus-visible` ring,
`text-base font-normal`, the asymmetric `pt-[6px] pb-[10px]`, the
right-padding variants and the `className`-lands-on-the-input rule) is
written down once, in
[DESIGN_SYSTEM.md › Form controls — the shared recipe](../../DESIGN_SYSTEM.md#form-controls--the-shared-recipe).
Do not restate it per control; this section covers only what is Input's own.

Where Input differs from its siblings:

| Property | Input | Siblings |
|---|---|---|
| Horizontal padding | `px-4` (16px) | Select and the filter trigger `pl-4`; Combobox and DatePicker `px-3` |
| Type size | `text-base` (21px), like Combobox and DatePicker | Select and the filter trigger use `text-small` (19px) |
| Focus | `focus-visible:` | Combobox uses `focus-within:` (the ring belongs to the wrapper) |
| Disabled | `disabled:pointer-events-none` **plus** `cursor-not-allowed opacity-50` | Select, Combobox and DatePicker carry only the cursor and the 50% fade |
| Invalid | `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20`, dark `border-destructive/50 ring-destructive/40` | shared with Select and Textarea |

Why 40px: it is also Button `default` (`h-10`, `button.tsx:51`), so an input
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
h-10 box               40px  (border-box)
minus 1px border ×2    38px
minus pt 6 + pb 10     22px  content
line-height (text-base) 24px
```

The 24px line box is 2px taller than the content area and the extra 4px of
bottom padding pushes it **up** by 2px. Select, Combobox and DatePicker carry
the same pair so a mixed row keeps one text baseline. The same nudge appears
as `pb-px` on Button, Tabs, Chip and Badge — a smaller lift for a heavier
weight and a shorter line box.

It is a **text-base / font-normal** recipe. The filter trigger and Chips use
`text-small` and the Button-style `pb-px` nudge instead — `filter-button.tsx:10`
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
which keeps it clearly subordinate to the 21px field text without dropping
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
- **`Textarea`** — same hint API, but `rounded-lg`, `border-input`,
  `bg-transparent` and `min-h-16`: a multi-line box is not a pill.
- **`InputOTP`** — the six-cell code field (own section).

## The `--input` token

`Input` uses `bg-background`, not `bg-input` — and that is correct. `--input`
is a **shadcn convention name** we keep because we work inside that system;
what it actually colours here is inactive tracks and fills: `Progress`,
`Slider`, `Meter`, the unchecked `Switch`, `Textarea`'s border, and every
`dark:bg-input/30` surface. Pointing the field at it would repaint all of
those. The name is inherited, the usage is deliberate, and neither changes.

## Open questions

- DESIGN_SYSTEM.md:400 (type-scale table) lists `text-sm` 19px for "inputs" · source says `text-base` 21px (input.tsx:44), and the Form-controls recipe at DESIGN_SYSTEM.md:436 says `text-base` too. Select and the filter trigger *are* `text-small`; Combobox and DatePicker are `text-base` like Input. The type-scale row still needs to say which.
- `LibrarySearchField` (`library-search-field.tsx:18–36`) still hand-rolls the icon + clear wrapper with `h-9 pl-10 pr-9` instead of `startIcon` / `onClear`, and is the only 36px input in the app. Migrate, or document 36px as a sanctioned toolbar height?
- The `absolute`-on-the-field bug is documented here from the source's class-merge order (input.tsx:69–75); no commit in history shows the offending call site, so the exact place it happened is unrecorded.
- `disabled:pointer-events-none` (input.tsx:53) is on Input only — Select, Combobox and DatePicker use `disabled:cursor-not-allowed disabled:opacity-50` without it. Intentional (a disabled input should not show a not-allowed cursor at all?) or drift?
