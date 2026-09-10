---
title: Drawer
source: src/components/ui/sheet.tsx
related: [dialog, detail-more-button, footer-nav]
usage:
  - Cart drawer (topbar 🛒 button) | /
  - Footer tab bar › Studio switcher (bottom sheet) | /
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

## Usage

Where it is used: the **cart** (`cart-drawer.tsx`, `side="right"`, `w-full
max-w-[640px] p-0 gap-0`), the **Studio switcher** in the footer tab bar
(`footer-nav.tsx`, `side="bottom" rounded-t-2xl`), and the phone surface of
[Detail Menu](detail-more-button.md) (`side="bottom"`).

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
