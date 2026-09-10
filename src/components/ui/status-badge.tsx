"use client"

import * as React from "react"
import { ChevronDown, Globe, Lock, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

// ─── StatusBadge ──────────────────────────────────────────────────────────────
//
// Figma source: L9yw4Yaec9YtAXGxP8q4fu › node 21368:27118
//
// Track/release visibility status (privacy). Self-contained — clicking opens a
// dropdown to switch between public / private. Pass `onStatusChange` to be
// notified.
//   public  → Globe icon
//   private → Lock icon
//
// Visually mirrors the base Badge's `outline` variant (glassmorphism) but is a
// distinct, interactive component — kept in its own file so its design-system
// metadata (last-changed date + source link) is tracked independently.
// ─────────────────────────────────────────────────────────────────────────────

type StatusBadgeStatus = "public" | "private"

const statusConfig: Record<StatusBadgeStatus, { label: string; icon: React.ElementType }> = {
  public:  { label: "Public",  icon: Globe },
  private: { label: "Private", icon: Lock },
}

interface StatusBadgeProps {
  status: StatusBadgeStatus
  onStatusChange?: (status: StatusBadgeStatus) => void
  className?: string
}

const STATUS_TRIGGER_CLS = cn(
  "inline-flex w-fit shrink-0 items-center gap-1",
  "rounded-sm border border-border",
  "backdrop-blur-[8px] bg-background/50 text-muted-foreground",
  "pt-[4px] pb-[6px] px-[6px]",
  "text-2xsmall font-normal leading-none whitespace-nowrap",
  "transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground",
  "focus-visible:outline-none focus-ring",
  "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
  "cursor-pointer select-none",
)

function StatusBadge({ status, onStatusChange, className }: StatusBadgeProps) {
  const { label, icon: Icon } = statusConfig[status]
  /*
   * The project's `DropdownMenu`, not Base UI's `Menu` directly. That is the
   * whole point of it: below the presentation gate it swaps the popup for a
   * bottom sheet with big tappable rows, and every other menu in the app
   * already goes through it. This badge was talking to the primitive, so on a
   * phone it opened a 7rem dropdown with 1.5-line-high rows — a desktop menu
   * on a touch screen, and the one menu in the app that behaved differently
   * from all the others.
   */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="status-badge"
        className={cn(STATUS_TRIGGER_CLS, className)}
      >
        <Icon aria-hidden />
        {label}
        <ChevronDown className="opacity-80 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[7rem]">
        {(Object.entries(statusConfig) as [StatusBadgeStatus, { label: string; icon: React.ElementType }][]).map(
          ([key, { label: itemLabel, icon: ItemIcon }]) => (
            <DropdownMenuItem key={key} onClick={() => onStatusChange?.(key)}>
              <ItemIcon className="size-3 shrink-0" aria-hidden />
              {itemLabel}
              {key === status && <Check className="ml-auto size-3 text-primary-text" aria-hidden />}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { StatusBadge }
export type { StatusBadgeStatus }
