---
title: Gesture
status: new
source: src/lib/gesture.ts
related: [album-card, playlist-card, artist-card, dialog, drawer, song-list-item, responsive]
usage:
  - not a component — the numbers and tests every pointer gesture in the app shares
summary:
  - **One hand-rolled gesture left.** `useLongPress` asks whether a finger is a tap, a drag or a hold. The pull-down is the library's — a `Dialog` presented as a bottom sheet renders as a Base UI `Drawer`, so the gesture comes from the primitive.
  - **`SLOP = 8`** — how far a finger may travel before it is going somewhere rather than pressing something. Cancels a long press and disqualifies the click at the end of one.
  - **A drag is never a tap.** The browser suppresses a click after a scroll, but not after a short drag the scroller declined to follow — which is how a card opened the album a finger was swiping past.
  - **`data-pressing`** paints the hold from the first frame, or the wait reads as a tap that did not register.
  - **`useCoarsePointer()`** is the input gate, not a width gate: it asks what is doing the pointing.
contract:
  - "[touch] **A gesture comes from the library unless it cannot.** Sheets pull down because they are Base UI `Drawer`s — dialogs presented as bottom sheets included. The one hand-rolled gesture left is the long press, and its slop lives in `src/lib/gesture.ts` rather than at a call site: the sheet drag once carried its own against the cards', which is how two gestures on one screen start feeling like two apps."
  - "[touch] **A drag is never a tap, and a press must be visible.** Any component that adds a hold gets both from `useLongPress`: the click is swallowed if the finger travelled, and `data-pressing` paints the hold from the first frame. A hold with no feedback reads as a tap that did not register."
  - "[touch] **iOS wants your long press too.** `img { -webkit-touch-callout: none }` is global and has to be: it must be in force before the finger lands, so it cannot come from a press handler."
---

**One hand-rolled gesture, and it is deliberately the only one.**
`useLongPress` asks whether a finger is a tap, a drag or a hold. Everything
else a finger does to a surface comes from Base UI: a `Sheet` is a `Drawer`,
and a `Dialog` presented as a bottom sheet renders as one too, so the
pull-down is the library's.

There used to be a second — `useSheetDrag`, two hundred lines giving the
dialog-family sheets a gesture the Drawer already had. It is gone, and the
dismiss thresholds, the velocity trail and the scroller test went with it,
because nothing else used them.

## The number

| Constant | Value | What it decides |
|---|---|---|
| `SLOP` | `8` | Travel past which a press becomes a movement. Cancels a hold, and disqualifies the click at the end of one. |

A module with one export earns its place for the reason it was written: the
sheet drag once carried its own slop, 6px against the cards' 8, and two
gestures on one screen that disagree by 2px feel like two apps. A number a
second gesture would want is a number that belongs in one place.

## What the deleted gesture had to get right

Kept because the reasoning outlived the code — this is what any
pull-to-dismiss has to handle, and therefore what Base UI's Drawer is doing
for us now:

- **It must not eat a scroll.** A sheet is mostly list, and inside one the same
  downward drag means "scroll up". The gesture may only begin when every
  scrollable box under the finger is already at its top.
- **Velocity from the last two samples is noise.** They can share a timestamp,
  which reads as a dead stop, or land 2px apart, which reads as a flick. A
  window of samples is what the finger was actually doing at the end.
- **A CSS animation beats an inline transform.** A keyframe exit whose frames
  start at translate 0 yanks a swiped sheet back to where it was before
  playing — which is why both families move by *transition*, not animation.
- **A refused close has to spring back.** A sheet holding unsaved work answers
  a dismissal with a confirmation and stays open; without the spring you get a
  backdrop over an empty screen and the sheet parked below the fold.

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

## The move that deleted it

Below `md`, `Dialog` used to be presented as a bottom sheet by CSS alone — the
right shape, with no gesture, because a Dialog is not a Drawer. `useSheetDrag`
supplied one.

It renders as a `Drawer` now. The two families cannot be mixed — every part
reads its own root's context, so a `Dialog.Title` inside a `Drawer.Root` finds
nothing — which is why the root has to know the presentation before the
content renders, and why **`mobile` moved from `DialogContent` up to
`Dialog`**. How a dialog is presented is a property of the dialog, not of the
box inside it.

`mobile="form"` stays a Dialog on purpose: a Drawer always carries a swipe,
and a downward flick over a half-filled form should not discard it.

Three things had to come across by hand, and they are the reason this was a
move rather than a deletion: the popup must opt back into pointer events (the
Drawer's viewport is `pointer-events: none` so the backdrop still takes a
tap), the enter must be a transition rather than a keyframe, and the backdrop
reads `--drawer-swipe-progress` where it used to read a variable of ours.

## Open questions

- The 450–500ms hold is not a shared constant — it lives in `useLongPress`'s
  default. With the sheet drag gone there is only one gesture to disagree
  with itself, so it matters less, but the module is still where it belongs.
- ~~Nothing reads `DISMISS_VELOCITY` except the sheet~~ — **answered by the
  Drawer move**: the constant is gone, along with the gesture that read it.
  Base UI's release threshold is the library's business now.
