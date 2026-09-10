"use client"

/*
 * The press and hover ripples' origin, installed ONCE for the whole document.
 *
 * A hook returning an `onPointerDown` was the obvious shape and does not fit
 * what the app actually is: half the pressable surfaces are not components at
 * all but exported class strings (`filterButtonClass`, the card menu's
 * `TRIGGER_CLASS`), and there is nowhere to hang a handler on those. Threading
 * one through every call site would also mean any surface that forgot it
 * silently lost its press — which is exactly the kind of drift this system has
 * been fighting all along.
 *
 * So: one capturing listener, keyed on the `.press-ripple` class. Anything
 * that wears the class gets the behaviour, whether it is a component, a class
 * string, or something written next year.
 *
 * Nothing is stored in state — a press must not re-render.
 */

import * as React from "react"

let installed = false

function onPointerDown(e: PointerEvent) {
  const el = (e.target as Element | null)?.closest<HTMLElement>(".press-ripple")
  if (!el) return

  const r = el.getBoundingClientRect()
  el.style.setProperty("--press-x", `${((e.clientX - r.left) / r.width)  * 100}%`)
  el.style.setProperty("--press-y", `${((e.clientY - r.top)  / r.height) * 100}%`)

  /* Dropping and re-adding the attribute inside one paint does NOT restart a
     CSS animation, so a second press in a row would not move. Reading
     `offsetWidth` between the two forces the reflow that makes it a new
     animation — a pseudo-element's cannot be restarted from JS any other way. */
  el.removeAttribute("data-press")
  void el.offsetWidth
  el.setAttribute("data-press", "")
}

/* The hover fill grows from the point the pointer CROSSED THE EDGE, so the
   colour arrives from the direction you came from. Same trick as the press,
   one difference: the radius is not animated by a keyframe but transitioned by
   `:hover` itself (`state-fade` lists `--hover-r`), so leaving un-grows it
   back toward the same point instead of needing a second animation.
   
   `pointerover` bubbles, unlike `pointerenter`, so ONE listener covers the
   document. It fires again for every child crossed inside the button, which is
   why the origin is only written when the button was not already hovered —
   otherwise moving over the label would keep resetting the circle's centre to
   wherever the pointer is now and the fill would follow the cursor around.
   
   Mouse only. On touch, `pointerover` fires on tap, immediately before the
   press ripple, and the two would run over each other; `:hover` also sticks on
   a touch surface long after the finger is gone. */
function onPointerOver(e: PointerEvent) {
  if (e.pointerType !== "mouse") return
  const el = (e.target as Element | null)?.closest<HTMLElement>(".press-ripple")
  if (!el) return
  /* `relatedTarget` is where the pointer came FROM. Inside the same button
     means this is an internal crossing, not an entry. */
  const from = e.relatedTarget as Element | null
  if (from && el.contains(from)) return

  const r = el.getBoundingClientRect()
  el.style.setProperty("--hover-x", `${((e.clientX - r.left) / r.width)  * 100}%`)
  el.style.setProperty("--hover-y", `${((e.clientY - r.top)  / r.height) * 100}%`)
}

/** Call once, from the app shell. Idempotent. */
export function usePressRipple() {
  React.useEffect(() => {
    if (installed) return
    installed = true
    /* Capture, so a child that stops propagation cannot swallow the press. */
    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true })
    document.addEventListener("pointerover", onPointerOver, { capture: true, passive: true })
  }, [])
}
