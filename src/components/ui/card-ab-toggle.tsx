"use client"

/*
 * CardAbToggle — a small floating control for the home-page card-text A/B.
 * Lets stakeholders flip between variant A (original) and B (refined) to
 * compare, and shows which one they're currently seeing. Sticky per browser
 * (see `use-card-ab`).
 */

import { cn } from "@/lib/utils"
import { useCardAb, setCardAb, type CardAb } from "@/lib/use-card-ab"

export function CardAbToggle({ className }: { className?: string }) {
  const ab = useCardAb()
  const opt = (v: CardAb, label: string) => (
    <button
      type="button"
      onClick={() => setCardAb(v)}
      aria-pressed={ab === v}
      className={cn(
        "h-7 px-3 rounded-full text-xsmall font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        ab === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full frosted-glass border border-border/60 pl-3 pr-1 py-1 shadow-lg select-none",
        className,
      )}
    >
      <span className="text-2xsmall font-normal text-muted-foreground">Card text</span>
      <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
        {opt("a", "A")}
        {opt("b", "B")}
      </div>
    </div>
  )
}
