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

/* The row's own recipe, exported so a call site that needs a DIFFERENT inside
 * — a cover thumb and two lines of text, say — can still be the same row.
 * `AddToPlaylistDialog` carried a byte-identical copy of this string until it
 * was pulled out here; two copies of a hover is how two lists stop feeling
 * alike. NavRow's own API stays narrow (label · icon · value · chevron)
 * because that IS the component: a row that drills somewhere. */
export const navRowClass = cn(
  // Tight rows: these are browse entry points, not content — they should not
  // eat the space the track list needs on a phone. 40px tall.
  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left state-fade",
  "hover:bg-muted active:bg-muted outline-none focus-visible:bg-muted",
  "[&_svg]:size-4 [&_svg]:shrink-0",
)

export function NavRow({ label, icon, value, onClick, className }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(navRowClass, className)}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1 min-w-0 truncate text-small text-foreground">{label}</span>
      {value && <span className="shrink-0 text-xsmall text-muted-foreground">{value}</span>}
      <ChevronRight className="text-muted-foreground" />
    </button>
  )
}
