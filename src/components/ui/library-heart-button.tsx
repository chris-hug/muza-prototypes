"use client"

/*
 * LibraryHeartButton — the one "add to library" heart used everywhere
 * (detail headers, player bar / overlay, song rows, cards). Reads its
 * filled / outline state straight from the user-library store by
 * `(type, id)`, toggles + toasts via `useLibraryToggle`, and plays a
 * satisfying pop + halo + ring-burst micro-animation on add.
 *
 * Styling is delegated to the shared Button so it drops into any context
 * (pass `variant` / `size` / `className`); the animation layers sit in a
 * relative wrapper around it.
 */

import { useRef, useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUserLibrary, type LibraryItemType, type SavedSong } from "@/lib/user-library"
import { useLibraryToggle } from "@/lib/use-library-toggle"

type ButtonVariant =
  "default" | "secondary" | "outline" | "outline-primary" | "ghost" | "link" | "destructive"
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"

interface LibraryHeartButtonProps {
  type: LibraryItemType
  id:   string
  /** Shown in the toast body (e.g. the track / album title). */
  name?: string
  /** For `type="song"` — metadata stored so the Songs library page can
   *  render the added row. */
  song?: SavedSong
  variant?: ButtonVariant
  size?:    ButtonSize
  className?:     string
  iconClassName?: string
  strokeWidth?:   number
  /** Stop the click from bubbling (e.g. inside a clickable row / mini-bar).
   *  Defaults to true. */
  stopPropagation?: boolean
}

export function LibraryHeartButton({
  type, id, name, song,
  variant = "ghost",
  size = "icon",
  className,
  iconClassName,
  strokeWidth = 1.5,
  stopPropagation = true,
}: LibraryHeartButtonProps) {
  const library = useUserLibrary()
  const toggle  = useLibraryToggle()
  const active  = library.inLibrary(type, id)

  // Ref counter (not state) so re-renders never restart the animation
  // mid-gesture; we bump a separate state only to remount the animated
  // nodes via `key`.
  const pulse = useRef(0)
  const [tick, setTick] = useState(0)
  const [burst, setBurst] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    const nowIn = toggle(type, id, name, song)
    pulse.current += 1
    setTick(pulse.current)
    setBurst(nowIn)   // celebratory rings only when ADDING
  }

  return (
    <span className="relative inline-flex shrink-0">
      {/* Halo + ring burst — only on add, centred on the heart. */}
      {burst && (
        <span key={`burst-${tick}`} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 animate-heart-halo" />
          <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary animate-heart-burst" />
        </span>
      )}

      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        aria-pressed={active}
        aria-label={active ? "Remove from library" : "Save to library"}
        className={cn("relative", className)}
      >
        <Heart
          key={`heart-${tick}`}
          strokeWidth={strokeWidth}
          className={cn(
            tick > 0 && "animate-heart-pop",
            active && "fill-primary-text text-primary-text",
            iconClassName,
          )}
        />
      </Button>
    </span>
  )
}
