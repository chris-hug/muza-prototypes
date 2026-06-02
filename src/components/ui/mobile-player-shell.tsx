"use client"

/*
 * MobilePlayerShell — composes the full mobile playback chrome exactly as
 * it appears in the live app shell:
 *
 *   · the FooterNav tab bar pinned to the bottom,
 *   · the mini PlayerBar (variant B — the one wired into the app) resting
 *     flush on top of the footer, and
 *   · the full-screen PlayerOverlay that slides up when the mini bar is
 *     tapped (and back down via the drag handle / `onClose`).
 *
 * Intended to live inside any fixed-viewport mobile container (e.g. the
 * iPhone frames in the design system, or the real app shell on a phone).
 * The parent decides the overall footprint; this component just fills it.
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlayerBarB } from "@/components/ui/player-bar-b"
import { PlayerOverlay } from "@/components/ui/player-overlay"
import { FooterNav } from "@/components/app/footer-nav"

interface MobilePlayerShellProps {
  className?: string
  /** Whether the full-screen overlay starts expanded. Defaults to false
   *  so the resting state (mini bar + footer nav) is what shows first —
   *  tap the mini bar to slide the overlay up. */
  defaultOpen?: boolean
}

export function MobilePlayerShell({ className, defaultOpen = false }: MobilePlayerShellProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [tab, setTab]   = useState("Library")

  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      {/* Footer tab bar — pinned to the bottom, same as the live shell. */}
      <FooterNav activeNav={tab} onNavChange={setTab} />

      {/* Mini player — rests flush on top of the footer (0 gap), mirroring
           AppPlayer: bottom = footer height (pt-2 8px + h-12 48px + pb
           safe-area). `z-40` keeps it above the footer (z-30). */}
      <div className="absolute inset-x-3 bottom-[calc(56px+max(10px,env(safe-area-inset-bottom)))] z-40">
        <PlayerBarB onExpand={() => setOpen(true)} />
      </div>

      {/* Full-screen overlay — slid up when open, hidden when closed.
           CRITICAL: it must be `invisible` (not just translated) when
           closed — the overlay's `.frosted-glass` backdrop-filter ignores
           this container's `translate` transform and would otherwise paint
           a full-screen glass over the footer + mini-bar, hiding the footer
           and swallowing taps. The `visibility` transition keeps it visible
           through the slide-out so the animation still plays. `z-50` clears
           both the mini bar and the footer. */}
      <div
        className={cn(
          "absolute inset-0 z-50 transition-[transform,visibility] duration-300 ease-out",
          open ? "translate-y-0 visible" : "translate-y-full invisible pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <PlayerOverlay onClose={() => setOpen(false)} />
      </div>
    </div>
  )
}
