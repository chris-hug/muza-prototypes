"use client"

/*
 * OrderStatusBadge — the shop order lifecycle. Top row: every status,
 * read-only, as the Orders table and the buyer's Purchases render them.
 * Second row: the interactive form — pass `onStatusChange` and the badge
 * becomes a dropdown of the transitions allowed from its status. Pick one
 * and the badge follows, because the state is real.
 *
 * This file is a CALL SITE, not a copy: it renders the real component; the
 * status list and transition table are the component's own exports.
 */

import { useState } from "react"

import {
  ALL_STATUSES, OrderStatusBadge, type OrderStatus,
} from "@/components/ui/order-status-badge"

export default function OrderStatusBadgeBasicExample() {
  const [status, setStatus] = useState<OrderStatus>("new")
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {ALL_STATUSES.map(s => <OrderStatusBadge key={s} status={s} />)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={status} onStatusChange={setStatus} />
        {/* Terminal statuses render read-only even with a handler. */}
        <OrderStatusBadge status="refunded" onStatusChange={setStatus} />
      </div>
    </div>
  )
}
