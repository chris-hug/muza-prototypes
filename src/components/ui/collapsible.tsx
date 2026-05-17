"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

import { cn } from "@/lib/utils"

// ─── Collapsible ──────────────────────────────────────────────────────────────
//
// Single expand/collapse region — the building block for Accordion when you
// only need one section. Useful for "show more" patterns, inline reveal of
// optional fields, advanced settings toggles, etc.
// ─────────────────────────────────────────────────────────────────────────────

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        // Reset native <button> chrome (border, background, appearance) so
        // the trigger looks like its className intends — UA defaults can
        // otherwise leak through as a hairline border in some browsers.
        "appearance-none border-0 bg-transparent cursor-pointer p-0",
        // Text-link-style trigger: underline on focus-visible (a11y
        // indicator) instead of a button-style ring halo, since the
        // trigger reads as a "show more" link, not a primary control.
        "inline-flex items-center gap-1.5 text-small text-foreground hover:text-foreground/80 transition-colors outline-none focus-visible:underline underline-offset-3",
        className,
      )}
      {...props}
    />
  )
}

function CollapsiblePanel({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      className={cn(
        // base-ui handles open/closed via data attributes; we use them to
        // animate height. The primitive sets `--collapsible-panel-height`
        // CSS var that we can interpolate against for grid-template-rows
        // animation; for simplicity we just toggle visibility here.
        "overflow-hidden transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0",
        className,
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel }
