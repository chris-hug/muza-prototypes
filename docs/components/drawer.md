---
title: Drawer
source: src/components/ui/sheet.tsx
related: [dialog, detail-more-button, footer-nav]
usage:
  - Cart drawer (topbar 🛒 button) | /
  - Footer tab bar › Studio switcher (bottom sheet) | /
contract:
  - "[touch] **A bottom sheet's top corner is owned by `SIDE_CLASSES.bottom`.** No call site writes it: the value is derived from the control the bar has to hold, so it is stated once, where that arithmetic lives."
  - "[sheet] **An overlay panel does not push content.** A panel opening under a sticky header is out of flow (`absolute inset-x-* top-full z-40`) so it floats over the page instead of displacing it."
---

`Sheet` is the edge-anchored drawer — the cart from the right, the Studio
switcher and the detail "…" menu from the bottom. Built on Base UI's
`Drawer` primitive, so swipe-to-dismiss, snap points, focus trapping and the
enter / exit sequencing come with it; the chrome matches `Dialog` so drawers
and modals read as one family.

## Anatomy

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger render={<Button variant="outline">Open</Button>} />
  <SheetContent side="right" className="max-w-[420px]">
    <SheetHeader>
      <SheetTitle>Your cart</SheetTitle>
      <SheetDescription>…</SheetDescription>
    </SheetHeader>
    <div className="flex-1 overflow-y-auto px-6 py-4">…</div>
    <SheetFooter>
      <SheetClose render={<Button variant="outline">Cancel</Button>} />
      <SheetClose render={<Button>Save</Button>} />
    </SheetFooter>
  </SheetContent>
