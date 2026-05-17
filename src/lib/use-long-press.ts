"use client"

import { useRef, useCallback } from "react"

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

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])

  return {
    onPointerDown: (e: React.PointerEvent) => {
      triggered.current  = false
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
      if (Math.hypot(dx, dy) > 8) clear()
    },
    onPointerUp: () => {
      clear()
      if (!triggered.current) onClick?.()
      startPoint.current = null
    },
    onPointerCancel: () => {
      clear()
      startPoint.current = null
    },
  }
}
