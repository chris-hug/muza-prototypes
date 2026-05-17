"use client"

/*
 * QtyStepper — minus / count / plus, sized to match Input + SelectTrigger.
 *
 * Built on base-ui's NumberField primitive, which gives us for free:
 *   - keyboard support (↑/↓/PgUp/PgDn/Home/End, with smallStep/largeStep)
 *   - mouse-wheel + scrub gestures
 *   - text-entry through the inner input (clamped to min/max)
 *   - automatic disabled states for the increment/decrement buttons at
 *     boundaries (no need to recompute "atMin/atMax" by hand)
 *   - locale-aware number formatting via `Intl.NumberFormat`
 *   - integration with base-ui Field validation when nested under Field.Root
 *
 * Sizes:
 *   - default → h-10 (40px), aligned with Input
 *   - sm      → h-8  (32px), aligned with sm SelectTrigger / sm Button
 *
 * The `value` lives in the underlying input as a number; we expose a
 * controlled `(value, onChange)` API in the same shape callers had before
 * the refactor, so consumers don't need to learn a new pattern.
 */

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { NumberField } from "@base-ui/react/number-field"
import { cn } from "@/lib/utils"

export interface QtyStepperProps {
  value:    number
  onChange: (next: number) => void
  min?:     number
  max?:     number
  /** Step size. Defaults to 1 (integer-only stepping). */
  step?:    number
  disabled?: boolean
  size?:    "sm" | "default"
  /** When true, fills the parent width and spreads −/value/+ across it.
   *  Use inside grid cells where the stepper should match neighbours. */
  block?:   boolean
  className?: string
  /** Suffix used to build aria-labels for the plus/minus buttons —
   *  "Decrease quantity for Sun Ra T-shirt" / "Increase …". */
  ariaLabel?: string
}

const SIZE = {
  default: { wrap: "h-10", btn: "size-8", icon: "size-3.5", input: "min-w-[20px]" },
  sm:      { wrap: "h-8",  btn: "size-6", icon: "size-3",   input: "min-w-[16px]" },
} as const

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  size = "default",
  block = false,
  className,
  ariaLabel,
}: QtyStepperProps) {
  const s = SIZE[size]
  const labelDec = ariaLabel ? `Decrease ${ariaLabel}` : "Decrease quantity"
  const labelInc = ariaLabel ? `Increase ${ariaLabel}` : "Increase quantity"

  return (
    <NumberField.Root
      value={value}
      onValueChange={(next) => onChange(next ?? min)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(block ? "w-full" : "shrink-0", className)}
    >
      <NumberField.Group
        className={cn(
          "flex items-center gap-0.5 border border-border rounded-full px-1",
          s.wrap,
          block && "w-full justify-between",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <NumberField.Decrement
          aria-label={labelDec}
          className={cn(
            "flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors",
            s.btn,
          )}
        >
          <Minus className={s.icon} />
        </NumberField.Decrement>
        {/* Native input — readOnly so users use the +/- buttons; this keeps
             cart line UX consistent (typing 999 in a stepper feels wrong)
             while still giving us free keyboard increment/decrement on the
             group via base-ui's handlers. */}
        <NumberField.Input
          readOnly
          className={cn(
            "bg-transparent text-center text-small text-foreground tabular-nums outline-none border-0 focus-visible:outline-none cursor-default",
            s.input,
          )}
        />
        <NumberField.Increment
          aria-label={labelInc}
          className={cn(
            "flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors",
            s.btn,
          )}
        >
          <Plus className={s.icon} />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  )
}
