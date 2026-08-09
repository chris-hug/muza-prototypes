"use client"

/*
 * NavRow — a tappable list row that drills somewhere: optional leading icon,
 * label, optional trailing value, chevron. The list-view counterpart to a
 * menu item — used for browse entry points (Add music › "Artists / Albums /
 * Songs…"), settings groups, and any "tap to go deeper" list.
 *
 * 44px+ tap target, hover/active fill, focus-visible ring — same interaction
 * treatment as the other row components.
 */

import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface NavRowProps {
  label: string
  /** Leading glyph — sized to 16px by the row. */
  icon?:  React.ReactNode
  /** Muted text before the chevron (e.g. the current setting's value). */
  value?: string
  onClick?: () => void
  className?: string
}

export function NavRow({ label, icon, value, onClick, className }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
        "hover:bg-muted active:bg-muted outline-none focus-visible:bg-muted",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1 min-w-0 truncate text-small text-foreground">{label}</span>
      {value && <span className="shrink-0 text-xsmall text-muted-foreground">{value}</span>}
      <ChevronRight className="text-muted-foreground" />
    </button>
  )
}
