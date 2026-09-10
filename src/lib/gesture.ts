"use client"

/*
 * gesture — the small facts the app's pointer gestures share.
 *
 * There used to be two hand-rolled gestures here: `useLongPress` (is this
 * finger a tap, a drag, or a hold?) and `useSheetDrag` (pull a bottom sheet
 * down to dismiss it). They answered different questions but each carried its
 * own copy of the same decisions, with its own numbers — the sheet's slop was
 * 6px against the cards' 8, which is how two gestures on one screen start
 * feeling like two apps.
 *
 * The sheet drag is GONE. A `Dialog` presented as a bottom sheet renders as a
 * Base UI `Drawer` below `md`, so the pull-down comes from the library, and
 * `useSheetDrag` went with it — along with the dismiss thresholds, the
 * velocity trail and the scroller test, which only it used. What is left is
 * what a press needs: how far a finger may travel before it is going
 * somewhere rather than pressing something.
 *
 * The number is the one the phone taught us.
 */

/**
 * How far a finger may travel before it is going somewhere rather than
 * pressing something. Cancels a long press, and disqualifies the click at the
 * end of one.
 *
 * The browser's own rule is not enough: it suppresses a click after a
 * SCROLL, but a short drag — the beginning of a rail swipe, or a flick the
 * scroller declines to follow — is not a scroll as far as it is concerned. So
 * the click landed, and the card opened the album the finger was trying to
 * swipe past.
 */
export const SLOP = 8

/** Distance between two points, for the slop test. */
export function travelled(from: { x: number; y: number }, x: number, y: number) {
  return Math.hypot(x - from.x, y - from.y)
}
