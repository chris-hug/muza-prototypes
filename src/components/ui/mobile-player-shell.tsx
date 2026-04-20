"use client"

/*
 * MobilePlayerShell — composes the mini PlayerBar (pinned to the bottom)
 * with the full-screen PlayerOverlay. Tapping the mini bar slides the
 * overlay up from the bottom; tapping the drag handle (or anywhere that
 * triggers `onClose`) slides it back down.
 *
 * Intended to live inside any fixed-viewport mobile container (e.g. the
 * iPhone frames in the kitchen sink, or the real app shell on a phone).
 * The parent decides the overall footprint; this component just fills it.
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlayerBar } from "@/components/ui/player-bar"
import { PlayerOverlay } from "@/components/ui/player-overlay"

interface MobilePlayerShellProps {
  className?: string
}

export function MobilePlayerShell({ className }: MobilePlayerShellProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      {/* Mini player — pinned to the bottom with a small inset so it
           doesn't touch the device edges. */}
      <div className="absolute inset-x-3 bottom-3">
        <PlayerBar onExpand={() => setOpen(true)} />
      </div>

      {/* Full-screen overlay — translated fully below the viewport when
           closed and slid up to `translate-y-0` when open. `pointer-events-
           none` while closed so the mini bar underneath stays tappable. */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <PlayerOverlay onClose={() => setOpen(false)} />
      </div>
    </div>
  )
}
