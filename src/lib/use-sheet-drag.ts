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

// The thresholds and the two measurements this shares with the app's other
// gesture — see `gesture.ts`. The sheet used to carry its own slop (6px
// against the cards' 8), which is the sort of difference that makes two
// gestures on the same screen feel like they came from two apps.
import {
  SLOP, DISMISS_DISTANCE, DISMISS_VELOCITY, createTrail, scrollersAtTop,
} from "@/lib/gesture"

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
    let dy = 0
    let dragging = false
    let pointerId: number | null = null
    let frame = 0
    const trail = createTrail()


    const move = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      const y = e.clientY - startY
      const x = e.clientX - startX

      if (!dragging) {
        // Vertical, downward and past the slop — otherwise leave the event to
        // the page: a horizontal swipe is a row action, a tap is a tap.
        if (Math.abs(x) > Math.abs(y)) { pointerId = null; return }
        if (y < SLOP) return
        // Re-base on the point where the drag BEGAN, not where the finger
        // landed: without this the sheet jumps by the slop the moment it
        // starts moving, which is the first thing that feels wrong.
        startY += SLOP
        dragging = true
        // Capture can throw if the pointer is already gone (or synthetic);
        // the drag is still worth running without it.
        try { el.setPointerCapture(e.pointerId) } catch { /* not capturable */ }
        el.style.transition = "none"
        el.style.willChange = "transform"
        // `touch-action` is read when a gesture STARTS, so setting it here
        // does nothing for the gesture already in flight — the list underneath
        // keeps panning against the same finger, and the two fight. What does
        // work mid-gesture is refusing the browser's scroll outright, which
        // needs a non-passive `touchmove` (see `block` below).
        el.style.touchAction = "none"
        el.dataset.dragging = ""
      }

      // Upward past the top edge is resisted rather than refused, which is
      // what tells a finger the sheet is already as far up as it goes.
      dy = (e.clientY - startY) < 0 ? (e.clientY - startY) / 4 : e.clientY - startY
      // One write per FRAME. Pointer moves arrive faster than the screen
      // refreshes (120Hz reporting against a 60Hz paint is routine), and
      // writing a transform per event makes the sheet stutter against its own
      // updates instead of tracking the finger.
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          el.style.transform = `translate3d(0, ${dy}px, 0)`
          /* The backdrop thins as the sheet leaves, published the same way
             Base UI's Drawer publishes its own drag (`--drawer-swipe-progress`)
             so both families of sheet behave alike: the page brightening under
             the finger is what makes the sheet feel attached to it rather than
             merely following it. */
          document.documentElement.style.setProperty(
            "--sheet-drag-progress",
            String(Math.min(1, Math.max(0, dy / Math.max(1, el.offsetHeight)))),
          )
        })
      }
      trail.push(e.clientY, e.timeStamp)
    }

    const end = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      pointerId = null
      if (!dragging) return
      dragging = false
      delete el.dataset.dragging

      const velocity = trail.velocity(e.clientY, e.timeStamp)
      const dismiss = dy > DISMISS_DISTANCE || (dy > 24 && velocity > DISMISS_VELOCITY)

      const springBack = () => {
        el.style.animation = ""
        el.style.transition = "transform 220ms cubic-bezier(0.2, 0, 0, 1)"
        el.style.transform = ""
        document.documentElement.style.removeProperty("--sheet-drag-progress")
      }
      if (frame) { cancelAnimationFrame(frame); frame = 0 }
      el.style.touchAction = ""
      el.style.willChange = ""

      if (dismiss) {
        /* Take the popup's own exit animation off the table first. A CSS
           animation beats an inline style in the cascade, so the dialog's
           `slide-out` — whose keyframes start at translate 0 — yanked the
           sheet back UP to where it was before playing, which is the jump
           back that made a dismissal look like a mistake. With no animation
           to run, Base UI's "closed" wait resolves immediately and the sheet
           is gone the moment our own slide finishes. */
        el.style.animation = "none"
        // Carry the sheet the rest of the way out, then ask to close.
        el.style.transition = "transform 140ms cubic-bezier(0.4, 0, 1, 1)"
        el.style.transform = `translate3d(0, ${el.offsetHeight}px, 0)`
        // Hand the backdrop back to its own exit — it fades from wherever the
        // drag left it, rather than snapping to full and then fading.
        document.documentElement.style.removeProperty("--sheet-drag-progress")
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
      if (!scrollersAtTop(e.target, el.parentElement)) return
      pointerId = e.pointerId
      startY = e.clientY
      startX = e.clientX
      trail.reset(e.clientY, e.timeStamp)
      dy = 0
    }

    /* CAPTURE phase, all four. The rows inside a sheet have their own pointer
       handling — the playlist editor's drag, the press ripple — and some of
       them stop the event before it reaches the popup. Capturing means the
       sheet sees the gesture first; it still does nothing until the finger has
       travelled, so a row that wants the tap keeps it. */
    /* The one non-passive listener: while dragging, the page may not scroll.
       Passive listeners cannot refuse, and `touch-action` comes too late once
       a finger is already moving. */
    const block = (e: TouchEvent) => {
      if (dragging && e.cancelable) e.preventDefault()
    }

    const opts = { capture: true } as const

    el.addEventListener("pointerdown", down, { ...opts, passive: true })
    el.addEventListener("pointermove", move, { ...opts, passive: true })
    el.addEventListener("pointerup", end, opts)
    el.addEventListener("pointercancel", end, opts)
    el.addEventListener("touchmove", block, { capture: true, passive: false })
    return () => {
      el.removeEventListener("pointerdown", down, opts)
      el.removeEventListener("pointermove", move, opts)
      el.removeEventListener("pointerup", end, opts)
      el.removeEventListener("pointercancel", end, opts)
      el.removeEventListener("touchmove", block, opts)
      if (frame) cancelAnimationFrame(frame)
      el.style.touchAction = ""
      el.style.willChange = ""
      document.documentElement.style.removeProperty("--sheet-drag-progress")
      el.style.transition = ""
      el.style.transform = ""
      el.style.animation = ""
      delete el.dataset.dragging
    }
  }, [el, enabled, onClose])
}
