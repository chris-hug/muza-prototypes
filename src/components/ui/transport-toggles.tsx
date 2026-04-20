"use client"

/*
 * Shared Shuffle / Repeat pill toggles. Used across both player bars and
 * the full-screen overlay so the controls look and behave identically
 * everywhere.
 *
 * Both render the same pill shape (`Button variant="ghost"` with explicit
 * w/h via inline style) so callers can size them to fit their surrounding
 * layout. Only Shuffle is animated (per the Shuffle-emphasis decision):
 *   · icon `animate-shuffle-pop` on toggle-on,
 *   · `animate-shuffle-halo` ring pulsing outward from the button.
 * Repeat is deliberately plain — the asymmetry teaches which control the
 * product cares about most.
 *
 * Keyframes live in `app/app.css`.
 */

import { useRef } from "react"
import { Shuffle, Repeat2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ToggleBaseProps {
  active:    boolean
  onToggle:  () => void
  w:         number
  h:         number
  iconSize:  number
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────
// ShuffleToggle — animated; primary emphasis control.
// ─────────────────────────────────────────────────────────────────────────
export function ShuffleToggle({
  active, onToggle,
  w, h, iconSize,
  className,
}: ToggleBaseProps) {
  // Ref (not state) so re-renders don't fight the user's click.
  const pulseCount = useRef(0)

  const handleClick = () => {
    if (!active) pulseCount.current += 1
    onToggle()
  }

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: w, height: h }}>
      {active && (
        <span
          key={pulseCount.current}
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none bg-primary animate-shuffle-halo"
        />
      )}
      <Button
        variant="ghost"
        aria-label="Shuffle"
        aria-pressed={active}
        onClick={handleClick}
        className={cn(
          "p-0 relative transition-colors",
          active && "bg-primary hover:bg-primary-hover active:bg-primary-hover",
        )}
        style={{ width: w, height: h }}
      >
        <Shuffle
          key={pulseCount.current}
          strokeWidth={1.75}
          className={cn(active && "text-primary-foreground animate-shuffle-pop")}
          style={{ width: iconSize, height: iconSize }}
        />
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// RepeatToggle — same pill geometry, no animation. Secondary control.
// ─────────────────────────────────────────────────────────────────────────
export function RepeatToggle({
  active, onToggle,
  w, h, iconSize,
  className,
}: ToggleBaseProps) {
  return (
    <Button
      variant="ghost"
      aria-label="Repeat"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        "p-0 transition-colors",
        active && "bg-primary hover:bg-primary-hover active:bg-primary-hover",
        className,
      )}
      style={{ width: w, height: h }}
    >
      <Repeat2
        strokeWidth={1.5}
        className={cn("transition-colors", active && "text-primary-foreground")}
        style={{ width: iconSize, height: iconSize }}
      />
    </Button>
  )
}
