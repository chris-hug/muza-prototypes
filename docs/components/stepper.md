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
| `steps` | `readonly string[]` | Labels in order. One or two words — they sit side by side, so a long one costs every other step its width. |
| `current` | `number` | 1-based. |
| `onStepSelect` | `(step: number) => void` | Makes **visited** steps clickable. Omit for a read-only stepper. |
| `maxWidth` | `number` (600) | Where the track stops stretching. Centred in whatever row it is given. |

Forward navigation is deliberately not offered, even with `onStepSelect`: a
flow validates as it goes, so jumping ahead would skip the check that gates
the step. Backward navigation is never restricted — restricting it is a
[known driver of abandonment](https://uxpatterns.dev/patterns/advanced/wizard).

## Anatomy

| Part | Value |
|---|---|
| Circle | `size-6` (24px), `rounded-full`, `text-xsmall` |
| Circle — done / active | `bg-foreground text-background`; done shows `Check` at `size-3` |
| Circle — ahead | `bg-secondary text-muted-foreground` |
| Label | `text-small font-normal leading-tight whitespace-nowrap` |
| Label — active | `text-foreground`; everything else `text-muted-foreground` |
| Connector | `h-px w-8 mx-2 mt-3`, `bg-foreground/40` once passed, else `bg-border` |
| Track | `mx-auto w-full`, capped at `maxWidth` |

`mt-3` on the connector is half of `size-6` — it puts the rule on the circles'
centre line. The connector is `aria-hidden`: it is punctuation, and the order
is already carried by the list.

## Semantics

It renders an `<ol>` of `<li>`, so the order is in the markup rather than only
in the paint. The active step carries `aria-current="step"`, and each button is
labelled `Step 2 of 4: Monetisation` — the number alone is not a label, and the
visual state announces nothing on its own. Steps that cannot be reached are
`disabled`, so they are skipped rather than offered and refused.

## Sizing

Fixed, no steps, and it reads none of the three measures. `maxWidth` caps the
track and `mx-auto` centres it, so the component takes the full row and uses as
much of it as the cap allows. Four steps at 600px is comfortable down to an
860px window (a 652px row) with 26px to spare — measured, with the sidebar
collapsed to its icon rail.

Below that it has no answer, and does not need one yet: the upload wizard is
the only user and is **switched off on mobile**. A future stepper in a phone
context should reduce to "Step 2 of 4" plus a rule, the way
[PatternFly collapses its sidebar into a dropdown](https://www.patternfly.org/components/wizard/design-guidelines/) —
not shrink four labels until they collide again.

## Open questions

- Three to seven steps is the range the research converges on; four is
  comfortable. Nothing in the component enforces a ceiling, and at eight the
  600px cap would give each step 75px — narrower than most labels. Cap it, or
  leave it to the call site?
- `Vinyl → create listing` is described as a two-step flow but draws no
  stepper. Should it adopt this one, or is two steps below the threshold where
  a stepper earns its row?
