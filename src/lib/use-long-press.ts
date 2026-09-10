"use client"

import { useRef, useCallback, useState } from "react"

/** Movement past this (px) turns the gesture into a drag: the long press is
 *  cancelled AND the click that follows is swallowed. */
const SLOP = 8

/**
 * useLongPress — fires `onLongPress` after the user holds for `ms`, and
 * `onClick` on an ordinary tap/click.
 *
 * The click is a REAL `click` event, deliberately not synthesised from
 * `pointerup`. The browser already knows things we don't: whether the touch
 * turned into a scroll, whether the page was still gliding, whether the
 * finger left the element. It withholds the click in all of those cases. A
 * hand-rolled pointerup click throws that away.
 *
 * But the browser's rule is not enough on its own, and this is what made the
 * cards feel trigger-happy: a SHORT drag — the beginning of a rail swipe, a
 * flick that the scroller decides not to follow — is not a scroll as far as
 * the browser is concerned, so the click still lands and the card opens the
 * album the user was trying to swipe past. Every second attempt, in practice,
 * because it depends on how far the finger got.
 *
 * So the hook adds its own rule ON TOP of the browser's: a pointer that moved
 * more than `SLOP` between down and up does not click, whatever the browser
 * thinks. That is the same threshold that cancels the long press, so one
 * gesture cannot be both. It suppresses the click after a completed long press
 * for the same reason.
 *
 * It also reports the hold as it happens. The returned props carry
 * `data-pressing` while the finger is down, which `app.css` turns into 98%
 * and a slight darkening — so the wait reads as the card being TAKEN rather
 * than as a tap that has not registered. Let go early and it springs back,
 * having done nothing.
 *
 * Touch + mouse via Pointer Events.
 */
export function useLongPress({
  onLongPress,
  onClick,
  ms = 500,
}: {
  onLongPress: () => void
  onClick?:    () => void
  ms?:         number
}) {
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered  = useRef(false)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const moved      = useRef(false)
  const [pressing, setPressing] = useState(false)

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setPressing(false)
  }, [])

  return {
    // Spread onto the element: the attribute is part of the gesture, not
    // something every call site has to remember to wire up.
    "data-pressing": pressing || undefined,
    onPointerDown: (e: React.PointerEvent) => {
      triggered.current  = false
      moved.current      = false
      startPoint.current = { x: e.clientX, y: e.clientY }
      clear()
      // Only touch shows the hold: a mouse has hover, and the menu it would
      // open is already a click away on the card's own controls.
      if (e.pointerType !== "mouse") setPressing(true)
      timer.current = setTimeout(() => {
        triggered.current = true
        setPressing(false)
        onLongPress()
      }, ms)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!startPoint.current) return
      const dx = e.clientX - startPoint.current.x
      const dy = e.clientY - startPoint.current.y
      if (Math.hypot(dx, dy) > SLOP) {
        moved.current = true
        clear()
      }
    },
    onPointerUp: () => {
      clear()
      startPoint.current = null
    },
    onPointerCancel: () => {
      clear()
      startPoint.current = null
    },
    // iOS answers a long press on an image with its OWN menu (Share / Save to
    // Photos / Copy Subject), which arrives on top of ours and wins the
    // gesture. The callout is suppressed in CSS (`img` in `app.css`, because
    // it has to be in force before the finger lands); this covers the
    // right-click that a desktop browser sends for the same gesture.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: (e: React.MouseEvent) => {
      // The long press already acted (it opened the menu) — swallow the click
      // the browser sends afterwards so the press doesn't ALSO navigate. Same
      // for a click that arrives at the end of a DRAG: the finger was going
      // somewhere, and the card is not it.
      if (triggered.current || moved.current) {
        triggered.current = false
        moved.current = false
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.()
    },
  }
}
