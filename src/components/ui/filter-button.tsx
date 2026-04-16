"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Shared filter trigger styling ────────────────────────────────────────────

export const filterTriggerCls = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 h-10 pl-4 pr-3 pt-[8px] pb-[8px] rounded-full border",
    "text-sm font-normal whitespace-nowrap transition-colors select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "border-foreground/40 bg-muted text-foreground"
      : "border-border bg-background text-foreground hover:border-foreground/30",
  )

// ─── FilterChevron ────────────────────────────────────────────────────────────

export function FilterChevron() {
  return (
    <ChevronDown className="pointer-events-none size-4 text-muted-foreground translate-y-[2px] transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
  )
}

// ─── FilterCount ──────────────────────────────────────────────────────────────

export function FilterCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[10px] font-medium leading-none ">
      {count}
    </span>
  )
}
