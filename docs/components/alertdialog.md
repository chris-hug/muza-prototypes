---
title: AlertDialog
status: updated
source: src/components/ui/alert-dialog.tsx
related: [dialog, toast]
---

A confirm for an action that **cannot be undone**. It shares every surface
rule with [Dialog](docs/components/dialog.md) — bottom sheet on phones,
centred modal from `md` (768) up, the same gutter, gap and header structure — and
differs only in what it demands of the user.

## When it is the right component

Use `AlertDialog` when the user would lose something by getting it wrong:
deleting a track, removing a card, discarding an edit. Everything else — a
picker, a form, a detail view — is a `Dialog`.

The distinction is not cosmetic:

- an alert is **modal in the strict sense**: it does not close on a click
  outside or on `Escape`, because a stray tap must not be able to confirm or
  dismiss a destructive choice;
- it has exactly **two actions**, and they are not symmetric. Cancel is the
  safe one and reads first in the DOM; the destructive one is the last thing
  the thumb reaches;
- it carries **no ✕**. Dismissal is the explicit Cancel, so leaving is a
  decision rather than an accident.

## Structure

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
| Destructive confirm | `destructive` |
| Non-destructive confirm (rare) | `default` |

`destructive` is reserved for exactly this: an irreversible action inside an
alert. A red button anywhere else spends the signal that makes this one work.
