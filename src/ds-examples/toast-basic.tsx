"use client"

/*
 * Toast — ONE toast, placed where the real viewport puts it.
 *
 * The frame used to hold all six types in a two-column grid, which made it a
 * poster rather than a demo: six toasts never appear at once, the grid was the
 * demo's own layout and not the component's, and at a narrow chip the column
 * count — not the toast — was what changed. The other types now sit under the
 * frame as a plain catalogue, where a grid is honest because it IS a
 * catalogue.
 *
 * Placement mirrors `ToastViewport` rather than approximating it:
 *
 *   phone    `inset-x-3` at the BOTTOM — a slim bar spanning the window
 *   ≥ 768    `right-4 top-4 w-[380px]` — the familiar top-right card
 *
 * `useIsMobile()` reads the frame's own window chip here (`WindowWidthContext`),
 * so picking 375 above really does move the toast to the bottom. The offsets
 * are the viewport's own, so a desktop chip shows the toast the same 16px off
 * the corner it sits at in the app.
 *
 * Rendered with `ToastPreview`, which shares `toastShellClass`, the icon map
 * and the button classes with the live viewport — the real chrome without
 * firing real toasts.
 */

import { ToastPreview } from "@/components/ui/toast"
import { useIsMobile } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"

export default function ToastBasicExample() {
  const isMobile = useIsMobile()
  return (
    <div
      className={cn(
        "flex min-h-40",
        isMobile
          ? "items-end px-3 pb-3"
          : "items-start justify-end p-4",
      )}
    >
      <ToastPreview
        type="success"
        title="Saved to Library"
        description="Blue Afternoon · Song"
        actionLabel="Undo"
      />
    </div>
  )
}
