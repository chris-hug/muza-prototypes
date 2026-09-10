---
title: Typography
status: new
source: app/app.css
related: [colors, responsive, button, badge, items]
usage:
  - not a component — the scale, the weights and the floor every surface reads from
summary:
  - "**Semantic aliases, never primitives.** `text-small`, not `text-sm` and never `text-[17px]`. The alias is the name a design decision has; the primitive is an implementation detail underneath it."
  - "**15px is the floor for language.** Anything a person reads as a sentence, a label, a caption or a hint stops there. 13px exists for monospace data only."
  - "**Weight carries emphasis, not size.** On cards and rows the title is `font-normal` and the meta is `font-light` at the same size — the contrast is weight."
  - "**Regular by default, medium for emphasis, semibold hardly ever, bold never.** Under 18px it is regular, with three named exceptions: button labels, tab labels, card titles."
contract:
  - "[type] **Name the semantic alias, never the primitive and never a literal.** `text-small` rather than `text-sm` or `text-[17px]`: the alias is where a decision lives, and a literal opts out of every later change to the scale silently."
  - "[type] **15px is the floor for anything read as language.** 13px (`text-3xsmall`) is allowed for monospace data in a reference table and nowhere else — not for prose, a label, a caption, a hint, or anything inside a control. If the text is a sentence and 13px is tempting, the answer is a wider column."
  - "[type] **Weight, not size, separates a title from its metadata.** On cards, list rows and media items the title is `font-normal` and the meta rows are `font-light` with `tracking-[0.02em]`, both at 17px."
  - "[type] **Bold is never used, semibold hardly ever** (H1 and H2 only), and anything under 18px is `font-normal` — except a button label, a tab label or a card title, which are the three named exceptions."
---

Muza sets type in **Founders Grotesk**, on a scale whose steps are declared in
px rather than rem so that a browser's own font-size setting cannot silently
re-scale a layout that was designed against fixed numbers. Every surface names
a **semantic alias** — `text-small`, `text-large` — and the alias points at a
primitive; a component never names the primitive and never writes a literal.

## The scale

| Alias | Primitive | Size | Where it is used |
|---|---|---|---|
| `text-3xsmall` | `text-3xs` | 13px | **monospace data only** — see below. Never prose |
| `text-2xsmall` | `text-xxs` | 15px | **the floor for language** — chips, badges, `size="sm"` buttons |
| `text-xsmall` | `text-xs` | 17px | card titles and meta, table rows, captions, helper text |
| `text-small` | `text-sm` | 19px | body, labels, inputs, nav sub-items, song rows |
| `text-base` | `text-base` | 21px | lead text, nav items, rail section titles |
| `text-large` | `text-lg` | 24px | large body |
| `text-xlarge` | `text-xl` | 30px | H4 |
| `text-2xlarge` | `text-2xl` | 36px | H3 |
| `text-3xlarge` | `text-3xl` | 48px | H2 |
| `text-4xlarge` | `text-4xl` | 60px | display |
| — | `text-5xl` | 72px | H1 |

The alias names are a clean 1:1 with the primitives — `2x small ↔ text-xxs`,
`small ↔ text-sm`, `3x large ↔ text-3xl` — so there is no shifting to
remember. Use the left column.

## 13px exists, and it is not part of the UI scale

`text-3xsmall` sits **below** the 15px floor and is allowed in exactly one
situation: **monospace data** — a token name, an `oklch()` triple, a class
string — in a reference table, where the row is a value to *read off* rather
than language to read.

It exists because 15px mono could not hold a 26-character
`oklch(99.81% 0.0053 118.5)` on one line in the Colors table, and a value that
wraps or clips is worse than a value that is small: a clipped one looks like
information and is not.

**15px remains the floor for anything a person reads as language**, and that
rule did not move. A second size was added *under* it for a different kind of
content, which is not the same as lowering the floor.

## Weight

| Weight | Class | Rule |
|---|---|---|
| Regular 400 | `font-normal` | **Default** — body, descriptions, labels, metadata |
| Medium 500 | `font-medium` | **Emphasis and headlines** — headings ≥18px, nav items ≥18px, button labels, tab labels, card titles |
| Semibold 600 | `font-semibold` | **Hardly ever** — H1 and H2 only |
| Bold 700 | `font-bold` | **Never** |

**Under 18px is `font-normal`**, with exactly three exceptions: a button
label, a tab label, a card title. At 15px the medium weight reads as emphasis
the control does not carry.

**On a card or a row, weight is what separates title from metadata** — both
sit at 17px, the title `font-normal` and the meta `font-light` with
`tracking-[0.02em]`. Size is not doing that work, so do not reach for a
smaller meta line; keep the vertical rhythm even with a single `gap` and let
the meta stay `text-muted-foreground`.

## Mono is for code and for data

Founders Grotesk Mono, and code is the only thing that wears it: a token name,
a class string, a measured value. Prose never goes mono to look technical.

## Open questions

- The scale is declared in px to avoid rem ambiguity, which also means it does
  not respond to a browser's font-size setting. That is a deliberate trade and
  an accessibility cost; nothing records whether it was weighed.
- `text-5xl` (72px) has no semantic alias, so H1 names a primitive — the one
  place the rule above is broken by the scale itself.
