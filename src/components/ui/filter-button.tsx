"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Shared filter trigger styling ────────────────────────────────────────────

export const filterTriggerCls = (active: boolean) =>
  cn(
    // Matches Button / Tabs optical-center recipe (`pb-px` nudge, no
    // explicit pt/pb). The Select + Input variant (`pt-[6px] pb-[10px]`)
    // sits too high for chips because the lighter `font-normal` weight
    // exposes more empty space above the glyphs than below.
    "press-ripple relative [--press-fill:var(--press-on-muted)]",
    "inline-flex items-center gap-1.5 h-10 pl-4 pr-3 rounded-full border pb-px",
    // House press: colour, 90ms, same curve as Button and Chip.
    "text-small font-normal whitespace-nowrap select-none cursor-pointer",
    "transition-[color,background-color,border-color] duration-[130ms] ease-[cubic-bezier(0.2,0,0,1)]",
    "focus-visible:outline-none focus-visible:border-ring focus-ring",
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
    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-2xsmall font-medium leading-none tabular-nums">
      {/* optical nudge — lift the figure slightly to sit centered */}
      <span className="relative top-[-0.5px]">{count}</span>
    </span>
  )
}
