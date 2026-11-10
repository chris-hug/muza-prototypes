"use client"

/*
 * IconSwap — one icon becoming another, instead of being replaced by it.
 *
 * Every control fades its own fill and colour, then the icon inside it used
 * to snap: written as `a ? <X /> : <Y />`, the old icon unmounts before the
 * new one exists, so there is nothing to transition between. Here BOTH stay
 * mounted, stacked in one grid cell, and cross-fade on three properties at
 * once (app.css › `[data-slot="icon-swap"]`):
 *
 *   scale    0.25 → 1
 *   opacity  0    → 1
 *   blur     4px  → 0
 *
 * The blur is what makes it read as one mark turning into another rather than
 * two marks dissolving. Keeping both mounted is what makes it interruptible: a
 * toggle hit twice reverses mid-flight instead of queueing. Under
 * `prefers-reduced-motion` it is a plain swap.
 *
 * Not for Select Track: there the plus does not fade into a check, it BECOMES
 * one, two strokes that rotate and rescale. That stronger effect stays its own.
 */

import * as React from "react"

export function IconSwap({ on, onIcon, offIcon }: {
  /** Which icon shows. */
  on: boolean
  /** Shown while `on`. */
  onIcon: React.ReactNode
  /** Shown while not `on`. */
  offIcon: React.ReactNode
}) {
  return (
    <span data-slot="icon-swap" className="inline-grid shrink-0 place-items-center">
      <span data-state={on ? "in" : "out"} aria-hidden={!on || undefined}>{onIcon}</span>
      <span data-state={on ? "out" : "in"} aria-hidden={on || undefined}>{offIcon}</span>
    </span>
  )
}
