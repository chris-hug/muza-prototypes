"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── ToggleGroup ──────────────────────────────────────────────────────────────
//
// Segmented control container — same chrome and dimensions as TabsList sm
// (h-[40px] muted track with p-1 inner padding). Toggle children inside
// auto-pick up matching height/padding via the group-data selector pattern,
// just like TabsTrigger does.
//
// Sizes mirror TabsList exactly:
//   sm      → h-[40px] · trigger px-3 · text-2xsmall · font-normal
//   default → h-12     · trigger px-6 · text-small   · font-normal
//   lg      → h-[52px] · trigger px-8 · text-small   · font-medium
//
// Modes:
//   single-select (default) — one Toggle pressed at a time
//   `multiple`              — any combination
// ─────────────────────────────────────────────────────────────────────────────

const toggleGroupVariants = cva(
  "group/toggle-group inline-flex w-fit items-center rounded-full bg-muted text-muted-foreground gap-0 p-1",
  {
    variants: {
      size: {
        sm:      "h-[40px]",
        default: "h-12",
        lg:      "h-[52px]",
      },
    },
    defaultVariants: { size: "sm" },
  },
)

interface ToggleGroupProps extends ToggleGroupPrimitive.Props,
  VariantProps<typeof toggleGroupVariants> {}

function ToggleGroup({
  className,
  size = "sm",
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-size={size}
      className={cn(toggleGroupVariants({ size }), className)}
      {...props}
    />
  )
}

export { ToggleGroup, toggleGroupVariants }
