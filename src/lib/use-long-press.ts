"use client"

import { useRef, useCallback, useState } from "react"

/** Movement past this (px) turns the gesture into a drag: the long press is
 *  cancelled. The CLICK is left to the browser, which applies its own, more
 *  informed rule (see below). */
const SLOP = 8

/**
 * useLongPress — fires `onLongPress` after the user holds for `ms`, and
 * `onClick` on an ordinary tap/click.
 *
 * The click is a REAL `click` event, deliberately not synthesised from
 * `pointerup`. The browser already knows things we don't: whether the touch
 * turned into a scroll, whether the page was still gliding, whether the
 * finger left the element. It withholds the click in all of those cases. A
 * hand-rolled pointerup click throws that away — a light upward flick to
 * scroll a page of large covers would open one instead, because from the
 * element's point of view the finger went down and came up.
 *
 * So the only thing this hook has to do for the click is get OUT of the way,
 * and suppress the one case the browser can't know about: the click that
 * follows a completed long press.
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
      if (Math.hypot(dx, dy) > SLOP) clear()
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
      // the browser sends afterwards so the press doesn't ALSO navigate.
      if (triggered.current) {
        triggered.current = false
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.()
    },
  }
}
