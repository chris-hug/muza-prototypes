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

  const tick = React.useCallback(() => {
    setAnim(false)
    /* Two frames, and they are not superstition: removing and re-adding the
       attribute inside one paint does not restart a CSS animation, so the
       second tick in a row would simply not move. */
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAnim(false), HOLD)
  }, [])

  return { tickProps: { "data-anim": anim || undefined }, tick }
}

/** The class both controls carry. One string, so the two cannot drift apart. */
export const TICK_CLASS = "data-[anim]:animate-[muzaTick_360ms_cubic-bezier(.22,1,.36,1)]"
