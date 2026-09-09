---
title: AlertDialog
status: updated
source: src/components/ui/alert-dialog.tsx
related: [dialog, toast]
usage:
  - nothing — but the product confirms destructively anyway: Wallet › Manage hand-rolls a delete confirmation as a plain Dialog (manage-v2.tsx:153), as does Bulk actions
---

A confirm for an action that **cannot be undone** — delete a track, remove a
card, discard an edit. Like every [Dialog](dialog.md) it is a bottom sheet
below 768 and a centred modal from there up; it differs in what it demands of
the user: no ✕, no outside-click dismissal, exactly two actions.

## When it is the right component

Use `AlertDialog` when the user would lose something by getting it wrong.
Everything else — a picker, a form, a detail view — is a `Dialog`.

The distinction is not cosmetic:

- an alert is **modal in the strict sense**: Base UI's `AlertDialog.Root`
  omits the `modal` and `disablePointerDismissal` props altogether, so a
  stray tap outside can never confirm or dismiss a destructive choice;
- it has exactly **two actions**, and they are not symmetric. Cancel is the
  safe one and reads first in the DOM; the destructive one is the last thing
  the thumb reaches;
- it carries **no ✕**. Dismissal is the explicit Cancel, so leaving is a
  decision rather than an accident.

## Anatomy

```tsx
<AlertDialog>
  <AlertDialogTrigger render={<Button variant="destructive" />}>
    <Trash2 /> Delete track
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete “Blue Afternoon”?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently remove the track from your profile and all
        playlists it appears in. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete track</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

| Part | What it wears |
|---|---|
| `AlertDialogBackdrop` | `fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]` — darker than the Dialog's `bg-black/10`: the page behind is not something to return to by tapping |
| `AlertDialogContent` | `bg-background border border-border p-6 shadow-xl`; phone `inset-x-0 bottom-0 rounded-t-2xl rounded-b-none`; `md:` centred, `md:max-w-md md:rounded-2xl` |
| `AlertDialogHeader` | `flex flex-col gap-2 mb-4` |
| `AlertDialogTitle` | `text-base font-medium text-foreground leading-snug` |
| `AlertDialogDescription` | `text-small text-muted-foreground leading-relaxed` |
| `AlertDialogFooter` | `flex justify-end gap-2 mt-6` |
| `AlertDialogCancel` | `AlertDialogPrimitive.Close` rendered as `Button variant="outline"` |
| `AlertDialogAction` | `AlertDialogPrimitive.Close` rendered as `Button variant="destructive"`; a caller's `render` prop replaces that button (props spread after the default) |

Both buttons are `Close` elements: confirming closes the dialog, and the
caller runs the action from `onClick` (or from `onOpenChange`).

## Wording

The title asks the question with the **object named**: "Delete Chase Visa?",
not "Are you sure?". A user who has just tapped something knows they tapped
something; what they need confirmed is *what*.

The description states the **consequence and its reach** — what disappears,
from where, and whether it comes back. "This will permanently remove the track
from your profile and all playlists it appears in. This action cannot be
undone."

The confirming button repeats the **verb**, never "OK" or "Yes". Read on its
own, out of context, the button should still say what will happen: *Delete
track*, *Remove card*, *Discard changes*.

## Buttons

| Role | Variant |
|---|---|
| Cancel | `outline` |
| Destructive confirm | `destructive` (the `AlertDialogAction` default) |
| Non-destructive confirm (rare — "Unpublish") | `<AlertDialogAction render={<Button />}>` — the primary pill |

`destructive` is reserved for exactly this: an irreversible action inside an
alert. A red button anywhere else spends the signal that makes this one work.

## Sizing

Reads the **window**, one step: **768** (`md:`), the presentation gate. Below
it the popup is a full-width bottom sheet (`inset-x-0 bottom-0 max-w-full`,
top corners only); from 768 it is centred at `max-w-md` (448px). No column or
box measurement — the sheet is chrome, not content.

## Behaviour

- **No outside-click dismissal, no ✕.** Only Cancel, the confirming action,
  or the caller setting `open={false}` close it.
- **Focus is trapped** and page scroll is locked while open (Base UI modal
  default; `AlertDialog.Root` does not expose `modal`).
- Both `AlertDialogCancel` and `AlertDialogAction` close on activation; the
  action's side effect runs in the `onClick` you pass.
- No keyboard lift: an alert holds no field, so `--kb` never applies and the
  sheet sits at `bottom-0`, not `bottom-[var(--kb)]` like a `Dialog`.

## Open questions

- alert-dialog.tsx:77 · the popup is `p-6` at every width · `dialog.tsx` gives a bottom sheet a 12px gutter (`p-3 md:p-6`) and an 8px band gap, and dialog.md says the alert "shares every surface rule with Dialog — the same gutter, gap and header structure". It does not: the alert has no `dialogChromeClass`, its header is `gap-2 mb-4`, its footer is a plain `justify-end` row (not the full-bleed, sticky, `flex-col-reverse` `dialogFooterClass` bar), and its title is `text-base` where the dialog's is `text-small`. Either the alert adopts the sheet rhythm or the claim goes.
- alert-dialog.tsx:70 · the phone sheet sits at `bottom-0` · every Dialog sheet sits at `bottom-[var(--kb,0px)]`. Moot while an alert holds no field; a sentence in DESIGN_SYSTEM ("every sheet sits at `bottom: var(--kb)`") does not hold for it.
- The design-system section used to show a static "Confirm — destructive" built from `DialogPreview` (Dialog chrome) beside a hand-typed `<Dialog>` snippet — a look-alike with the wrong gutter, title size and footer. There is no `AlertDialogPreview` export, so the section now shows the live triggers only; an inline preview sharing the alert's own class strings would let a 375 chip show the sheet shape without a click.
- Whether `Escape` closes an alert is Base UI's default and not set in `alert-dialog.tsx`; the earlier doc asserted it does not. Unverified here.
