---
title: Stepper
source: src/components/ui/stepper.tsx
related: [dialog, button, progress, tabs]
usage:
  - Upload music — the four-step wizard | /?page=Music
---

`Stepper` is the row that says **where you are in a multi-step flow and how
much is left**. It is a progress indicator that happens to be navigable, not a
tab bar: the steps run in a fixed order, a visited step is a button, and a step
you have not reached yet is not a place you can go.

It expects a row to itself. That is the whole lesson of the component's
existence, and the reason it was extracted.

## Why it exists

The upload wizard drew this by hand, in the same row as Cancel and Next: a
600px stepper centred `absolute inset-x-0` across the header, with the buttons
on top of it at `ml-auto`. Centring on the **header** rather than on the space
left over is what broke it, and it broke by arithmetic rather than by accident:

```text
stepper right = left + w/2 + 300      600px wide, centred on the header
buttons  left = left + w − 244        220px of buttons + a 24px inset
overlap when    w/2 + 300 > w − 244   →   w < 1088
```

At a 1088px header the two touch; below it the step labels run under the
buttons. With the 208px sidebar that is a **1296px window** — an ordinary
laptop, not an edge case. Nothing degraded, reflowed or truncated: the labels
simply went under the buttons and stayed there.

Four things travelled with it, all fixed by the same split:

| | Before | Now |
|---|---|---|
| Collision | below a 1088px header | impossible — nothing shares the row |
| Navigation | `pointer-events-none`; back was one Back press per step | visited steps are buttons |
| Cancel | replaced by Back at step 2, so the only way out was to minimise | in the footer for the whole flow |
| Reuse | 60 lines inside `upload-music-dialog.tsx` | a component, with this doc |

## The three-zone wizard

Progress and actions want opposite corners of the same row, so sharing one
makes them fight over the middle. Split them:

```text
┌──────────────────────────────────────────────┐
│ Upload music                          ⤡   ✕  │  header — identity, window controls
├──────────────────────────────────────────────┤
│      ①─Release Info ─ ②─Monetisation ─ ③ ─ ④ │  the Stepper, alone in its row
├──────────────────────────────────────────────┤
│  body (scrolls)                              │
├──────────────────────────────────────────────┤
│  Cancel                       Back      Next │  footer — actions
└──────────────────────────────────────────────┘
```

