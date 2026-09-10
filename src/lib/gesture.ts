"use client"

/*
 * gesture — the small facts every pointer gesture in this app needs, in one
 * place.
 *
 * There are two hand-rolled gestures: `useLongPress` (is this finger a tap, a
 * drag, or a hold?) and `useSheetDrag` (pull a bottom sheet down to dismiss
 * it). They answer different questions, so they stay separate — but they were
 * each carrying their own copy of the same four decisions, with their own
 * numbers, which is how two gestures drift apart into feeling like two
 * different apps.
 *
 * The numbers here are the ones the phone taught us, and changing one changes
 * both gestures on purpose.
 *
 * (Base UI's Drawer has its own, better-tuned version of the dismiss gesture;
 * `useSheetDrag` exists because a Dialog is not a Drawer. When the sheet-shaped
 * dialogs move onto Drawer, that hook and half of this module go with them.)
 */

/**
 * How far a finger may travel before it is going somewhere rather than
 * pressing something. Cancels a long press, starts a sheet drag, and
 * disqualifies the click at the end of either.
 */
export const SLOP = 8

/** Past this much travel, a sheet is released rather than sprung back. */
export const DISMISS_DISTANCE = 88

/** …or below it, if the finger was still moving this fast (px/ms). */
export const DISMISS_VELOCITY = 0.45

/** Distance between two points, for the slop test. */
export function travelled(from: { x: number; y: number }, x: number, y: number) {
  return Math.hypot(x - from.x, y - from.y)
}

/**
 * Is every scrollable box between `node` and `boundary` already at its top?
 *
 * The question a downward drag has to answer before it may mean anything: a
 * sheet is mostly list, and inside one the same movement means "scroll up".
 * Only when there is nothing left to scroll is the gesture unambiguous.
 */
export function scrollersAtTop(node: EventTarget | null, boundary: Element | null) {
  let n = node as HTMLElement | null
  while (n && n !== boundary) {
    if (n.scrollHeight > n.clientHeight + 1 && n.scrollTop > 0) return false
    n = n.parentElement
  }
  return true
}

/**
 * A short history of where the finger has been, for release velocity.
 *
 * Velocity from the last two samples is noise: they can share a timestamp,
 * which reads as a dead stop, or land 2px apart, which reads as a flick. A
 * window of samples is what the finger was actually doing at the end.
 */
export function createTrail(windowMs = 120) {
  let points: { y: number; t: number }[] = []
  return {
    reset(y: number, t: number) { points = [{ y, t }] },
    push(y: number, t: number) {
      points.push({ y, t })
      while (points.length > 1 && t - points[0].t > windowMs) points.shift()
    },
    /** px/ms, positive downward. 0 when there is nothing to measure from. */
    velocity(y: number, t: number) {
      const first = points[0]
      return first && t > first.t ? (y - first.y) / (t - first.t) : 0
    },
  }
}
