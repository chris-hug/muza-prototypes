"use client"

import * as React from "react"
import { ChevronDown, Globe, Lock, Check } from "lucide-react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
  "cursor-pointer select-none",
)

function StatusBadge({ status, onStatusChange, className }: StatusBadgeProps) {
  const { label, icon: Icon } = statusConfig[status]
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        data-slot="status-badge"
        className={cn(STATUS_TRIGGER_CLS, className)}
      >
        <Icon aria-hidden />
        {label}
        <ChevronDown className="opacity-80 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" aria-hidden />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal keepMounted>
        <MenuPrimitive.Positioner side="bottom" align="start" sideOffset={4}>
          <MenuPrimitive.Popup className={cn(
            "z-50 min-w-[7rem] rounded-xl border border-border bg-popover p-1 shadow-md outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          )}>
            {(Object.entries(statusConfig) as [StatusBadgeStatus, { label: string; icon: React.ElementType }][]).map(
              ([key, { label: itemLabel, icon: ItemIcon }]) => (
                <MenuPrimitive.Item
                  key={key}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5",
                    "text-xsmall outline-none transition-colors",
                    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                  )}
                  onClick={() => onStatusChange?.(key)}
                >
                  <ItemIcon className="size-3 shrink-0" aria-hidden />
                  {itemLabel}
                  {key === status && <Check className="ml-auto size-3 text-primary" aria-hidden />}
                </MenuPrimitive.Item>
              )
            )}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

export { StatusBadge }
export type { StatusBadgeStatus }
