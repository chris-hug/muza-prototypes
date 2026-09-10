---
title: Gesture
status: new
source: src/lib/gesture.ts
related: [album-card, playlist-card, artist-card, dialog, drawer, song-list-item, responsive]
usage:
  - not a component — the numbers and tests every pointer gesture in the app shares
summary:
  - **One module, two gestures.** `useLongPress` (is this finger a tap, a drag or a hold?) and `useSheetDrag` (pull a sheet down to dismiss it) answer different questions and stay separate, but they read their thresholds from the same place.
  - **`SLOP = 8`** — how far a finger may travel before it is going somewhere rather than pressing something. Cancels a long press, starts a sheet drag, and disqualifies the click at the end of either.
  - **`DISMISS_DISTANCE = 88` · `DISMISS_VELOCITY = 0.45`** — past that much travel a sheet is released rather than sprung back, or below it if the finger was still moving that fast (px/ms).
  - **`scrollersAtTop`** — the question a downward drag must answer before it may mean anything.
  - **`createTrail(120)`** — release velocity from a window of samples, never from the last two.
  - **`useCoarsePointer()`** is the input gate, not a width gate: it asks what is doing the pointing.
---

Two hand-rolled gestures, one set of numbers. `useLongPress` asks whether a
finger is a tap, a drag or a hold; `useSheetDrag` pulls a bottom sheet down to
dismiss it. They answer different questions, so they stay separate — but they
each used to carry their own copy of the same four decisions, with their own
values, which is how two gestures on one screen drift into feeling like two
different apps. The sheet's slop was 6px against the cards' 8.

The numbers are the ones the phone taught us, and changing one changes both
gestures on purpose.

## The numbers

| Constant | Value | What it decides |
|---|---|---|
| `SLOP` | `8` | Travel past which a press becomes a movement. Cancels a hold, starts a sheet drag, disqualifies the click at the end of either. |
| `DISMISS_DISTANCE` | `88` | A sheet dragged this far is released rather than sprung back. |
| `DISMISS_VELOCITY` | `0.45` px/ms | …or below that distance, if the finger was still moving this fast. |
| trail window | `120` ms | How much history the release velocity is measured over. |

**Velocity from the last two samples is noise.** They can share a timestamp,
which reads as a dead stop, or land 2px apart, which reads as a flick. A
window of samples is what the finger was actually doing at the end, which is
why `createTrail` exists rather than a subtraction at the end of the drag.

**`scrollersAtTop(node, boundary)`** is the test a downward drag has to pass
before it may mean anything at all: a sheet is mostly list, and inside one the
same movement means "scroll up". Only when every scrollable box between the
finger and the sheet is already at its top is the gesture unambiguous.

## A drag is never a tap

`useLongPress` swallows the click if the pointer moved more than `SLOP`
between down and up — the same threshold that cancels the hold, so one gesture
cannot be both.

The browser's own rule is not enough. It suppresses a click after a *scroll*,
but a short drag — the beginning of a rail swipe, or a flick the scroller
declines to follow — is not a scroll as far as the browser is concerned. So
the click landed, and the card opened the album the finger was trying to swipe
past. That was reported as *"the cards are too sensitive to taps"*, and it is
the same 8px.

The click that follows a **completed** press is swallowed too, or the card
opens underneath its own menu.

## The hold is visible from the first frame

The props `useLongPress` returns carry **`data-pressing`** while a finger is
down and still within the slop. `app.css` turns that into `scale: 0.98` and a
slight darkening, on coarse pointers only.

It is not decoration. A hold is 450–500ms of nothing happening, and without a
response the wait reads as a tap that did not register — so people lift and
try again, which is a tap, which opens the page. The card being *taken* is
what tells a finger to keep waiting.

## Touch only

Both gestures check `(pointer: coarse)` before they do anything. On a mouse,
dragging a dialog by its body is not a gesture anyone makes, and pointer
capture would swallow text selection. `useLongPress` also declines the desktop
`contextmenu`, and iOS's own image menu has to be declined globally
(`img { -webkit-touch-callout: none }`) rather than from the handler — it has
to be in force before the finger lands.

## `useCoarsePointer` — the input gate

Lives in `use-media-query.ts` beside the width gates, and is deliberately not
one of them. Width says how much room there is; this says what is doing the
pointing, and they are different questions. A 24px-tall line of text is a fine
link under a cursor and a coin toss under a thumb, at any window width.

It is also deliberately **not** overridden by `WindowWidthContext`: the design
system's "window 375" frame is still being read with a mouse, and a demo that
hid its links there would be lying about the machine it is running on.

Its first use is the song row's meta line — see
[song-list-item](song-list-item.md).

## `useSheetDrag` is a workaround, and says so

`Sheet` gets pull-to-dismiss from Base UI's Drawer, which has a better-tuned
version of this gesture. `useSheetDrag` exists only because a **Dialog is not
a Drawer**: below `md` a Dialog is presented as a bottom sheet by CSS alone,
and a bottom sheet that answers only its ✕ feels broken under a thumb.

What it has to get right, each rule earned:

- **Keyed on the ELEMENT, not a ref.** A dialog's popup is not in the tree
  until the dialog opens, while the component holding the ref mounts with the
  page — so an effect keyed on a ref object runs once, against `null`, and
  never again.
- **Capture phase, all four listeners.** Rows inside a sheet have their own
  pointer handling and some stop the event before it reaches the popup.
- **One transform per FRAME.** Pointer moves arrive faster than the screen
  refreshes (120Hz reporting against a 60Hz paint is routine), and writing a
  transform per event makes the sheet stutter against its own updates instead
  of tracking the finger.
- **Re-base on where the drag began**, not where the finger landed, or the
  sheet jumps by the slop the moment it starts moving.
- **`touch-action` is read when a gesture STARTS**, so setting it mid-drag
  does nothing — refusing the browser's scroll needs a non-passive
  `touchmove`.
- **It closes by clicking the sheet's own close button**, which is always in
  the tree, so the dialog's close semantics and focus restoration are the
  dialog's.
- **A refused close springs back.** A sheet holding unsaved work answers a
  dismissal with a confirmation and stays open; `data-open` a frame later
  means refused.

**When the sheet-shaped dialogs move onto Drawer, this hook and half of
`gesture.ts` go with them.** That is phase 2, deferred on purpose.

## Open questions

- The 450–500ms hold is not a shared constant — it lives in `useLongPress`'s
  default. It probably belongs here with the rest.
- Nothing reads `DISMISS_VELOCITY` except the sheet. If a card ever gains a
  flick, the two should agree, and it is not written down which way.
