---
title: Button
source: src/components/ui/button.tsx
related: [input, select, datepicker, chips, toggle, toolbar, spinner, tabs, dialog, typography, colors]
usage:
  - Everywhere — 37 files in src/components/app | /?page=Home
  - Upload music — 18 in that dialog alone | /?page=Music
  - Settings — 17 | /?page=Settings
---

`Button` is the one clickable pill in Muza. Every text button and every
icon-only button — a primary Play, a ghost "…" in a list row, the ✕ on a
sheet, a GitHub link on the design-system page — is this component with a
`variant` and a `size`. It wraps Base UI's `Button`, so it also carries the
`render` prop for the cases where the thing that looks like a button is an
anchor or a menu trigger.

Seven variants, six sizes, one base recipe. Everything in this file is the
reason the recipe is what it is.

## Usage

```tsx
<Button>Play</Button>                                    // default · default
<Button variant="outline" size="sm">Follow</Button>
<Button variant="ghost" size="icon-sm" aria-label="More options"><MoreVertical /></Button>
<Button size="lg" className="w-full">Create playlist</Button>

// As a link — Base UI's render prop swaps the element, the classes stay.
<Button variant="secondary" size="sm" render={<a href={url} target="_blank" rel="noreferrer" />}>
  GitHub <ArrowUpRight className="size-3" />
</Button>

// As a menu trigger — the trigger renders *into* the Button.
<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
```

Something that is not a `Button` but must look like one takes the classes
directly: `buttonVariants({ variant, size })` (Pagination does this, and the
design-system page uses it on a raw `DropdownMenuTrigger`).

## Variants

| `variant` | Fill | Ink | Hover | Use it for |
|---|---|---|---|---|
| `default` | `bg-primary` (blue-200 `#1E34D8`) | `text-primary-foreground` | `bg-primary-hover` (blue-200 mixed with 20% black) | the one confirming action on a surface |
| `secondary` | `bg-secondary` (neutrals-200 / -800) | `text-secondary-foreground` | `bg-secondary-hover` (neutrals-300 / -700) | a solid but quiet action |
| `outline` | `bg-background/20` + `backdrop-blur-lg`, `border-border` | `text-foreground` | `bg-muted`, `border-foreground/30` | the default choice on a page |
| `outline-primary` | same glass as `outline` | `text-primary-text` | same as `outline` | an outline whose label is the brand blue |
| `ghost` | none | `text-foreground` | `bg-accent` (neutrals-100 / -800) | icon buttons in rows, headers, toolbars |
| `link` | none — and no size box (see below) | `text-primary-text` | `underline` (`underline-offset-4`) | inline text that navigates |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | `bg-destructive/85` | delete, remove, cancel-an-order |

`outline` and `ghost` are what the app is mostly made of. A blue `default`
fill is the confirming action of a surface — one per sheet or form, never
nested inside a `secondary` row.

### Outline is glass, not a solid fill

`outline` paints `bg-background/20` behind a `backdrop-blur-lg`. On a plain
page background that is indistinguishable from the old solid `bg-background`
fill it replaced; on a photo or gradient — the player overlay, a media header
over a cover — the 20% fill plus the blur turns into a proper frosted-glass
button instead of an opaque white/black pill punched into the artwork. One
variant serves both backdrops, so nothing has to pick "glass" per usage.

### Primary ink is not primary fill

`link` and `outline-primary` use `text-primary-text`, never `text-primary`.
`--primary` is the *fill* blue (blue-200) and is only about 2.2:1 against the
dark background, so as text it fails. `--primary-text` is the same blue-200 in
light mode and lifts to blue-100 (`#3F66FF`) in dark mode. The two variants
bake the rule in so a caller never has to remember it — the same rule the
Colors section states for every blue-on-neutral use (links, checkmarks, the
library heart).

### Ghost hovers to `bg-accent`

