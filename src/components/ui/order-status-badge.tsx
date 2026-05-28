"use client"

import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Order status (shop) ────────────────────────────────────────────────────
//
// Shop order lifecycle badge + its supporting data (the status set, per-status
// label/colour config, and allowed forward transitions). Lives in its own file
// so its design-system metadata (last-changed date + source link) is tracked
// independently of the generic Badge and the privacy StatusBadge.
//
// `orders-view.tsx` re-exports `OrderStatus` / `STATUS_CONFIG` /
// `OrderStatusBadge` so existing `from "@/components/app/orders-view"` import
// sites keep working.
// ─────────────────────────────────────────────────────────────────────────────

// `payment_failed` covers capture failures AND any other case where money
// didn't make it (declined retry, chargeback awaiting evidence, etc.) — the
// artist's recovery action is the same regardless of how the order got there.
export type OrderStatus =
  | "payment_failed" | "new" | "shipped" | "delivered" | "refunded" | "cancelled"

export const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  // Deep-red FILL — a signal flare, not a subtle outline. Action required.
  payment_failed: { label: "Payment failed", className: "bg-destructive text-destructive-foreground border-destructive" },
  // Light mode: pale tint + dark text (always passes contrast).
  // Dark mode: translucent mid-tone tint (`/15`) + bright `-200` text +
  // visible accent border (`/30`). Hits AA contrast on dark backgrounds.
  new:       { label: "New",       className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30" },
  shipped:   { label: "Shipped",   className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30" },
  delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-200 dark:border-green-500/30" },
  refunded:  { label: "Refunded",  className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30" },
}

export const ALL_STATUSES: OrderStatus[] =
  ["payment_failed", "new", "shipped", "delivered", "refunded", "cancelled"]

// Forward-only routine transitions for the row's status badge. Cancel is
// intentionally omitted — it's destructive (triggers refund + buyer email),
// warrants a reason, and lives in the confirmation flows instead.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new:            ["new", "shipped"],
  shipped:        ["new", "shipped", "delivered"],
  delivered:      ["shipped", "delivered"],
  cancelled:      ["cancelled"],
  refunded:       ["refunded"],
  payment_failed: ["payment_failed"],
}

// Two modes:
//   · Read-only — `<OrderStatusBadge status={s} />` — used in the row table.
//   · Interactive — pass `onStatusChange` and the badge becomes a dropdown
//     trigger so the artist can flip between sensible transitions in place.
export function OrderStatusBadge({
  status, onStatusChange, className,
}: {
  status: OrderStatus
  onStatusChange?: (next: OrderStatus) => void
  className?: string
}) {
  const cfg = STATUS_CONFIG[status]
  const transitions = ALLOWED_TRANSITIONS[status]
  // Read-only render when no handler or only the current status is allowed.
  if (!onStatusChange || transitions.length <= 1) {
    return <Badge className={cn(cfg.className, className)}>{cfg.label}</Badge>
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          // Mirror the Badge primitive's shape but make it tappable. The
          // chevron signals "this is interactive".
          "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border",
          "pt-[4px] pb-[6px] pl-[6px] pr-[4px] text-2xsmall font-normal leading-none whitespace-nowrap",
          "transition-colors cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          cfg.className,
          "hover:opacity-90",
          className,
        )}
      >
        {cfg.label}
        <ChevronDown className="size-3 opacity-80 transition-transform duration-200 [[aria-expanded=true]_&]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {transitions.map(s => (
          <DropdownMenuItem
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(s === status && "bg-accent")}
          >
            <Badge className={cn(STATUS_CONFIG[s].className, "shrink-0")}>{STATUS_CONFIG[s].label}</Badge>
            {s === status && <span className="text-2xsmall text-muted-foreground ml-1">current</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
