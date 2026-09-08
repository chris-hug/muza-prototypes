"use client"

/*
 * SelectTrackButton — the pick/unpick affordance on a selectable track row.
 *
 * A checkbox states a fact ("ticked"); this states the action ("add") and then
 * confirms it. The mark is not two icons cross-fading — it's ONE plus whose two
 * strokes rotate and rescale into a checkmark, so the confirmation is the same
 * ink rearranging itself:
 *
 *   vertical bar   −90°  →  −45°                 (the check's long arm)
 *   horizontal bar  180° →   45° + scaleX(0.43)  (the short arm)
 *
 * Timing is deliberately asymmetric, after the reference:
 *   · becoming a check — 150ms ease-out, no delay: the reply is immediate.
 *   · back to a plus   — 300ms on an overshoot curve after a 150ms hold, so
 *     undoing reads as a spring rather than a second confirmation.
 *
 * The secondary surface is the AFFORDANCE — it says "tappable". Once the track
 * is in, it fades out and leaves the bare check, so a picked list reads as a
 * column of marks rather than a stack of filled pills.
 *
 * The whole ROW is the click target (`MediaListItem.onOpen`), so this is
 * `pointer-events-none` and unfocusable — a display affordance, not a control.
 *
 * Reference: codepen.io/nicetransition/pen/bGdJzpZ
 */

import { cn } from "@/lib/utils"

/** Bar geometry, in px — proportions taken from the reference (thickness and
 *  the diagonal offset are both ratios of the bar's length). */
const LEN = 12
const OFF = 1.2   // 0.1 × LEN — how far each arm shifts to meet at the vertex
/** Stroke weight. Lighter than the 2px Lucide set on purpose: at this size a
 *  2px bar reads as a chunky glyph, 1.25px as a drawn mark. */
const W = 1.25

export function SelectTrackButton({ selected, className }: {
  selected: boolean
  className?: string
}) {
  // The arms sit in a LEN-wide box centred in the surface; each is absolutely
  // positioned so rotation happens about the shared centre.
  const bar = "absolute left-0 right-0 rounded-full bg-current"
  // Centred by half its own weight, so a sub-pixel stroke still sits true.
  const barBox = { height: W, top: `calc(50% - ${W / 2}px)` }
  // Same 150ms hold in both directions, so picking and un-picking have the
  // same rhythm — the reference delays only the return, which made adding
  // feel snappier than removing.
  const timing = selected
    ? "transition-transform duration-150 ease-out [transition-delay:150ms]"
    : "transition-transform duration-300 [transition-timing-function:cubic-bezier(.75,-0.6,.14,1.59)] [transition-delay:150ms]"

  return (
    <span
      aria-hidden="true"
      data-selected={selected || undefined}
      className={cn(
        // Secondary surface, no border — the icon carries the state, not chrome.
        // Once picked, the surface drops away entirely and only the check is
        // left: a filled pill per row is heavy down a long list, and the
        // affordance has done its job by then. It fades fast (120ms) so the
        // mark is what you watch, not the plate it sat on.
        "pointer-events-none relative grid size-10 shrink-0 place-items-center rounded-full",
        "transition-colors duration-150 ease-out",
        selected ? "bg-transparent text-primary-text" : "bg-secondary text-foreground",
        className,
      )}
    >
      <span className="relative block" style={{ width: LEN, height: LEN }}>
        {/* Vertical stroke → the check's long arm. */}
        <span
          className={cn(bar, timing)}
          style={{
            ...barBox,
            transform: selected
              ? `translate(calc(25% - ${OFF}px), ${-OFF}px) rotate(-45deg)`
              : "rotate(-90deg)",
          }}
        />
        {/* Horizontal stroke → the short arm, shortened as it swings. */}
        <span
          className={cn(bar, timing)}
          style={{
            ...barBox,
            transform: selected
              ? `translate(-25%, ${OFF}px) rotate(45deg) scaleX(.43)`
              : "rotate(180deg)",
          }}
        />
      </span>
    </span>
  )
}
