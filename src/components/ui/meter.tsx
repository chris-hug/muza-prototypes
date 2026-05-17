"use client"

import * as React from "react"
import { Meter as MeterPrimitive } from "@base-ui/react/meter"

import { cn } from "@/lib/utils"

// ─── Meter ────────────────────────────────────────────────────────────────────
//
// A static, bounded measurement (0-100% of a scalar). Different from
// Progress (which represents work in flight). Use for storage usage,
// password strength, capacity meters, audio level peaks at rest, etc.
// ─────────────────────────────────────────────────────────────────────────────

function Meter({ className, ...props }: MeterPrimitive.Root.Props) {
  return (
    <MeterPrimitive.Root
      data-slot="meter"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function MeterLabel({ className, ...props }: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      className={cn("text-xsmall text-muted-foreground", className)}
      {...props}
    />
  )
}

function MeterValue({ className, ...props }: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      className={cn("text-xsmall text-foreground tabular-nums ml-auto", className)}
      {...props}
    />
  )
}

function MeterTrack({ className, ...props }: MeterPrimitive.Track.Props) {
  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-input", className)}
      {...props}
    />
  )
}

function MeterIndicator({ className, ...props }: MeterPrimitive.Indicator.Props) {
  return (
    <MeterPrimitive.Indicator
      data-slot="meter-indicator"
      className={cn("h-full bg-foreground transition-[width]", className)}
      {...props}
    />
  )
}

export { Meter, MeterLabel, MeterValue, MeterTrack, MeterIndicator }
