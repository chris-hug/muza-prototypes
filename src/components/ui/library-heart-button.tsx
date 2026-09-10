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

import { useEffect, useRef, useState } from "react"
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

  /* Driven by the library STATE, not by this button's own click.
   *
   * It used to bump a counter inside `handleClick`, which meant the heart only
   * answered when you pressed the heart. Saving the same song from the row's
   * ⋯ menu changed the state, filled this heart in — and did not move it, so
   * the one element that shows the result stayed silent while the menu that
   * caused it was already gone. Watching the value covers every route: this
   * button, the menu, the touch sheet, another surface holding the same item.
   *
   * The guard compares the PREVIOUS value rather than holding a "first render"
   * flag: StrictMode invokes effects twice in development, so a flag is spent
   * on the second run and every already-saved heart popped on mount.
   *
   * `tick` only exists to remount the animated nodes via `key` — re-running a
   * CSS animation needs a new element, not a re-render. */
  const [tick, setTick] = useState(0)
  const [burst, setBurst] = useState(false)
  const prev = useRef(active)

  useEffect(() => {
    if (prev.current === active) return
    prev.current = active
    setTick(t => t + 1)
    setBurst(active)   // celebratory rings only when ADDING
  }, [active])

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    toggle(type, id, name, song)
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

/*
 * MenuHeart — the library heart as it appears INSIDE a menu row or an action
 * sheet, where the row owns the click and the icon is only handed down as a
 * node. So it does not listen for a press: it watches the saved STATE and pops
 * when that flips, which covers every way the value can change (the row, the
 * keyboard, another surface toggling the same item).
 *
 * The first render never animates — a menu opening on an already-saved album
 * should not celebrate something the user did last week. That guard compares
 * the PREVIOUS value rather than holding a "have I run yet" flag: StrictMode
 * invokes effects twice in development, so a flag is already spent on the
 * second run and the heart popped the moment the menu opened.
 *
 * `animate-heart-pop-quick` rather than the full pop, because a menu row that
 * does not `keepOpen` is unmounted 256ms after the click and the long version
 * peaks at 231ms; see the class comment in app.css.
 */
export function MenuHeart({ filled, className }: { filled: boolean; className?: string }) {
  const [tick, setTick] = useState(0)
  const prev = useRef(filled)
  useEffect(() => {
    if (prev.current === filled) return
    prev.current = filled
    setTick(t => t + 1)
  }, [filled])

  return (
    <Heart
      key={`menu-heart-${tick}`}
      className={cn(tick > 0 && "animate-heart-pop-quick", filled && "fill-current", className)}
    />
  )
}
