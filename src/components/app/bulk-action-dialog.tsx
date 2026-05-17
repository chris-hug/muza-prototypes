"use client"

/*
 * BulkActionDialog — confirmation dialog for multi-order operations.
 *
 * Wraps a status transition (e.g. "Mark as shipped") with a single
 * artist-confirmation step that ALSO controls the buyer email batch:
 *
 *   - Default-on toggle: send notification to each buyer
 *   - Per-buyer personalisation is intentionally NOT exposed here — bulk
 *     sends use the shop's saved template. Artists who want a unique
 *     message go through the per-order detail flow.
 *   - Affected-orders list (collapsible) so the artist can verify exactly
 *     which orders will be touched, and which were skipped (and why)
 *   - One confirm → all status changes + all emails fire together
 *
 * Per-order personalization is intentionally sacrificed for batch speed.
 * Artists who want a unique message per buyer go through the per-order
 * detail flow instead.
 */

import { useEffect, useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import {
  getEmailMeta, type OrderEmailType,
} from "@/lib/order-emails"
import {
  type Order, formatTotal,
} from "@/components/app/orders-view"
import { cn } from "@/lib/utils"

export interface BulkActionDialogProps {
  open:    boolean
  onOpenChange: (v: boolean) => void

  /** Every order the artist selected — eligible AND ineligible. The dialog
   *  shows them all so the artist can verify the breakdown. */
  orders:        Order[]
  /** Subset of `orders.id` actually eligible for this transition. The rest
   *  render in a "skipped" section. */
  eligibleIds:   Set<string>
  /** Optional explanation rendered next to each skipped order (e.g.
   *  "already shipped"). Defaults to a generic "ineligible" caption. */
  skipReason?:   (order: Order) => string

  /** Header copy. e.g. "Change status to Shipped". */
  title:         string
  /** Confirm button label, e.g. "Mark shipped & notify {n} buyers". */
  confirmLabel:  string
  /** When true, the confirm button is destructive-styled. */
  destructive?:  boolean

  /** Email type sent on confirm — drives copy + default template. */
  emailType:     OrderEmailType
  /** Default state for the notify toggle. Default true; pass false for
   *  cases like "Mark delivered" where carrier already notifies. */
  notifyDefault?: boolean
  /** When false, hide the notify toggle entirely. For actions where the
   *  email is a downstream consequence of the action's outcome, not a
   *  decision the artist needs to make up front (e.g. retry capture —
   *  confirmation only fires if the retry succeeds). */
  showNotifyToggle?: boolean

  /** Fired when artist confirms. Receives the final notify-decision +
   *  the eligible ids the parent should mutate. */
  onConfirm: (opts: {
    notify:      boolean
    eligibleIds: string[]
  }) => void
}

export function BulkActionDialog({
  open, onOpenChange,
  orders, eligibleIds, skipReason,
  title, confirmLabel, destructive = false,
  emailType, notifyDefault = true, showNotifyToggle = true,
  onConfirm,
}: BulkActionDialogProps) {
  const meta = getEmailMeta(emailType)
  const [notify, setNotify]   = useState(notifyDefault)

  // Reset on open so each batch starts fresh.
  useEffect(() => {
    if (open) {
      setNotify(notifyDefault)
    }
  }, [open, notifyDefault])

  const eligible = orders.filter(o => eligibleIds.has(o.id))
  const skipped  = orders.filter(o => !eligibleIds.has(o.id))
  const eligibleTotal = eligible.reduce((s, o) => s + o.total, 0)
  const allEligible   = skipped.length === 0
  const noneEligible  = eligible.length === 0

  // Final button label adapts based on notify state — clearer than a
  // generic "Confirm" because the buyer-facing consequence is explicit.
  // When the toggle is hidden, also strip any " & notify …" suffix from
  // the action's confirmLabel so it doesn't reference a decision the
  // artist never saw.
  const showNotifyAnnotation = showNotifyToggle && notify
  const buttonLabel = showNotifyAnnotation
    ? confirmLabel.replace("{n}", String(eligible.length))
    : confirmLabel
        .replace("{n}", String(eligible.length))
        .replace(/ & notify .*$/, "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 min-w-0">
          {/* Summary strip — shows the eligible/skipped breakdown when
               selection is mixed; falls back to a flat count when all
               selected items are eligible. */}
          <div className="flex items-baseline justify-between gap-3 px-4 py-3 rounded-lg bg-muted/40">
            <span className="text-small text-foreground">
              {allEligible ? (
                <>{eligible.length} {eligible.length === 1 ? "order" : "orders"}</>
              ) : (
                <>
                  {orders.length} selected ·{" "}
                  <span className="text-foreground">{eligible.length} eligible</span>
                  {" · "}
                  <span className="text-muted-foreground">{skipped.length} skipped</span>
                </>
              )}
            </span>
            <span className="text-small text-foreground tabular-nums">
              {formatTotal(eligibleTotal)}
            </span>
          </div>

          {/* Affected-orders list — always visible (no click required).
               Eligible rows render normally; skipped rows render muted with
               a reason caption ("already shipped", "cancelled", etc.).
               Scrolls internally if the batch is long. */}
          {orders.length > 0 && (
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <ul className="flex flex-col divide-y divide-border/60 max-h-[280px] overflow-y-auto">
                {eligible.map(o => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
              {skipped.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/40 border-t border-border/60 text-2xsmall text-muted-foreground">
                    Skipped — not eligible for this action
                  </div>
                  <ul className="flex flex-col divide-y divide-border/60 max-h-[200px] overflow-y-auto">
                    {skipped.map(o => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        muted
                        reason={skipReason?.(o)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Notify toggle — hidden for actions where the email is a
               consequence of the action's outcome, not a decision the
               artist needs to make up front (e.g. retry capture). */}
          {showNotifyToggle && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <Label htmlFor="bulk-notify" className="cursor-pointer">
                  Send {meta.timelineTitle.replace(/ sent$/i, "").toLowerCase()} to each buyer
                </Label>
                <p className="text-xsmall text-muted-foreground">
                  Uses your shop default. Each buyer's name, address, and tracking
                  link are merged automatically.
                </p>
              </div>
              <Switch
                id="bulk-notify"
                checked={notify}
                onCheckedChange={setNotify}
                disabled={noneEligible}
              />
            </div>
          )}

        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={noneEligible}
            onClick={() => {
              onConfirm({
                notify,
                eligibleIds: eligible.map(o => o.id),
              })
              onOpenChange(false)
            }}
          >
            {showNotifyAnnotation && <Send className="size-4" />}
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Order row ───────────────────────────────────────────────────────────────

function OrderRow({
  order, muted = false, reason,
}: {
  order:   Order
  muted?:  boolean
  reason?: string
}) {
  const itemsSummary = order.items
    .map(i => i.productTitle)
    .join(" + ")

  return (
    <li className={cn(
      "flex items-baseline gap-3 px-4 py-2.5 text-xsmall min-w-0",
      muted && "opacity-60",
    )}>
      {/* Order # — narrow fixed column, always visible */}
      <span className="text-foreground tabular-nums shrink-0 w-14">
        {order.number}
      </span>
      {/* Customer name — capped at ~96px, truncates inside if longer */}
      <span className="text-foreground shrink basis-24 min-w-0 truncate">
        {order.customer.name}
      </span>
      {/* Items summary — flexible, eats remaining space, truncates */}
      <span className="text-muted-foreground flex-1 min-w-0 truncate">
        {itemsSummary}
      </span>
      {reason && (
        <span className="text-2xsmall text-muted-foreground italic shrink-0">
          {reason}
        </span>
      )}
      <span className="text-foreground tabular-nums shrink-0">
        {formatTotal(order.total)}
      </span>
    </li>
  )
}
