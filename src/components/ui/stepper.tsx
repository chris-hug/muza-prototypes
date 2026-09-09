"use client"

/*
 * Stepper — where you are in a multi-step flow, and how much is left.
 *
 * It is a PROGRESS indicator that happens to be navigable, not a tab bar: the
 * steps run in a fixed order, and a step you have not reached yet is not a
 * place you can go. Visited steps are buttons; everything else is text.
 *
 * ── The connector belongs to the STEP, not between the labels ──────────────
 *
 * The first build made each step `flex-1` and put a fixed 32px rule NEXT TO
 * the label column, in the flow. Two things went wrong, and they compounded:
 * the rule landed between the two labels rather than between the two circles,
 * and the last step — having no rule — gave its label column 32px more room
 * than every other. Equal steps with unequal columns: the circles drifted off
 * centre and the rules looked scattered at arbitrary heights.
 *
 * Both MUI and Chakra anchor the connector to the indicator instead — MUI as
 * a `::after` pseudo-element of the Step, Chakra as a `StepSeparator` inside
 * it. Same idea here: the rule is ABSOLUTE inside its own step, spanning from
 * the previous circle's centre (`-left-1/2`, one step-width back) to this
 * one's (`right-1/2`), pinned to the circle's centre line. Out of flow, so
 * every column is exactly `1fr` and the circles sit where they belong.
 *
 * That is also what lets labels truncate instead of forcing the row wider.
 */

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/** A step is a label, or a label with a line of detail under it. */
export type StepperStep = string | { label: string; description?: string }

export interface StepperProps extends Omit<React.ComponentProps<"ol">, "onSelect"> {
  /** Steps in order. Keep labels to one or two words — every step gets the
   *  same `1fr`, so a long one truncates rather than stealing the row. */
  steps: readonly StepperStep[]
  /** The active step, 1-based. */
  current: number
  /** Makes VISITED steps clickable. Without it the stepper is read-only —
   *  the right default for a flow that validates as it goes. */
  onStepSelect?: (step: number) => void
  /** Caps how wide the track runs. Centred in whatever row it is given. */
  maxWidth?: number
}

function normalise(step: StepperStep) {
  return typeof step === "string" ? { label: step, description: undefined } : step
}

function Stepper({ steps, current, onStepSelect, maxWidth = 600, className, ...props }: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      className={cn("mx-auto flex w-full items-start", className)}
      style={{ maxWidth }}
      {...props}
    >
      {steps.map((step, i) => {
        const { label, description } = normalise(step)
        const num    = i + 1
        const done   = current > num
        const active = current === num
        // A step ahead of you is not somewhere you can go: the flow validates
        // as it goes, so jumping forward would skip the check that gates it.
        const clickable = !!onStepSelect && done
        // Non-interactive steps are NOT disabled buttons — they are text. A
        // disabled button is still announced as a control that refuses you.
        const Tag = clickable ? "button" : "span"

        return (
          <li
            key={label}
            data-state={done ? "done" : active ? "active" : "ahead"}
            className="relative flex min-w-0 flex-1 flex-col items-center"
          >
            {/* The rule to the previous step. Spans centre to centre — one
                step-width back to this one's middle — inset by 28px at each
                end (16px of circle + a 12px gap). `top-4` is half of `size-8`,
                so it sits on the circles' centre line whatever the label does.
                `aria-hidden` because it is punctuation: the order is already
                carried by the list. */}
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute -left-1/2 right-1/2 top-4 mx-7 h-px -translate-y-1/2 transition-colors",
                  // 1px is the floor: `h-[0.5px]` renders as nothing at 1x DPR
                  // in some engines, so a lighter rule is a lighter COLOUR,
                  // not a smaller height.
                  done || active ? "bg-foreground/25" : "bg-border/70",
                )}
              />
            )}

            <Tag
              {...(clickable
                ? {
                    type: "button" as const,
                    onClick: () => onStepSelect(num),
                    // Only the BUTTON gets a label. On a plain `<span>` an
                    // `aria-label` is either ignored or, worse, replaces the
                    // text — and the position is already announced: this is an
                    // `<ol>`, so the row reads as "2 of 4" on its own.
                    "aria-label": `Step ${num} of ${steps.length}: ${label}`,
                  }
                : {})}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full min-w-0 flex-col items-center gap-1.5 rounded-lg px-1 outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                clickable && "group/step cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "relative flex size-8 shrink-0 items-center justify-center rounded-full text-xsmall font-normal transition-colors",
                  done || active
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground",
                  clickable && "group-hover/step:bg-foreground/80",
                )}
              >
                {done ? <Check className="size-4" /> : num}
              </span>

              <span className="flex w-full min-w-0 flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "w-full truncate text-center text-small font-normal leading-tight transition-colors",
                    // A step you have finished is not the same as one you have
                    // not reached: `done` keeps full contrast, `ahead` recedes.
                    active || done ? "text-foreground" : "text-muted-foreground",
                    clickable && "group-hover/step:underline group-hover/step:underline-offset-[3px]",
                  )}
                >
                  {label}
                </span>
                {description && (
                  <span className="w-full truncate text-center text-2xsmall font-normal leading-tight text-muted-foreground">
                    {description}
                  </span>
                )}
              </span>
            </Tag>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
