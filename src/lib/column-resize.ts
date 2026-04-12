import * as React from "react"

/**
 * Starts a column resize drag operation.
 * Shared by TableHead (table.tsx) and the studio music flex table.
 *
 * @param e          – the mousedown event
 * @param startWidth – current width of the column in px
 * @param onResize   – called on every mousemove with the new width
 * @param minWidth   – floor for the new width (default 60px)
 */
export function startColumnResize(
  e: React.MouseEvent,
  startWidth: number,
  onResize: (newWidth: number) => void,
  minWidth = 60,
) {
  e.preventDefault()
  e.stopPropagation()

  const startX = e.clientX

  const onMove = (ev: MouseEvent) => {
    const newW = Math.max(minWidth, startWidth + (ev.clientX - startX))
    onResize(newW)
  }
  const onUp = () => {
    document.removeEventListener("mousemove", onMove)
    document.removeEventListener("mouseup",   onUp)
  }
  document.addEventListener("mousemove", onMove)
  document.addEventListener("mouseup",   onUp)
}
