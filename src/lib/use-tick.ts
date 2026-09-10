"use client"

/*
 * useTick — the little spring a control gives when it is picked.
 *
 * Returns a `data-anim` attribute to spread on the element and a `tick()` to
 * call when the value actually CHANGES. The `data-[anim]:animate-…` class does
 * the rest.
 *
 * Why not `data-checked:animate-…`, which is one line and no hook: a state
 * selector matches on mount, so every pre-ticked box in a form bounced on page
 * load. Binding to the change also gets the other half for free — unticking
 * springs too, which a state selector cannot express at all.
 *
 * Shared by `Checkbox` and `RadioGroupItem` because they are the same gesture
 * with different geometry, and two copies of a timing is how two controls stop
 * feeling alike.
 */

import * as React from "react"

/** Slightly longer than the 360ms animation, so the attribute outlives it. */
const HOLD = 400

export function useTick() {
  const [anim, setAnim] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  /* Mirrors `anim` so `tick` can branch without depending on it — a callback
     that changed identity on every tick would re-render every consumer. */
  const running = React.useRef(false)

  const tick = React.useCallback(() => {
    if (!running.current) {
      /* Nothing to restart, so start NOW. This used to go through the two
         frames below unconditionally, which put ~33ms of nothing in front of
         every tick — and a spring that begins two frames after the click reads
         as slow no matter how short it is. */
      running.current = true
      setAnim(true)
    } else {
      /* Already running. Removing and re-adding the attribute inside one paint
         does not restart a CSS animation, so a second tick would simply not
         move; the two frames are what make it a new animation. */
      setAnim(false)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        running.current = true
        setAnim(true)
      }))
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { running.current = false; setAnim(false) }, HOLD)
  }, [])

  return { tickProps: { "data-anim": anim || undefined }, tick }
}

/** The class both controls carry. One string, so the two cannot drift apart.
 *
 *  360ms. It was briefly pulled down to 130 to match the press ripple, which
 *  was a mistake of mine and not a request: the tick is a CONFIRMATION that a
 *  value changed, not the acknowledgement of a touch. It is allowed to take
 *  longer than the press it followed, and at 130 the spring had no room to
 *  read as one.
 *
 *  The start is a separate thing and stays fixed — see the branch in `tick`. */
export const TICK_CLASS = "data-[anim]:animate-[muzaTick_360ms_cubic-bezier(.22,1,.36,1)]"
