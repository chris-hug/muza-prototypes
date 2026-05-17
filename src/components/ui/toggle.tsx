"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"

import { cn } from "@/lib/utils"

// ─── Toggle ───────────────────────────────────────────────────────────────────
//
// A two-state pressed/unpressed button. Standalone metrics match Button sm
// (h-8, px-3, text-2xsmall, font-normal) so a Toggle drops cleanly into a
// row of small buttons. When nested in a ToggleGroup, it inherits height
// and padding from the group's `data-size` (matching TabsTrigger behavior).
//
// Pressed state: `bg-background` lifted pill with `shadow-sm` — same look
// as the topbar's theme picker. Unpressed = transparent + muted text.
// ─────────────────────────────────────────────────────────────────────────────

interface ToggleProps extends TogglePrimitive.Props {
  /** Standalone size — ignored when nested in a ToggleGroup (group wins). */
  size?: "sm" | "default" | "lg"
}

const STANDALONE_SIZE = {
  sm:      "h-8 px-3 text-2xsmall font-normal",
  default: "h-10 px-[18px] text-small font-medium",
  lg:      "h-12 px-10 text-small font-medium",
} as const

function Toggle({ className, size = "sm", ...props }: ToggleProps) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        // Base — shared by standalone + grouped uses
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full transition-colors outline-none",
        "text-muted-foreground hover:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // Standalone defaults — applied when NOT inside a ToggleGroup. The
        // group context overrides via more-specific group-data selectors
        // below, so these only "win" for bare <Toggle/> usage.
        STANDALONE_SIZE[size],

        // Inside ToggleGroup — fill the group's height + read size from the
        // group's data-size. Mirrors how TabsTrigger reads from TabsList.
        "group-data-[size]/toggle-group:h-full group-data-[size]/toggle-group:flex-1",
        "group-data-[size=sm]/toggle-group:px-3 group-data-[size=sm]/toggle-group:text-2xsmall group-data-[size=sm]/toggle-group:font-normal",
        "group-data-[size=default]/toggle-group:px-6 group-data-[size=default]/toggle-group:text-small group-data-[size=default]/toggle-group:font-normal",
        "group-data-[size=lg]/toggle-group:px-8 group-data-[size=lg]/toggle-group:text-small group-data-[size=lg]/toggle-group:font-medium",

        // Pressed — soft "lifted pill" matching the topbar theme toggle.
        "data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm",

        className,
      )}
      {...props}
    />
  )
}

export { Toggle }
export type { ToggleProps }
