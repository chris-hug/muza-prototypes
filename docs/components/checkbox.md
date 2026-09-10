---
title: Checkbox & Radio
source: src/components/ui/checkbox.tsx
related: [switch, radio-card, select-track, form, table]
usage:
  - Orders — row selection | /?page=Orders
  - Shop › My products — bulk select | /?page=Shop
  - Studio › Music — bulk select | /?page=Music
---

`Checkbox` and `RadioGroupItem` are the two 16px choice marks: a square with
a 3px corner for "any of these", a circle for "one of these". Both fill with
`primary` when set, and `CheckboxField` adds the label-plus-description row
that Settings uses for its notification options.

## Anatomy

Two files: `checkbox.tsx` (`Checkbox`, `CheckboxField`) and `radio-group.tsx`
(`RadioGroup`, `RadioGroupItem`), each a thin wrapper over the base-ui
primitive of the same name.

| Part | Shape | Unset | Set |
|---|---|---|---|
| `Checkbox` | `size-4 rounded-[3px]` | `border border-muted-foreground`, `dark:bg-input/30` | `border-primary bg-primary text-primary-foreground`, a `CheckIcon` at `size-3.5` |
| `RadioGroupItem` | `size-4 rounded-full` | same border and dark fill | same fill, a `size-1.5` dot in `bg-primary-foreground` |
| `RadioGroup` | `grid w-full gap-2` | | |

Shared by both marks:

- **Focus** `focus-visible:border-ring focus-ring` — a 2px `outline` at 20%
  of `--ring`, no offset; **invalid** `aria-invalid:border-destructive
  invalid-ring` — the same 2px geometry in `--destructive` (40% in dark), so a
  field that is both focused and invalid can only differ in colour;
  **disabled** `disabled:cursor-not-allowed disabled:opacity-50`.
- **Hit area** `after:absolute after:-inset-x-3 after:-inset-y-2` — a
  transparent pseudo-element that grows the 16px mark to a 40 × 32px target
  without moving anything beside it. Inside a table cell it is dropped with
  `className="after:hidden"` (`media-list-table.tsx:111, 125`), or the
  expanded box of one row's checkbox would catch taps meant for the next.
- Both are `peer`, so a `Label` that **follows** them as a sibling dims via
  `peer-disabled:opacity-50`.

**Why `rounded-[3px]` is a literal.** `--radius` is 0.75rem, so `rounded-sm`
is 8px — on a 16px box that is a circle, and the checkbox would read as a
radio. The corner is pinned so it cannot follow the radius scale.

`CheckboxField` is the Figma component with its two text lines:

```tsx
<div className="flex items-start gap-2.5">
  <Checkbox id={id} className="mt-0.5" {...props} />
  <div className="flex flex-col gap-0.5">
    <label htmlFor={id} className="text-small font-normal text-foreground leading-snug cursor-pointer …">{label}</label>
    {description && <p className="text-xsmall text-muted-foreground leading-snug">{description}</p>}
  </div>
</div>
```

`items-start` + `mt-0.5` puts the mark on the label's first line, so a
two-line description does not drag it to the middle. Settings builds the
radio equivalent by hand — `RadioRow` in `settings-view.tsx:383–391`: a
`<label>` wrapping the item (`mt-1`) and a `text-small font-medium` title over
a `text-xsmall` description, at `gap-3`.

## Usage

```tsx
// Bare mark + Label — the pair is what makes the label clickable.
<div className="flex items-center gap-2.5">
  <Checkbox id="explicit" defaultChecked />
  <Label htmlFor="explicit">Explicit content</Label>
</div>

// Label with a consequence underneath.
<CheckboxField id="release-notes" label="Official muza release notes"
  description="Get informed about new features, improvements and updates"
  checked={releases} onCheckedChange={c => setReleases(Boolean(c))} />

// One of these.
<RadioGroup value={quality} onValueChange={v => setQuality(v as "default" | "max")}>
  <div className="flex items-center gap-2.5">
    <RadioGroupItem id="q-default" value="default" />
    <Label htmlFor="q-default">Default</Label>
  </div>
  …
</RadioGroup>
```