</Sheet>
```

| Part | What it wears | Why |
|---|---|---|
| `SheetOverlay` | `fixed inset-0 z-50 bg-black/30`, fades | between the dialog's `/10` and the alert's `/40` |
| `SheetContent` | `fixed z-50 flex flex-col bg-background text-popover-foreground border-border` + one of the side classes; slides in from its edge | a flex column so the body is the one band that scrolls |
| `side="right"` / `"left"` | `inset-y-0 h-dvh`, `border-l` / `border-r`; width from `className` | |
| `side="bottom"` / `"top"` | `inset-x-0 w-dvw`, `border-t` / `border-b`; height from content or `className` | the bottom sheet the "…" menu uses (`rounded-t-2xl` added at the call site) |
| ✕ | `Button ghost icon-sm` at `absolute top-3 right-3`, on by default (`showCloseButton`) | |
| `SheetHeader` | `flex flex-col gap-0.5 px-6 pt-6 pb-4 shrink-0 border-b border-border/60` | the hairline exists because the body scrolls under the header — a `Dialog` body does not, so it has none |
| `SheetTitle` | `text-large font-medium leading-none text-foreground` | the style the dialog frames use for their titles |
| `SheetDescription` | `text-small text-muted-foreground` | |
| `SheetFooter` | `shrink-0 border-t border-border bg-muted px-6 py-4 flex flex-col gap-2` | the dialog footer's chrome: the action band reads as its own surface |

The body is whatever you put between header and footer — give it `flex-1
overflow-y-auto` and its own padding.

## `SheetGrabber` — the pull-down, drawn

```tsx
<SheetGrabber className="mx-auto mb-2" />   {/* in the flow  */}
<SheetGrabber className="absolute left-1/2 top-1.5 z-20 -translate-x-1/2" />   {/* overlaid */}
```

36 × 4, `rounded-full bg-border`, `aria-hidden`. It is not decoration and it
is not a control: it is the only thing on screen that says this surface can be
pulled **down**.

**A sheet with a ✕ can go without one**, because the way out is drawn. A sheet
whose only way out is the gesture cannot — the release editor put Save in the
corner the ✕ had been in and left nothing at all saying the sheet could be
left without saving. Every `Dialog` bottom sheet now carries one, phones only,
and never on a `mobile="form"` sheet, which fills the screen and is not
dismissed by dragging.

Two placements, and the choice is about what the sheet's first band is:

- **In the flow** (`mx-auto mb-2`) when the sheet opens on a list — the two
  menu sheets do this, and both used to write the six classes out by hand.
- **Overlaid** (`absolute`) when the sheet opens with a bar or a header across
  the top, where a band of its own would spend a whole row on a 4px pill. It
  is centred, so it clears the bar's leading and trailing controls, and it
  sits above the bar's top inset, so it clears a centred title. Measured at
  375: grabber 7–11px from the top, title top at 20.

`aria-hidden` because the gesture it advertises already has a keyboard and
screen-reader equivalent — Escape, and the dialog's own close — so announcing
a decorative bar would add a landmark that does nothing.

## The corner is 28, and that is not on the radius ladder

Every bottom sheet's top corner is `rounded-t-[28px]`: dialog sheets, `Sheet`,
the mobile dropdown sheet, the mobile alert. **`SIDE_CLASSES.bottom` carries
it**, so a call site never writes it — five of them used to, which is how one
ends up at 18 after a refactor and nobody notices. It is derived from the control it
has to hold, not from a step in the scale.

A `Button` is a pill, so at 40px tall its corner radius is 20, and the sheet's
action bar insets its controls by 8. Outer radius = inner radius + padding, so
28 = 20 + 8, and the two curves are parallel. At the old 18
(`rounded-t-2xl`) **no** inset could nest a 20px curve — it always read as
fighting the corner.

## Usage

Where it is used: the **cart** (`cart-drawer.tsx`, `side="right"`, `w-full
max-w-[640px] p-0 gap-0`), the **Studio switcher** in the footer tab bar
(`footer-nav.tsx`, `side="bottom" rounded-t-2xl`), and the phone surface of
[Detail Menu](detail-more-button.md) (`side="bottom"`).

**So does the backdrop, and it follows the swipe.** Its opacity is
`calc(1 - var(--drawer-swipe-progress, 0))` — declared in `app.css`, NOT as a
Tailwind arbitrary value: the comma in the var's fallback is mangled and
`opacity-[calc(1-var(--x,0))]` resolves to 0, which makes the backdrop
invisible in every state. It brightens under the finger as the sheet leaves — which is what makes the sheet feel attached to it
rather than merely following it. With a keyframe `fade-out` instead, the
backdrop snapped back to full the moment the finger lifted and only then faded:
the page going bright, dark, then bright again, in about a fifth of a second.
`useSheetDrag` publishes the same signal as `--sheet-drag-progress` for the
dialog-family sheets, so both behave alike.

**`[data-closed]` sets the opacity to 0 as well**, and that is what stops the
flicker: on release Base UI drops the swipe variable BEFORE the exit state
lands, so for a frame or two the backdrop returned to its resting `1` — the
page going dark again on its way out. `data-closed` arrives with the close, so
the target is 0 from the first frame and the fade runs from wherever the drag
left it. Measured: 0.40 → 0.11 → 0.04 → 0, monotonic.

**The popup TRANSITIONS; it does not run keyframes.** Base UI writes an inline
transform while the finger is down, and a CSS animation overrides inline styles
— so `slide-out-to-bottom`, whose frames begin at 0, yanked a swiped sheet back
up to its resting place and only then played the exit. That is the "it jumps up
before it disappears" every sheet in the app had. A transition interpolates
from wherever the element actually is, which is where the finger left it.

The resting transform reads Base UI's own swipe offset
(`translateY(var(--drawer-swipe-movement-y, 0px))`) and `data-starting-style` /
`data-ending-style` carry it off-edge, so one declaration serves the open, the
drag, the release and the exit. `data-swiping:transition-none` turns the
transition off for the duration of the drag: while the finger is down the popup
must track it exactly, not chase it.

**A `Drawer.Viewport` is required for the swipe to exist at all.** Base UI puts
`useSwipeDismiss` in the viewport; the popup only reads the resulting state
through context. `SheetContent` renders one — a transparent `fixed inset-0`
layer with `pointer-events-none`, the popup keeping its own positioning and
`pointer-events-auto` — because without it `swipeDirection` on the root is
inert and every sheet in the app could only be closed by its ✕ or the backdrop.
It was missing from the day the component was written.

**`swipeDirection` lives on the root and must match `side`.** `SheetContent`
cannot set it — the popup reads the direction from the root's context — so the
two are declared as a pair. The default is **`"down"`**, because nearly every
sheet in the product is a bottom sheet on a phone; a side drawer overrides it
(`<Sheet swipeDirection="right">`, as `CartDrawer` does). It defaulted to
`"right"` until the bottom sheets were audited, and every one of them —
row menu, detail menu, Studio switcher, every mobile dropdown — could only be
closed by its ✕ or the backdrop.

## Sizing

Fixed at every window — no steps of its own. A side drawer is `h-dvh` and as
wide as its `className` says; a top or bottom drawer is `w-dvw`. `Sheet` is
**not** presentation-swapped: it is a drawer at 320 and at 1920. Which is why
the surfaces that must be a sheet *only* on phones — every `Dialog`, the
`DropdownMenu`, the Detail Menu — do not use it for both forms; the Detail
Menu picks a `Sheet` below 768 and a dropdown above it with `useIsMobile()`.

## Behaviour

- **Modal** by default: focus trapped, scroll locked, outside pointer
  disabled; a click on the overlay closes (`disablePointerDismissal` left
  at `false`).
- **Swipe to dismiss** in `swipeDirection`; drag past the threshold or flick.
- **Snap points** (`snapPoints`, `snapPoint`, `onSnapPointChange`) are
  available from the primitive and unused in the app today.
- Every `SheetClose` closes; `onOpenChange` fires for all paths.

## Open questions

- sheet.tsx:29–34 says to override `swipeDirection` whenever `side` is not the default · `detail-more-button.tsx` mounts `<Sheet>` with the default under `side="bottom"`, and so does `footer-nav.tsx:115` (Studio switcher) — both bottom sheets dismiss rightward. (Also listed under Detail Menu.)
- sheet.tsx:31 (comment) says the default `"right"` "matches our most common usage" · two of the three call sites are bottom sheets; `"down"` would be the majority default, or better, `SheetContent` could derive it from `side` if the primitive allowed setting it there.
- sheet.tsx:138 (comment) says `SheetTitle` matches "the actual title style used across our DialogFrame instances (Create Listing, etc.): text-large" · `dialogTitleClass` is now `text-small` (the sheet title shares its line with the ✕); the two families no longer agree on title size.
- The Drawer's phone sheet sits at `bottom-0` with no `--kb` lift and no `svh` cap; the dialog family has both. Moot for a menu (no field), not for a drawer that grows a form.