Ghost's hover is `hover:bg-accent` — neutrals-100 in light mode, neutrals-800
in dark. That is one step lighter than `--secondary` (neutrals-200) in light
mode, which is the point: a ghost button is a row or toolbar control, and its
hover should register without turning into a solid pill. The Design System's
button section used to prescribe `hover:bg-secondary` ("NOT muted — too
light"), a rule the component never followed; the shipped `bg-accent` is the
rule and DESIGN_SYSTEM.md now says so.

### Link is text, not a box

A `variant="link"` button sheds the size's height and padding: `Button`
appends `h-auto p-0` **after** `buttonVariants({ variant, size })`, so a link
is exactly as tall as its line and has no side padding, whatever `size` says.

The override cannot live inside the `link` variant itself. cva emits the
variant's classes before the size's classes, so tailwind-merge would keep the
size's `h-10 px-[18px]` and drop the variant's own `h-auto p-0` — the link
would end up 40px tall with 18px of side padding. Appending the pair in the
component, after the cva output, puts it last, where it wins. A caller's
`className` still comes after that, so `className="p-1"` on a link works.

### Ghost fills to the outer edge

The base sets `bg-clip-padding`; `ghost` overrides it with `bg-clip-border`.
Every Button carries a 1px `border` (transparent on the filled variants), and
`bg-clip-padding` stops the background at the padding box — so on every
variant but `ghost` the fill ends 1px inside the button's box. Ghost paints
under the border "so fill reaches the outer edge": its hover highlight is the
whole 32px or 40px box, not a 30px or 38px one. `AlbumCard`'s cover buttons
opt out the other way, with `border-0`, and call the 1px artefact a "ghost
edge". Why the base keeps `bg-clip-padding` at all is not recorded — see the
open questions.

## Sizes

Figma node 37:931 is the reference frame. The heights are exact:

| `size` | Box | Padding | Type | Weight |
|---|---|---|---|---|
| `sm` | `h-8` 32px | `px-3` 12px | `text-2xsmall` 15px | `font-normal` |
| `default` | `h-10` 40px | `px-[18px]` | `text-small` 19px | `font-medium` |
| `lg` | `h-12` 48px | `px-10` 40px | `text-small` 19px | `font-medium` |
| `icon-sm` | `size-8` 32px (40px hit area) | — | — | — |
| `icon` | `size-10` 40px | — | — | — |
| `icon-lg` | `size-12` 48px | — | — | — |

- **`default` is 40px because Input, Select and DatePicker are 40px.** The
  Figma frame has it at 36px; the three form controls are `h-10`, and a
  button sits next to a field often enough that the button moved to match
  them (commit 9f31908 — `icon` moved to 40px in the same change, so an icon
  button beside a field is level with it too). Chip `md` is `h-10` for the
  same reason: a filter chip, a sort button and a view toggle in one toolbar
  read as one row.
- **Weight lives on the size, not on the base**, so choosing a size chooses
  the weight. `sm` is `font-normal`, every other text size is `font-medium`
  — the source and the Design System's button table agree on this. `sm` is
  regular because at 15px the medium weight reads as emphasis the control
  does not carry: it is a toolbar size, not a primary action. `default` and
  `lg` are `font-medium`: a 19px button label is one of the three named
  exceptions to the "regular under 18px" rule in the Typography section
  (button labels, tab labels, card titles).
- **`lg` is the full-width confirming action.** In a `mobile="form"` dialog
  the action band holds a `size="lg" className="w-full"` button directly on
  the keyboard — see the Dialog section for why the action lives there.
- `px-[18px]` is the one arbitrary value in the file, and 40px/18px is also
  the pair Chip `md` and FilterButton use (`h-10`, `px-4`/`pl-4`). Why 18
  rather than `px-4` (16) is not recorded — see the open questions.

## Icon buttons

An icon-only button renders a `size-4` (16px) glyph unless the SVG brings its
own `size-*` class — `[&_svg:not([class*='size-'])]:size-4`. Glyphs are also
`pointer-events-none` and `shrink-0`, so a click always lands on the button,
never on a path inside it, and a glyph never collapses when the label wraps
or the row gets tight.

**`icon-sm` is 32px to look at and 40×40 to hit.** It is the size list rows,
sheet headers and the player's secondary controls use, and 32px is under the
40×40 minimum touch target. The size adds `after:absolute after:-inset-1
after:content-['']`: a pseudo-element hanging 4px past every edge, invisible,
that catches the tap. The `relative` on the base class exists for this; take
it off and the pseudo-element positions against the nearest ancestor instead.
Layout is untouched — neighbours still see a 32px box.

Because an icon button is 32px around a 16px glyph, the *glyph* is 8px in
from the box edge. A header that wants the glyph on its gutter line pulls the
box out by that much (`-ml-2` on `DialogHeader`'s leading slot) rather than
asking the button to be smaller.

## The base recipe

Every variant and size sits on this string; each part is doing something.

- **`rounded-full`** — the pill is the shape, on every variant and size.
  There is no square Button.
- **`pb-px`** — Founders Grotesk sits visually high in a flex-centred box.
  One pixel of bottom padding pulls the label onto the optical centre. Tabs,
  Chip, Badge and FilterButton carry the same `pb-px` and name Button as the
  recipe they copy, so a button and a tab in the same row are nudged
  identically.
- **`transition-[colors,box-shadow,transform,opacity]`**, not
  `transition-all`. `all` fights the press-state translate and any transform
  a parent applies; the list names the four things that actually change.
- **`active:not-aria-[haspopup]:translate-y-px`** — a 1px push on press.
  It is skipped for anything carrying `aria-haspopup`, which Base UI's
  `MenuTrigger` and `SelectTrigger` set on whatever they render into (the
  reason for the exception is not recorded — see the open questions). A
  wrapper that centres a button with its own `translate-y` must absorb that
  transform itself (as `OrderDetailView`'s back button does) or the two
  translates fight and the press jumps.
- **`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`**
  — keyboard focus is a 3px ring at 50% of `--ring` (neutrals-900 in light,
  neutrals-300 in dark), the same ring Input, Select and Tabs draw, so
  tabbing through a form looks like one system. Pointer clicks show nothing
  (`outline-none` + `focus-visible`).
- **`disabled:pointer-events-none disabled:opacity-50`** — a disabled button
  fades to 50% and stops receiving hover. 50 is the one disabled opacity in
  the app: Input, Select, DatePicker, Tabs and the menu items all use it, and
  Button's former `opacity-45` was unified to match so a disabled button next
  to a disabled field fades by the same amount. The fade is an opacity *animation*,
  which is why `PlayingWave` must not be mounted inside a Button: Chromium
  resamples its compositing layer on every ancestor opacity change and the
  wave smears.
- **`whitespace-nowrap shrink-0 select-none`** — a label never wraps to two
  lines, a button never shrinks to fit a flex row, and the label text cannot
  be selected.
- **`gap-2`** — 8px between a glyph and its label, for every size.
- **`group/button`** — children can style against the button's state
  (`group-hover/button:…`) without the button knowing about them.
- **`bg-clip-padding`** — see *Ghost fills to the outer edge* above.

There is no `aria-invalid` styling. A button is never a form field, and the
destructive ring the shadcn template shipped for it was removed with the
rest of the template's rectangular styling.

## States

| State | How | What you see |
|---|---|---|
| Hover | `:hover` per variant | fill shifts one step (table above) |
| Pressed | `:active` | 1px downward nudge, unless it opens a menu |
| Focus (keyboard) | `:focus-visible` | 3px `ring/50` ring |
| Disabled | `disabled` | 50% opacity, no hover, no pointer events |
| Loading | `disabled` + `<Spinner size="sm" />` as the leading child | 16px arc in the label's colour, then the label |

Loading is not a prop. It is a disabled button with a `Spinner` in front of
the label — `Spinner` strokes with `currentColor`, so it is white on a
primary button, foreground on an outline, blue on a link, without any
per-variant colour. `size="sm"` is `size-4`, the same 16px as a glyph, so
swapping an icon for a spinner does not move the label.

## Sizing

Fixed, no steps. A Button is `inline-flex shrink-0 whitespace-nowrap`: it
is as wide as its label plus padding and reads none of the three measures
(window, column, box). Where a button must fill its row — the `lg`
confirming action in a `mobile="form"` dialog — the call site says so with
`className="w-full"`; the component never stretches on its own. The one
size that responds to anything is `icon-sm`'s 40×40 hit area, and that is a
pointer concern, not a width one.

## Do not

- **Do not reach for `text-primary` on a button label.** Use `link` or
  `outline-primary`, which carry `text-primary-text`.
- **Do not size a glyph with `w-4 h-4`.** Only a class containing `size-`
  opts out of the default 16px; `w-`/`h-` are overridden by it.
- **Do not nest a primary or filled Button inside a `secondary` row.** The
  "Add music" row is a list row with a `bg-secondary` circle and a label, not
  a row with a button in it.
- **Do not wrap a Button in something that translates it** without absorbing
  the transform in the wrapper; the press nudge is a translate too.

## The catalogue has no frame

The Button section renders `frameless` — no border, no surface, no window
chips. A frame is a claim that the component has an **edge** worth showing: a
card, a dialog, a rail that reacts to its container. A Button has none. It
takes its size from a prop and renders identically at 320 and at 1920, so a box
around it invents a container the button never has and spends the reader's
attention on a rectangle that means nothing.

The `</>` and ⓘ affordances stay — they are about the call site and the doc,
not about the frame.

## Open questions

- button.tsx:44 (comment) still calls the size block "Figma node 37:931 — exact px values" · the listed values now match the source, but `default`, `lg`, `icon` and `icon-lg` have all moved off that frame's original values (9f31908, 881fd40). Is the Figma frame updated, or is the heading stale?
- button.tsx:13 skips the press nudge for `aria-haspopup` — no reason is recorded anywhere in the repo. This doc states the rule only.
- button.tsx:13 keeps `bg-clip-padding` plus a permanent 1px `border` on every variant, so filled variants paint 1px inside their box — no reason for keeping it (rather than `bg-clip-border` everywhere) is recorded; album-card.tsx:45 works around it with `border-0`.
- button.tsx:51 uses `px-[18px]` for `default`; the original Figma comment (commit e46f939) listed `px-4` (16px) for that size while the class was already 18px. Which is the frame's value, and why 18 over `px-4`, is not recorded.
- DESIGN_SYSTEM.md's type-scale table names the primitive `text-xxs` for "chips, badges, button-sm only" · the source uses the semantic alias `text-2xsmall` (button.tsx:52), per the no-primitive-tokens rule. The size table above uses the alias; the type-scale row does not.
- home.tsx `button` section carries no "Used in" links, although every surface mounts one; which two or three to point at is not recorded.
