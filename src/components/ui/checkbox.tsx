"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Checkbox ─────────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 46:112
//
// Has optional description text below the label (handled by the consumer via
// the CheckboxField helper below, or manually with Label + p).
//
// States: unchecked · checked · indeterminate · disabled
// ─────────────────────────────────────────────────────────────────────────────

function Checkbox({ className, onCheckedChange, ...props }: CheckboxPrimitive.Root.Props) {
  const [anim, setAnim] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-anim={anim || undefined}
      onCheckedChange={(checked, details) => {
        setAnim(false)
        // Two frames: clearing and re-adding the attribute in one paint does
        // not restart a CSS animation, so the second tick would not move.
        requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)))
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setAnim(false), 400)
        onCheckedChange?.(checked, details)
      }}
      className={cn(
        // Layout
        "peer relative flex size-4 shrink-0 items-center justify-center",
        // Shape — Figma: 3px radius, muted-foreground border at 0.5px
        // Fixed px value — must NOT scale with --radius (would become a circle)
        "rounded-[3px] border border-muted-foreground",
        // Transitions + outline
        "transition-colors outline-none",
        // Touch target expansion
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        // Focus ring
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        "group-has-disabled/field:opacity-50",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "aria-invalid:aria-checked:border-primary",
        // Dark mode default bg
        "dark:bg-input/30",
        // Checked state
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "dark:data-checked:bg-primary",
        /* The spring runs on CHANGE, not on state — `data-checked:animate-…`
           fires on mount too, so every pre-ticked box in a form bounced on
           page load. `data-anim` is set from `onCheckedChange` and cleared
           after the run, which also gets the other half of it: unticking
           springs as well. `muzaTick` is the pick mark's bounce at half
           amplitude — a checkbox is ticked in rows of six, and the louder
           curve repeated down a form reads as fidgeting. */
        "data-[anim]:animate-[muzaTick_360ms_cubic-bezier(.22,1,.36,1)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        // The glyph rides the box's spring rather than fading in on its own:
        // two animations on one mark read as a stutter.
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

// ─── CheckboxField ─────────────────────────────────────────────────────────────
//
// Convenience wrapper that renders Checkbox + label + optional description.
// Mirrors the Figma checkbox component which shows label and optional
// description text below.
//
// Usage:
//   <CheckboxField
//     id="terms"
//     label="Accept terms & conditions"
//     description="By checking this you agree to our ToS."
//     defaultChecked
//   />
// ─────────────────────────────────────────────────────────────────────────────

interface CheckboxFieldProps extends CheckboxPrimitive.Root.Props {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
}

function CheckboxField({ id, label, description, className, ...props }: CheckboxFieldProps) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <Checkbox id={id} className="mt-0.5" {...props} />
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id}
          className="text-small font-normal text-foreground leading-snug cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
        {description && (
          <p className="text-xsmall text-muted-foreground leading-snug">{description}</p>
        )}
      </div>
    </div>
  )
}

export { Checkbox, CheckboxField }
