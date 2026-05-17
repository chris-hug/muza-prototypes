"use client"

import * as React from "react"
import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"

import { cn } from "@/lib/utils"

// ─── Toolbar ──────────────────────────────────────────────────────────────────
//
// A horizontal strip of related controls (buttons, toggles, separators) with
// roving focus and arrow-key navigation. Use for editor toolbars, table-row
// action strips, player transport rows.
// ─────────────────────────────────────────────────────────────────────────────

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-background p-1",
        className,
      )}
      {...props}
    />
  )
}

function ToolbarButton({
  className,
  ...props
}: ToolbarPrimitive.Button.Props) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full text-small font-normal text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

function ToolbarGroup({
  className,
  ...props
}: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn("inline-flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn("mx-1 h-5 w-px bg-border", className)}
      {...props}
    />
  )
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator }
