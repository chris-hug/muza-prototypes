"use client"

/*
 * TopProgressBar — thin 2px bar pinned to the top edge that appears
 * only when a load exceeds a threshold (default 200ms), grows
 * non-linearly toward ~85%, then snaps to 100% and fades out when
 * the load completes. NProgress-style — never grabs focus, never
 * implies the app is broken.
 *
 * Use it for nav / fetch waits that are real but short (>200ms,
 * <3s). For longer / contextual waits use the `Spinner` instead.
 *
 * Controlled by a single `loading` prop. Parent flips it true while
 * a fetch / nav is in flight; the bar handles the visual timing
 * (delay-in, growth curve, finish-snap, fade-out) internally.
 */

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface TopProgressBarProps {
  /** Flip true while a load is in flight; flip false on completion.
   *  The bar handles the rest of the timing itself. */
  loading: boolean
  /** Show-after threshold in ms — loads that complete faster than
   *  this stay invisible. Default 200ms. */
  delay?: number
  className?: string
}

export function TopProgressBar({ loading, delay = 200, className }: TopProgressBarProps) {
  // Three internal states drive the visual:
  //   visible — should the bar be on screen at all?
  //   progress — width % (0–100)
  //   finishing — true during the snap-to-100 + fade-out tail
  const [visible, setVisible]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [finishing, setFinishing] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (loading) {
      // After the delay, become visible and start the slow climb.
      // The climb is asymptotic — increments shrink each step so we
      // never hit 100% on our own (only `loading=false` does).
      const showId = window.setTimeout(() => {
        setVisible(true)
        setFinishing(false)
        setProgress(15)
        const climb = window.setInterval(() => {
          setProgress(p => p + (90 - p) * 0.08)
        }, 200)
        timers.current.push(climb as unknown as number)
      }, delay)
      timers.current.push(showId)
    } else if (visible) {
      // Finish: snap to 100, hold briefly, then fade out + reset.
      setFinishing(true)
      setProgress(100)
      const hideId = window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
        setFinishing(false)
      }, 300)
      timers.current.push(hideId)
    }

    return () => {
      timers.current.forEach(t => {
        clearTimeout(t)
        clearInterval(t)
      })
    }
    // visible deliberately excluded — including it would restart the
    // climb-interval on each setProgress tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, delay])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-foreground transition-[width,opacity] ease-out",
          finishing ? "duration-150 opacity-0" : "duration-300 opacity-100",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