`onCheckedChange` hands you `(checked, eventDetails)`; `RadioGroup`'s
`onValueChange` hands you the item's `value` — typed loosely, hence the
`as` at the Settings call site.

## Sizing

Fixed, no steps: 16px marks, a 40 × 32 hit area, `RadioGroup` fills its
column (`w-full`). Text beside them reflows; the marks never do.

## Behaviour

- Space toggles a focused checkbox; in a radio group the arrow keys move
  the selection and Tab leaves the group.
- Clicking the label toggles through `htmlFor` → `id` — base-ui renders a
  hidden `<input>` behind each mark, so `name` / `value` submit with a form.
- `Checkbox` accepts `indeterminate` (used for the select-all header in
  `media-list-table.tsx:125`) — but see below for what it looks like.
- `Checkbox` has `transition-colors`; the fill fades in. `RadioGroupItem`
  has none; the dot appears at once. The check glyph itself is
  `transition-none` — it must land with the spring, not chase it.

## The tick — one spring, three geometries

Both marks bounce when they are picked: `data-[anim]:animate-[muzaTick_360ms_cubic-bezier(.22,1,.36,1)]`,
exported as `TICK_CLASS` from `use-tick.ts` so `Checkbox` and `RadioGroupItem`
cannot drift apart. `muzaTick` is a four-stop scale — `1 → 1.16 → 0.95 → 1.03
→ 1` — a spring that overshoots, undershoots and settles.

It is bound to the **change**, not to the state, and that is the whole design
of the hook:

- `data-checked:animate-…` is one line and no hook, and it matches on **mount**
  — so every pre-ticked box in a form bounced on page load.
- Binding to the change gets the other half for free: **unticking** springs
  too, which a state selector cannot express at all.

`useTick()` returns `tickProps` (the `data-anim` attribute) and `tick()`, to
be called when the value actually changes. The attribute is held for 400ms,
slightly longer than the 360ms animation, so it outlives it. A tick with
nothing running starts immediately rather than going through two frames of
`requestAnimationFrame` — those ~33ms of nothing made every spring read as
late no matter how short it was.

[`RadioCard`](radio-card.md) borrows the same hook at the CARD level, because
the card is the tap target and the dot's own click never fires when the press
lands on the title or the padding.

## Open questions

- `checkbox.tsx:16` lists **indeterminate** as a state · the only indicator
  is a `CheckIcon` and no class targets `data-indeterminate`; base-ui renders
  the indicator for `checked || indeterminate` (`CheckboxIndicator.js:31`),
  so a select-all header with *some* rows selected looks identical to one
  with all of them.
- `CheckboxField`'s label carries `peer-disabled:opacity-50`
  (`checkbox.tsx:84`) · it is not a sibling of the `peer` checkbox — it sits
  inside a following `div` — so `peer-disabled` never matches and a disabled
  field's label stays full-strength, while a bare `Checkbox` + `Label` pair
  dims correctly.
- `group-has-disabled/field:opacity-50` (`checkbox.tsx:37`) expects a
  `group/field` ancestor; nothing under `src/` sets one (grep), and
  `RadioGroupItem` does not carry the rule.
- Two label recipes for the same row: `CheckboxField` at `gap-2.5`,
  `mt-0.5`, `font-normal` (`checkbox.tsx:79–86`); Settings' `RadioRow` at
  `gap-3`, `mt-1`, `font-medium` (`settings-view.tsx:384–388`). Which is the
  design?
- The hit area is 40 × 32 (`after:-inset-x-3 after:-inset-y-2`) · every row
  component promises 44px. A `-inset-y-3.5` would make it 40 × 44.
- Section title "Checkbox & Radio" maps to `checkbox.tsx` in `ds-sources.ts`;
  `radio-group.tsx` has no section, no source link and no changed-date of its
  own.
