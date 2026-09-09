"use client"

/*
 * Stepper — where you are in a multi-step flow, and how much is left.
 *
 * It is a PROGRESS indicator that happens to be navigable, not a tab bar: the
 * steps run in a fixed order, and a step you have not reached yet is not a
 * place you can go. Visited steps are buttons; the current step and everything
 * ahead of it are plain text.
 *
 * It owns its row. The upload wizard used to centre its stepper absolutely
 * across a header that also held Cancel / Next on the right, so the stepper
 * was centred on the whole header rather than on the space left over — and
 * the two collided by arithmetic, not by accident:
 *
 *   stepper right = left + w/2 + 300      (600px wide, centred)
 *   buttons left  = left + w − 244        (220px of buttons + 24px inset)
 *   overlap when    w/2 + 300 > w − 244   →   w < 1088
 *
 * At a 1088px header they touch; below it the labels run under the buttons.
 * With a 208px sidebar that is a 1296px window — an ordinary laptop. Giving
 * the stepper its own row is what makes the centring real, and it is why the
 * actions moved to a footer (see DESIGN_SYSTEM.md › Wizard).
 */

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperProps extends Omit<React.ComponentProps<"ol">, "onSelect"> {
  /** Step labels, in order. Keep them to one or two words — they sit side by
   *  side, so a long one costs every other step its width. */
  steps: readonly string[]
  /** The active step, 1-based. */
  current: number
  /** Makes VISITED steps clickable. Without it the stepper is read-only —
   *  which is the right default for a flow that validates as it goes. */
  onStepSelect?: (step: number) => void
  /** Caps how wide the track runs before the connectors stop stretching.
   *  Default 600px, centred in whatever row it is given. */
  maxWidth?: number
}

function Stepper({ steps, current, onStepSelect, maxWidth = 600, className, ...props }: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      className={cn("mx-auto flex w-full items-start", className)}
      style={{ maxWidth }}
      {...props}
    >
      {steps.map((label, i) => {
        const num      = i + 1
        const done     = current > num
        const active   = current === num
        // A step ahead of you is not somewhere you can go: the flow validates
        // as it goes, so jumping forward would skip the check that gates it.
        const clickable = !!onStepSelect && done

        return (
          <li key={label} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                // `aria-current` is what tells a screen reader which step is
                // live; the visual state alone says nothing.
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${num} of ${steps.length}: ${label}`}
                disabled={!clickable}
                onClick={clickable ? () => onStepSelect(num) : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  clickable ? "cursor-pointer group/step" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xsmall font-normal transition-colors",
                    done || active
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground",
                    clickable && "group-hover/step:bg-foreground/80",
                  )}
                >
                  {done ? <Check className="size-3" /> : num}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-center text-small font-normal leading-tight transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                    clickable && "group-hover/step:text-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
            </div>
            {/* The rule between two steps. `mt-3` puts it on the circles'
                centre line (half of size-6), and it is `aria-hidden` because
                it is punctuation — the order is already in the list. */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-3 mx-2 h-px w-8 shrink-0 transition-colors",
                  done ? "bg-foreground/40" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
