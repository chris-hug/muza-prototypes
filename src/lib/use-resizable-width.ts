"use client"

/*
 * useResizableWidth — drag-to-resize for a docked panel.
 *
 * Returns a ref to put on the panel, the current width (null = use the CSS
 * default), a pointer-down handler for the drag handle, and whether a drag is
 * in progress (callers disable their width transition while it is, so the
 * panel tracks the pointer).
 *
 * While dragging, the width is written STRAIGHT to the element's inline style
 * inside a rAF — not through React state. A panel holds a whole editor, and
 * re-rendering that subtree on every pointermove is what makes a resize feel
 * gritty. React only hears about the width twice per drag (start and end), so
 * the frames in between are pure style + layout.
 *
 * The chosen width is remembered in localStorage, like the other layout
 * preferences.
 */

import { useCallback, useEffect, useRef, useState } from "react"

export interface ResizableWidthOptions {
  /** localStorage key the width is remembered under. */
  storageKey: string
  min: number
  max: number
  /** Never exceed this share of the viewport (0–1). Keeps content usable. */
  maxViewportShare?: number
  /** Which edge carries the handle — decides the drag direction. */
  edge?: "left" | "right"
}

export function useResizableWidth({
  storageKey, min, max, maxViewportShare = 0.6, edge = "left",
}: ResizableWidthOptions) {
  const ref = useRef<HTMLElement>(null)
  const [width, setWidth] = useState<number | null>(() => {
    if (typeof window === "undefined") return null
    const stored = Number(window.localStorage.getItem(storageKey))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  })
  const [resizing, setResizing] = useState(false)
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined" ? Infinity : window.innerWidth)

  // A width stored on a wide screen must not crush the content on a narrow
  // one, so the ceiling is re-applied to the CURRENT viewport — on restore and
  // whenever the window resizes.
  // Only while a custom width is in play — otherwise this would re-render the
  // panel (and its host tree) on every pixel of a window resize for nothing.
  const tracksViewport = width != null
  useEffect(() => {
    if (!tracksViewport) return
    let frame = 0
    const onResize = () => {
      if (frame) return
      frame = requestAnimationFrame(() => { frame = 0; setViewport(window.innerWidth) })
    }
    window.addEventListener("resize", onResize)
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener("resize", onResize) }
  }, [tracksViewport])

  const clamp = useCallback((raw: number) =>
    Math.min(Math.max(raw, min), Math.min(max, window.innerWidth * maxViewportShare)),
  [min, max, maxViewportShare])

  const ceiling = Math.min(max, viewport * maxViewportShare)
  const effective = width == null ? null : Math.min(Math.max(width, min), ceiling)

  useEffect(() => {
    if (width == null) return
    try { window.localStorage.setItem(storageKey, String(width)) } catch { /* private mode */ }
  }, [width, storageKey])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    e.preventDefault()
    const handle = e.currentTarget as HTMLElement
    handle.setPointerCapture(e.pointerId)

    // Commit the width the panel happens to have right now: until the caller
    // knows a custom width is in play it keeps its default min/max classes,
    // and those would fight the inline width for the whole first drag.
    let next = clamp(el.getBoundingClientRect().width)
    setWidth(next)
    setResizing(true)
    // A drag across text would otherwise select it, and the I-beam cursor
    // flickering over the content reads as jitter.
    document.body.classList.add("select-none", "cursor-col-resize")

    let frame = 0
    const paint = () => {
      frame = 0
      if (ref.current) ref.current.style.width = `${next}px`
    }
    const onMove = (ev: PointerEvent) => {
      next = clamp(edge === "left"
        ? window.innerWidth - ev.clientX   // panel docked right, handle on its left
        : ev.clientX)
      // One write per frame — pointermove can fire several times per frame.
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const onUp = () => {
      if (frame) cancelAnimationFrame(frame)
      handle.releasePointerCapture(e.pointerId)
      document.body.classList.remove("select-none", "cursor-col-resize")
      // Hand the final width back to React, which re-applies it via `style`.
      setWidth(next)
      setViewport(window.innerWidth)
      setResizing(false)
      handle.removeEventListener("pointermove", onMove)
      handle.removeEventListener("pointerup", onUp)
      handle.removeEventListener("pointercancel", onUp)
    }
    // Bound to the handle, not the window: pointer capture routes every move
    // here even when the pointer outruns the element.
    handle.addEventListener("pointermove", onMove)
    handle.addEventListener("pointerup", onUp)
    handle.addEventListener("pointercancel", onUp)
  }, [edge, clamp])

  /** Back to the CSS default width. */
  const reset = useCallback(() => {
    if (ref.current) ref.current.style.width = ""
    setWidth(null)
  }, [])

  return { ref, width: effective, resizing, onPointerDown, reset }
}
