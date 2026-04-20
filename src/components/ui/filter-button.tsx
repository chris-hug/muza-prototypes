"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Shared filter trigger styling ────────────────────────────────────────────

export const filterTriggerCls = (active: boolean) =>
  cn(
    // Asymmetric `pt-[6px] pb-[10px]` matches Input and SelectTrigger —
    // Founders Grotesk's ascender/descender balance wants 4px extra at the
    // bottom to sit visually centered in a 40px pill.
    "inline-flex items-center gap-1.5 h-10 pl-4 pr-3 pt-[6px] pb-[10px] rounded-full border",
    "text-small font-normal whitespace-nowrap transition-colors select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "border-foreground/40 bg-muted text-foreground"
      : "border-border bg-background text-foreground hover:border-foreground/30",
  )

// ─── FilterChevron ────────────────────────────────────────────────────────────

export function FilterChevron() {
  // `relative top-[2px]` for optical alignment — kept separate from the
  // `transform` used for the open-state rotation so the two don't compose
  // into a rotated translate that visually jumps the icon mid-animation.
  return (
    <ChevronDown className="pointer-events-none relative top-[2px] size-4 text-muted-foreground transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
  )
}

// ─── FilterCount ──────────────────────────────────────────────────────────────

export function FilterCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-2xsmall font-medium leading-none ">
      {count}
    </span>
  )
}
