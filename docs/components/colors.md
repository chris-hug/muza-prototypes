---
title: Colors
source: app/app.css
related: [typography, responsive, button, badge]
usage:
  - every surface in the app — a component names a token, never a colour
summary:
  - "**Two layers.** A **primitive** is a colour (`--muza-blue-500`). A **semantic token** is a *pointer* to one (`--primary: var(--muza-blue-500)`). Components name the second kind, only ever the second kind."
  - "**Dark mode reassigns the pointer, not the colour.** `--primary` moves from `blue-500` to `blue-200`; neither blue changes. That is the entire mechanism."
  - "**Never a hex in a component.** `bg-primary`, not `bg-[#000DA2]` — a literal opts out of dark mode silently, and nothing catches it."
---

Colour in Muza is **two layers and one rule**: a component names a *semantic
token*, the token points at a *primitive*, and only the pointer changes between
light and dark. Every value on this page is read out of
[`app.css`](../../app/app.css) — the page holds no palette of its own.

## The chain

```css
/* primitive — a colour, named for what it IS */
--muza-blue-500: oklch(33.02% 0.2175 264.2);   /* #000DA2 */

/* semantic — a pointer, named for what it DOES */
:root  { --primary: var(--muza-blue-500); }
.dark  { --primary: var(--muza-blue-200); }
```

`--primary` never holds a colour. Dark mode does not darken anything: it
re-points. This is why **Value** is a column in the token table rather than a
footnote: on a semantic row it prints the pointer (and the dark one under it
when they differ), on a primitive row the colour itself. It is the only place
the mechanism is visible.

A component may name `--primary`, `bg-background`, `text-muted-foreground`. It
may never name `--muza-blue-500`, and it may never write a hex. A literal opts
that element out of dark mode **silently** — nothing errors, nothing warns, and
the bug shows up as one wrong rectangle on a dark screen months later.

## Why oklch

Values are authored in `oklch()`, a perceptually uniform space: equal numeric
steps look equal. In hex or HSL a neutral ramp has to be eyeballed, and the
middle of it always comes out muddy. Here `--muza-neutrals-400` and `-500` are
one step apart in the file and one step apart to the eye.

The `/* #RRGGBB */` after each value is a convenience for Figma and for
copy-paste, not a second source. The hex shown on the page is measured from the
**painted pixel**, not read from that comment, so a comment that drifts is
visible rather than believed.

## The editor

The section is a live editor, and everything in it comes from the stylesheet.

- **Design** — **one table**, both layers, in the order the system resolves
  them: Token · Light · Dark · Value, with *Semantic* and *Primitive* as
  sections inside it and a sticky rail listing every group.

  They were two panels — a table and a swatch grid — and that made them look
  like two subjects. They are one subject read twice: `--primary` and
  `--muza-blue-500` are the same colour at two levels of naming, and only a
  shared column set makes a pointer something you can look **up**. Change a
  primitive and the semantic row's swatch moves a screen away, in the same
  table, which is the mechanism happening in front of you.
- **CSS** — the same tokens as text: the primitive `:root`, the semantic
  `:root`, and `.dark`, in the order `app.css` has them, with your edits
  applied. Copyable.

Editing writes an inline custom property on `<html>`, which is the last word in
the cascade, so a change lands on the **whole page** — the sidebar, every card,
every other section — not on a preview rectangle. A token can only be judged in
company. Edit a primitive and every semantic token pointing at it moves with
it, which is the two-layer system demonstrating itself in one keystroke.

Only **primitives** are editable, and that is not an omission. An inline
property on `<html>` beats both `:root` and `.dark`, so editing `--primary`
directly would pin it to one colour in *both* modes — it would break the very
mechanism the table is there to show. The layer where a colour actually lives
is the layer you change.

A primitive's Dark column reads "same" for the same reason: a primitive is one
colour and is never redeclared in `.dark`. That is the point of the layer above
it.

Nothing persists. Reset removes the inline properties; leaving the section does
the same, so a half-finished experiment does not follow you around the app.

## It used to hold three copies of itself

This section hand-wrote its own palette. Every primitive was a JSX literal in
`home.tsx` (`{ name: "500", hex: "#000DA2" }`, thirty of them), and
`SEMANTIC_TOKENS` mapped each token to its primitive by hand — twice, once per
mode — under a comment that admitted it: *"Keep in sync with the var(...)
assignments in app.css."*

Every one of those was a promise to remember to edit two files, and the page
had no way to notice a broken promise: it would simply have shown a palette the
app no longer used, confidently. The chain is already written in the CSS, so
`src/lib/tokens.ts` reads it instead — brace-matched blocks, declarations in
source order, group headings from the comments.

## Open questions

- The parser identifies blocks by what they **declare** (`--background` for the
  semantic block). Renaming that token would silently empty the table. Worth a
  build-time assertion, or is a visibly empty table its own alarm?
- `--primary-hover` is a `color-mix(in srgb, black 20%, …)` rather than a
  pointer, so its Value is neither a colour nor a name — the table prints the
  expression. Should
  computed tokens be a third kind with their own column, or is showing the
  expression enough?
- Editing is per-token and unstructured — a text field, not a colour picker.
  An oklch L/C/H triple with sliders would make "one step lighter" a drag
  rather than arithmetic. Worth it, or does that make the section a theme
  builder it is deliberately not?
