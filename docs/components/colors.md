---
title: Colors
source: app/app.css
related: [typography, responsive, button, badge]
usage:
  - every surface in the app — a component names a token, never a colour
summary:
  - "**Two layers.** A **primitive** is a colour (`--muza-brand-500`). A **semantic token** is a *pointer* to one (`--primary: var(--muza-brand-500)`). Components name the second kind, only ever the second kind."
  - "**Dark mode reassigns the pointer, not the colour.** `--primary` moves from `brand-500` to `brand-200`; neither blue changes. That is the entire mechanism."
  - "**Never a hex in a component.** `bg-primary`, not `bg-[#000DA2]` — a literal opts out of dark mode silently, and nothing catches it."
contract:
  - "[color] **A component names a semantic token, never a primitive and never a hex.** `bg-primary`, not `bg-[#000DA2]` and not the primitive behind it: a literal opts out of dark mode silently, and nothing catches it."
  - "[color] **Dark mode reassigns the pointer, not the colour.** `--primary` moves from one primitive to another; neither primitive changes. That is the entire mechanism, and it is why a hard-coded colour cannot follow."
  - "[color] **Always `oklch`, and never a clipped value.** A colour that falls outside the display gamut is silently clamped, so two tokens that read as different in the file render identically on screen."
  - "[token] **Never `gray-*`, `slate-*`, `zinc-*` or `stone-*`.** Muza's neutral is warm and olive-tinted; Tailwind's are cool and grey, so one borrowed class reads as a different product on the same screen. Use `neutral-*` or, better, a semantic token."
  - "[token] **Never a hardcoded hex.** Every colour is a CSS variable, because a literal cannot follow the pointer when dark mode reassigns it — and nothing in the build catches one."
---

Colour in Muza is **two layers and one rule**: a component names a *semantic
token*, the token points at a *primitive*, and only the pointer changes between
light and dark. Every value on this page is read out of
[`app.css`](../../app/app.css) — the page holds no palette of its own.

## The chain

```css
/* primitive — a colour, named for what it IS */
--muza-brand-500: oklch(33.02% 0.2175 264.2);   /* #000DA2 */

/* semantic — a pointer, named for what it DOES */
:root  { --primary: var(--muza-brand-500); }
.dark  { --primary: var(--muza-brand-200); }
```

`--primary` never holds a colour. Dark mode does not darken anything: it
re-points. That is why a colour cell leads with a **name** and not a hex: the
question "what is `--border` in dark mode?" is answered by
`--muza-neutrals-700`, and the hex underneath is only the check. Two name
columns side by side are the mechanism, visible.

A component may name `--primary`, `bg-background`, `text-muted-foreground`. It
may never name `--muza-brand-500`, and it may never write a hex. A literal opts
that element out of dark mode **silently** — nothing errors, nothing warns, and
the bug shows up as one wrong rectangle on a dark screen months later.

## "Used for" lives in the stylesheet

The last column is the **trailing comment on the declaration** in `app.css`:

```css
--border: var(--muza-neutrals-300);   /* every hairline: field borders, dividers, table rules */
```

Written beside the value, so the answer to "what is this for" sits where the
value sits and cannot drift from it. It is also the more useful place: someone
reading the stylesheet gets the same sentence as someone reading this page,
and a new token is undocumented in exactly one place instead of silently
undocumented everywhere.

A primitive has none, and its cell reads `—`. It is a colour; what it is *for*
is whichever semantic tokens point at it, and those are the rows above.

## Why oklch

Values are authored in `oklch()`, a perceptually uniform space: equal numeric
steps look equal. In hex or HSL a neutral ramp has to be eyeballed, and the
middle of it always comes out muddy. Here `--muza-neutrals-400` and `-500` are
one step apart in the file and one step apart to the eye.

The `/* #RRGGBB */` after each value is a convenience for Figma and for
copy-paste, not a second source — and it is **not** what the page shows. The
table prints oklch, in the same notation and the same precision the stylesheet
is written in, so a value read here can be pasted there without looking like a
different number.

Where the browser already reports oklch, that value is reformatted and printed.
Where it does not — the handful of primitives still authored as hex — the
colour is painted to a 1×1 canvas and the pixel converted. Measuring only what
has to be measured matters on the alpha primitives: a canvas stores
premultiplied, so un-premultiplying a 50% neutral threw away half the precision
and moved its hue from 111.4 to 106.6.

On a **primitive** row the two lines are **hex over oklch**, and the hex is the
input. They used to print the same string for every token authored in oklch,
which is most of them — a row that says a thing twice says nothing the second
time. Hex on top because that is the form you paste into Figma or a comment;
oklch underneath because that is the form the stylesheet is written in. The
field shows the measured hex until you type, while the CSS view still prints
the declared `oklch(…)`: the same colour said two ways, which is what the row
is for.

Neither line is ever truncated. A clipped `--muza-neut…` or `oklch(99.8…` looks
like information and is not, so both wrap instead — the name at its hyphens,
which are break opportunities already, and the value with `break-all`, because
an oklch triple offers the browser nowhere to break.

## The editor

The section is a live editor, and everything in it comes from the stylesheet.

- **Design** — **one table**, both layers, in the order the system resolves
  them: **Name · Light mode · Dark mode · Used for**, with *Semantic* and
  *Primitive* as sections inside it. The group rail is a column **of** that
  table rather than a thing standing beside it.

  Three things stick, in a stack: the surface header at `top-0`, then the
  table head and the rail at `top-10` — the header's own height — so nothing
  slides under anything else. The rail's COLUMN stretches and the rail inside
  it sticks; sticking the column itself sized it to its content, and the
  table lost its left border for the rest of its height.

  They were two panels — a table and a swatch grid — and that made them look
  like two subjects. They are one subject read twice: `--primary` and
  `--muza-brand-500` are the same colour at two levels of naming, and only a
  shared column set makes a pointer something you can look **up**. Change a
  primitive and the semantic row's swatch moves a screen away, in the same
  table, which is the mechanism happening in front of you.
- **CSS** — the same tokens as text: the primitive `:root`, the semantic
  `:root`, and `.dark`, in the order `app.css` has them, with your edits
  applied. Copyable.

  The rail stays, and works. The CSS is built per group rather than as one
  string, so the same anchors the table uses exist in the text — a wall of
  declarations is exactly where a table of contents earns its keep, and a rail
  that is present but inert is worse than no rail.

The switch between the two sits **in** the surface's header, not above it: it
changes what the surface shows, and a control outside the thing it controls
reads as a page-level setting.

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