This is what every design system that ships a modal wizard does.
[Carbon](https://carbondesignsystem.com/components/modal/usage/) and
[Atlassian](https://atlassian.design/components/modal-dialog/modal-footer/)
both make header / body / footer the modal's three zones, with the body the
only part that scrolls;
[PatternFly](https://www.patternfly.org/components/wizard/design-guidelines/)
puts Back / Next / Cancel in the footer and the steps elsewhere, and lets the
user click a step to jump to it.

The primary action lands bottom-right, which is also where it should be read:
after the form, not before it.

## Props

| Prop | Type | Notes |
|---|---|---|
| `steps` | `readonly (string \| { label, description? })[]` | In order. One or two words — every step gets the same `1fr`, so a long label truncates rather than stealing the row. The object form adds a line of detail under the label, as [Ant Design](https://ant.design/components/steps/) and MUI both offer. |
| `current` | `number` | 1-based. |
| `onStepSelect` | `(step: number) => void` | Makes **visited** steps clickable. Omit for a read-only stepper. |
| `maxWidth` | `number` (600) | Where the track stops stretching. Centred in whatever row it is given. |

Forward navigation is deliberately not offered, even with `onStepSelect`: a
flow validates as it goes, so jumping ahead would skip the check that gates
the step. Backward navigation is never restricted — restricting it is a
[known driver of abandonment](https://uxpatterns.dev/patterns/advanced/wizard).

## The connector belongs to the step, not to the gap between labels

This is the part the first build got wrong, and it is worth stating plainly
because the failure looked cosmetic and was structural.

That build made each step `flex-1` and put a fixed 32px rule **next to the
label column, in the flow**:

```tsx
<li className="flex flex-1 items-center">
  <div className="flex flex-1 flex-col items-center">…circle + label…</div>
  {notLast && <span className="mt-3 h-px w-8" />}   ← a sibling of the column
</li>
```

Two things go wrong, and they compound. The rule lands between the two
**labels** rather than between the two **circles**. And the last step, having
no rule, hands its label column 32px more room than every other one — so equal
steps end up with unequal columns, the circles drift off centre, and the rules
read as scattered stubs at arbitrary points.

Both [MUI](https://mui.com/material-ui/api/step-connector/) and
[Chakra](https://chakra-ui.com/docs/components/steps) anchor the connector to
the indicator instead — MUI as a `::after` pseudo-element of the Step, Chakra
as a `StepSeparator` living inside it. Same idea here: the rule is **absolute
inside its own step**, spanning from the previous circle's centre to this
one's, pinned to the circle's centre line.

```tsx
<span aria-hidden className="absolute -left-1/2 right-1/2 top-4 mx-7 h-px -translate-y-1/2" />
```

- `-left-1/2` is one step-width back — the previous circle's centre, because
  every step is exactly `1fr`.
- `right-1/2` is this step's centre.
- `mx-7` (28px) insets both ends: 16px of circle radius plus a 12px gap.
- `top-4` is half of `size-8`, so the rule sits on the circles' centre line
  whatever the label below does.

Being out of flow is what makes every column exactly `1fr` — and that is what
lets labels `truncate` instead of forcing the row wider.

Measured in the open wizard: four columns of 150px, circle centres exactly one
column apart, and every rule starting 28px after one centre and ending 28px
before the next — 94px of line between 32px circles.

## Anatomy

| Part | Value |
|---|---|
| Step | `relative flex min-w-0 flex-1 flex-col items-center`, `data-state="done \| active \| ahead"` |
| Circle | `size-8` (32px), `rounded-full`, `text-xsmall` |
| Circle — done / active | `bg-foreground text-background`; done shows `Check` at `size-4` |
| Circle — ahead | `bg-secondary text-muted-foreground` |
| Label | `w-full truncate text-center text-small font-normal leading-tight` |
| Label — done / active | `text-foreground` |
| Label — ahead | `text-muted-foreground` |
| Description | `text-2xsmall text-muted-foreground`, also truncating |
| Connector | `absolute -left-1/2 right-1/2 top-4 mx-7 h-px`, `bg-foreground/25` once passed, else `bg-border/70` |
| Track | `mx-auto w-full`, capped at `maxWidth` |

A clickable step — only a **visited** one, and only when `onStepSelect` is
passed — says so on hover with the app's shared underline: the step carries
`group/step link-underline-group`, its label carries `link-underline mx-auto`,
and the line wipes in from the left over 140ms. `mx-auto` because the utility
sets `width: fit-content` and the label is a centred flex child, so without it
the shrunk box would sit left of the circle it belongs to. The circle answers
the same hover by dropping to `bg-foreground/80`; keyboard focus draws
`focus-ring`, the 2px outline at 20% of `--ring`.

The pairing is required, not a style choice: a Tailwind `group-hover:` variant
compiles into the LABEL's own `:hover`, which is not the event here — the
pointer is on the step, not on the four words. `link-underline-group` on the
parent is the app's answer to exactly that.

A step you have **finished** is not the same as one you have not reached, so
`done` keeps full label contrast and only `ahead` recedes. The connector is
`aria-hidden`: it is punctuation, and the order is already carried by the
list.

The rule stays **1px** and gets its lightness from colour rather than height.
`h-[0.5px]` is tempting and wrong: at 1x device-pixel ratio some engines round
it to nothing, so the connector would vanish on exactly the displays that
need it most.

## Semantics

It renders an `<ol>` of `<li>`, so the order is in the markup rather than only
in the paint — a screen reader announces "2 of 4" without being told. The
active step carries `aria-current="step"`.

**A step you cannot go to is not a disabled button — it is text.** The first
build rendered every step as a `<button>` and set `disabled` on the ones that
were not reachable, which announces them as controls that refuse you. Now only
a clickable step is a `<button>`; the rest are `<span>`. The `aria-label`
(`Step 2 of 4: Monetisation`) goes on the button only, because on a plain span
it is at best ignored and at worst replaces the visible text.

## Sizing

No steps, and it reads none of the three measures. `maxWidth` caps the track
and `mx-auto` centres it, so the component takes the full row and uses as much
of it as the cap allows — then **shrinks past the cap rather than overflowing**,
because the columns are `1fr` and the labels truncate.

Measured, with the wizard open and the sidebar collapsed to its icon rail:

| Window | Track | Column | Labels |
|---|---|---|---|
| 1324 | 600 (the cap) | 150 | full |
| 860 | 600 | 150 | full, 26px clearance |
| 820 | 564 | 141 | full |
| 640 | 384 | 96 | truncating, no page overflow |

Truncation is a floor, not a design: below ~800 the labels stop being readable
even though nothing breaks. It does not need a better answer yet — the upload
wizard is the only user and is **switched off on mobile**. A stepper in a phone
context should reduce to "Step 2 of 4" plus a rule, the way
[PatternFly collapses its sidebar into a dropdown](https://www.patternfly.org/components/wizard/design-guidelines/) —
not shrink four labels until they are three letters each.

## Open questions

- Three to seven steps is the range the research converges on; four is
  comfortable. Nothing in the component enforces a ceiling, and at eight the
  600px cap would give each step 75px — narrower than most labels. Cap it, or
  leave it to the call site?
- `Vinyl → create listing` is described as a two-step flow but draws no
  stepper. Should it adopt this one, or is two steps below the threshold where
  a stepper earns its row?
