"use client"

/*
 * BulkActionBar — the floating "N selected" pill that appears when a
 * list/table has a multi-row selection. A dark rounded bar with a count,
 * a divider, one or more action buttons, and a clear (✕).
 *
 * Positioning is the whole point of making this a component: it portals
 * into the app content area (`#app-content`, the shell's <main>) and
 * pins `absolute bottom-6` there. That element is a fixed-height,
 * non-scrolling box offset from the sidebar — so the bar stays at the
 * bottom of the visible viewport, centred over the content, no matter
 * how far the underlying list scrolls. (Rendering it inline inside a
 * tall, scrolling table parks it far below the fold instead.)
 *
 * Used by Studio/Music, Shop/Products, Shop/Orders, and the library
 * list tables.
 */

import { createPortal } from "react-dom"
import { useFooterNav } from "@/lib/use-media-query"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Action button styled for the dark pill — light translucent chip. */
export function BulkActionButton({
  onClick, children, className,
}: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onClick}
      className={cn("bg-background/15 hover:bg-background/25 text-background border-transparent", className)}
    >
      {children}
    </Button>
  )
}

interface BulkActionBarProps {
  count: number
  onClear: () => void
  /** Noun after the count — "selected" (default). */
  label?: string
  /** Action buttons (use `BulkActionButton`). */
  children: React.ReactNode
}

/** The visual pill on its own — used by the live bar and the DS preview. */
export function BulkActionBarContent({ count, onClear, label = "selected", children }: BulkActionBarProps) {
  return (
    // `flex-wrap` — on a phone the count + two actions + ✕ are wider than the
    // screen (405px at 375), so the actions drop to a second line instead of
    // the pill running off the left edge.
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-3 rounded-2xl bg-foreground border border-foreground shadow-xl">
      <span className="text-small font-medium text-background tabular-nums pr-2 whitespace-nowrap">
        {count} {label}
      </span>
      <div className="w-px h-5 bg-background/20" />
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-1 text-background/50 hover:text-background transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/** Live, portaled bar. Renders nothing when `count` is 0. */
export function BulkActionBar(props: BulkActionBarProps) {
  // The lift clears the footer tab bar + mini player, which exist below 608
  // (`useFooterNav`), NOT below the 768 presentation gate — between the two
  // the desktop player bar is on screen and `bottom-6` already sits over it.
  const footerNav = useFooterNav()
  if (props.count === 0) return null

  // A full-width, click-through row that centres the pill: `left-1/2` +
  // translate would leave an absolute pill only the right half of the box
  // to shrink-to-fit in, and on a phone that wrapped it into a 137px column.
  const bar = (
    <div
      className={cn(
        "absolute inset-x-3 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200",
        footerNav ? "bottom-24" : "bottom-6",
      )}
      data-footer-nav={footerNav ? "" : undefined}
    >
      <div className="pointer-events-auto max-w-full">
        <BulkActionBarContent {...props} />
      </div>
    </div>
  )

  const target = typeof document !== "undefined" ? document.getElementById("app-content") : null
  return target ? createPortal(bar, target) : bar
}
