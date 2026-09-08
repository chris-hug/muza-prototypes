"use client"

import { useRef, useCallback } from "react"

/** Movement past this (px) turns the gesture into a drag: the long press is
 *  cancelled and no click is emitted on release. Matches the browser's own
 *  tap slop closely enough that deliberate taps still register. */
const SLOP = 8

/**
 * useLongPress — fires `onLongPress` after the user holds for `ms`.
 * `onClick` fires only if the press is released before that threshold
 * and the pointer didn't move significantly (treats it as a tap).
 *
 * Touch + mouse via Pointer Events. Cancels on pointermove > 8px to
 * avoid hijacking scroll gestures.
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
  const timer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered    = useRef(false)
  const startPoint   = useRef<{ x: number; y: number } | null>(null)
  // The gesture travelled far enough to be a drag, not a tap. Tracked
  // separately from the long-press timer: moving cancels the long press AND
  // must cancel the click, or a swipe along a card rail ends in navigation.
  const moved        = useRef(false)

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])

  return {
    onPointerDown: (e: React.PointerEvent) => {
      triggered.current  = false
      moved.current      = false
      startPoint.current = { x: e.clientX, y: e.clientY }
      clear()
      timer.current = setTimeout(() => {
        triggered.current = true
        onLongPress()
      }, ms)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!startPoint.current) return
      const dx = e.clientX - startPoint.current.x
      const dy = e.clientY - startPoint.current.y
      if (Math.hypot(dx, dy) > SLOP) { moved.current = true; clear() }
    },
    onPointerUp: () => {
      clear()
      // A drag is not a tap. Without this the click still fired on release,
      // so swiping a rail opened whichever card the finger started on — and
      // because this click is synthetic (pointerup, not a real `click`), the
      // browser's own "suppress click after scroll" never got a say.
      if (!triggered.current && !moved.current) onClick?.()
      startPoint.current = null
    },
    onPointerCancel: () => {
      clear()
      moved.current      = false
      startPoint.current = null
    },
  }
}
