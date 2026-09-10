"use client"

/*
 * useSheetDrag — pull-down-to-dismiss for a BOTTOM SHEET that is not a Drawer.
 *
 * `Sheet` gets this from Base UI's Drawer (`swipeDirection`). The Dialog does
 * not: below `md` a `Dialog` is presented as a bottom sheet by CSS alone, and
 * a bottom sheet that answers only its ✕ feels broken under a thumb. This is
 * that gesture, on the same terms — drag the sheet down, past a threshold it
 * closes, short of it it springs back.
 *
 * What it has to get right, and why each rule is here:
 *
 * · It must not eat a SCROLL. A sheet is mostly list, and the same downward
 *   drag means "scroll up" inside one. So the gesture only starts when every
 *   scrollable box under the finger is already at its top — then there is
 *   nothing left to scroll and the drag is unambiguous.
 * · It must not eat a control. A drag that never passes the threshold leaves
 *   the tap alone; the browser's own click still fires.
 * · Touch only (`pointer: coarse`). On a mouse, dragging a dialog by its body
 *   is not a gesture anyone makes, and pointer capture would swallow
 *   text selection.
 * · It closes by CLICKING the sheet's own close button rather than calling an
 *   `onOpenChange` this hook does not have. The close button is always in the
 *   tree (`DialogContent` renders one) and carries the dialog's own close
 *   semantics — focus restoration included.
 */

import { useEffect } from "react"

/** Past this many pixels the sheet closes on release. */
const DISTANCE = 88
/** …or below it, if the finger was still moving down this fast (px/ms). */
const VELOCITY = 0.45
/** Slop before a drag is a drag rather than a tap or a horizontal swipe. */
const SLOP = 6

/*
 * Takes the ELEMENT, not a ref to it. A dialog's popup is not in the tree
 * until the dialog opens, while the component holding the ref mounts with the
 * page — so an effect keyed on a ref object runs once, against `null`, and
 * never again. Keyed on the element it re-runs the moment the sheet appears.
 */
export function useSheetDrag(
  el: HTMLElement | null,
  { enabled = true, onClose }: { enabled?: boolean; onClose: () => void },
) {
  useEffect(() => {
    if (!el || !enabled) return
    if (!window.matchMedia("(pointer: coarse)").matches) return

    let startY = 0
    let startX = 0
    let lastY = 0
    let lastT = 0
    let dy = 0
    let dragging = false
    let pointerId: number | null = null
    let frame = 0

    /** Every scrollable box between `node` and the sheet is at its top. */
    const atTop = (node: EventTarget | null) => {
      let n = node as HTMLElement | null
      while (n && n !== el.parentElement) {
        if (n.scrollHeight > n.clientHeight + 1 && n.scrollTop > 0) return false
        n = n.parentElement
      }
      return true
    }

    const move = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      const y = e.clientY - startY
      const x = e.clientX - startX

      if (!dragging) {
        // Vertical, downward and past the slop — otherwise leave the event to
        // the page: a horizontal swipe is a row action, a tap is a tap.
        if (Math.abs(x) > Math.abs(y)) { pointerId = null; return }
        if (y < SLOP) return
        dragging = true
        // Capture can throw if the pointer is already gone (or synthetic);
        // the drag is still worth running without it.
        try { el.setPointerCapture(e.pointerId) } catch { /* not capturable */ }
        el.style.transition = "none"
        // The browser must stop treating this gesture as a scroll. Without it
        // the list underneath keeps panning while the sheet moves, and the two
        // fight over the same finger — which is what made the drag feel like
        // it was catching rather than tracking.
        el.style.touchAction = "none"
        el.dataset.dragging = ""
      }

      // Upward past the top edge is resisted rather than refused, which is
      // what tells a finger the sheet is already as far up as it goes.
      dy = y < 0 ? y / 4 : y
      // One write per FRAME. Pointer moves arrive faster than the screen
      // refreshes (120Hz reporting against a 60Hz paint is routine), and
      // writing a transform per event makes the sheet stutter against its own
      // updates instead of tracking the finger.
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          el.style.transform = `translate3d(0, ${dy}px, 0)`
        })
      }
      const now = e.timeStamp
      if (now !== lastT) {
        lastY = e.clientY
        lastT = now
      }
    }

    const end = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      pointerId = null
      if (!dragging) return
      dragging = false
      delete el.dataset.dragging

      const velocity = lastT ? (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT) : 0
      const dismiss = dy > DISTANCE || (dy > 24 && velocity > VELOCITY)

      const springBack = () => {
        el.style.transition = "transform 220ms cubic-bezier(0.2, 0, 0, 1)"
        el.style.transform = ""
      }
      if (frame) { cancelAnimationFrame(frame); frame = 0 }
      el.style.touchAction = ""

      if (dismiss) {
        // Carry the sheet the rest of the way out, then ask to close.
        el.style.transition = "transform 140ms cubic-bezier(0.4, 0, 1, 1)"
        el.style.transform = `translate3d(0, ${el.offsetHeight}px, 0)`
        window.setTimeout(() => {
          onClose()
          /* The close can be REFUSED — a sheet holding unsaved work answers a
             dismissal with a confirmation and stays open. Then the sheet is
             still here, still translated off the bottom of the screen, and
             all the user sees is a backdrop over nothing. `data-open` is the
             dialog's own answer: still open a frame later means refused, so
             the sheet comes back. */
          requestAnimationFrame(() => {
            if (el.isConnected && el.hasAttribute("data-open")) springBack()
          })
        }, 120)
        return
      }

      springBack()
    }

    const down = (e: PointerEvent) => {
      // A second finger during a drag is ignored; otherwise the newest
      // pointer takes over, so a gesture that never sent its `pointerup`
      // (a cancelled touch, a device that drops the event) cannot wedge the
      // sheet shut for the rest of its life.
      if (e.pointerType === "mouse" || dragging) return
      if (!atTop(e.target)) return
      pointerId = e.pointerId
      startY = e.clientY
      startX = e.clientX
      lastY = e.clientY
      lastT = e.timeStamp
      dy = 0
    }

    /* CAPTURE phase, all four. The rows inside a sheet have their own pointer
       handling — the playlist editor's drag, the press ripple — and some of
       them stop the event before it reaches the popup. Capturing means the
       sheet sees the gesture first; it still does nothing until the finger has
       travelled, so a row that wants the tap keeps it. */
    const opts = { capture: true } as const
    // The sheet says whether the gesture is attached — otherwise invisible
    // from outside devtools, and this took a while to find once.
    el.dataset.sheetDrag = ""

    el.addEventListener("pointerdown", down, { ...opts, passive: true })
    el.addEventListener("pointermove", move, { ...opts, passive: true })
    el.addEventListener("pointerup", end, opts)
    el.addEventListener("pointercancel", end, opts)
    return () => {
      el.removeEventListener("pointerdown", down, opts)
      el.removeEventListener("pointermove", move, opts)
      el.removeEventListener("pointerup", end, opts)
      el.removeEventListener("pointercancel", end, opts)
      if (frame) cancelAnimationFrame(frame)
      el.style.touchAction = ""
      el.style.transition = ""
      el.style.transform = ""
      delete el.dataset.dragging
      delete el.dataset.sheetDrag
    }
  }, [el, enabled, onClose])
}
