/*
 * Order email dispatcher — pure mapping from status transitions to the
 * email that goes out as a side-effect. This is the front-end simulation
 * of what a real backend would do when an OrderStatusChanged event fires:
 *
 *   1. Observe (from, to) state change
 *   2. Pick the matching template via `getEmailForTransition`
 *   3. Merge the artist's personal message with the system-rendered receipt
 *   4. Hand to a transactional email service
 *
 * Here we stop at step 1: this module returns metadata about which email
 * WOULD be sent, so the UI can give the artist explicit feedback (toast
 * copy + timeline entries) when they change an order's status.
 */
import type { OrderStatus } from "@/components/app/orders-view"

// ─── Email types ─────────────────────────────────────────────────────────────

export type OrderEmailType =
  | "order_confirmation"
  | "preorder_authorized"
  | "preorder_captured"
  | "payment_failed"
  | "shipping_notification"
  | "delivery_confirmation"
  | "refund_issued"
  | "order_cancelled"

export interface OrderEmail {
  type:      OrderEmailType
  /** Used as the toast title — what the artist sees in confirmation. */
  toast:     string
  /** What lands as the email's subject line in the buyer's inbox. */
  subject:   (orderNumber: string) => string
  /** What goes into the order timeline as the system record. */
  timelineTitle: string
}

const EMAILS: Record<OrderEmailType, OrderEmail> = {
  order_confirmation: {
    type:    "order_confirmation",
    toast:   "Order confirmation sent",
    subject: (n) => `Your order ${n} is confirmed`,
    timelineTitle: "Confirmation email sent",
  },
  preorder_authorized: {
    type:    "preorder_authorized",
    toast:   "Pre-order authorization confirmation sent",
    subject: (n) => `Pre-order ${n} authorized — captures on release`,
    timelineTitle: "Pre-order authorization email sent",
  },
  preorder_captured: {
    type:    "preorder_captured",
    toast:   "Pre-order capture notification sent",
    subject: (n) => `Pre-order ${n} payment captured`,
    timelineTitle: "Pre-order capture email sent",
  },
  payment_failed: {
    type:    "payment_failed",
    toast:   "Payment-failure notification sent to buyer",
    subject: (n) => `Action required: payment for ${n} failed`,
    timelineTitle: "Payment-failure email sent",
  },
  shipping_notification: {
    type:    "shipping_notification",
    toast:   "Shipping notification sent",
    subject: (n) => `Your order ${n} has shipped`,
    timelineTitle: "Shipping notification sent",
  },
  delivery_confirmation: {
    type:    "delivery_confirmation",
    toast:   "Delivery confirmation sent",
    subject: (n) => `Your order ${n} has been delivered`,
    timelineTitle: "Delivery confirmation sent",
  },
  refund_issued: {
    type:    "refund_issued",
    toast:   "Refund confirmation sent",
    subject: (n) => `Refund issued for order ${n}`,
    timelineTitle: "Refund email sent",
  },
  order_cancelled: {
    type:    "order_cancelled",
    toast:   "Cancellation notice sent",
    subject: (n) => `Your order ${n} was cancelled`,
    timelineTitle: "Cancellation email sent",
  },
}

// ─── Transition → Email mapping ──────────────────────────────────────────────
//
// Not every transition sends an email. For instance, undoing "shipped → new"
// is treated as a correction (no second email — the buyer is still waiting on
// the original shipping notification once the artist re-marks it). And
// flipping between unsold lifecycle states without crossing a meaningful
// boundary stays silent.

export function getEmailForTransition(
  from: OrderStatus,
  to:   OrderStatus,
): OrderEmail | null {
  if (from === to) return null

  // The first time an order enters `new` (from `payment_failed`, typically
  // after a retry capture), it's effectively a fresh confirmation.
  if (to === "new" && from === "payment_failed") return EMAILS.order_confirmation

  if (to === "shipped"      && from === "new")     return EMAILS.shipping_notification
  if (to === "delivered"    && from === "shipped") return EMAILS.delivery_confirmation
  // Direct new → delivered is unusual but supported (manual override) —
  // send both shipping + delivery? Choose delivery: it's the user-facing
  // outcome. Backend can decide to also queue the shipping email or skip.
  if (to === "delivered"    && from === "new")     return EMAILS.delivery_confirmation

  if (to === "refunded")                           return EMAILS.refund_issued
  if (to === "cancelled")                          return EMAILS.order_cancelled

  if (to === "payment_failed")                     return EMAILS.payment_failed

  // Backward transitions (e.g. delivered → shipped) are corrections —
  // never re-fire. Same for fail → fail or other no-ops.
  return null
}

// ─── Default artist-side personal messages ───────────────────────────────────
//
// These are the fallbacks the email worker uses when the shop has not
// overridden the template in Shop Settings → Communication templates.
// Kept here (not in the UI file) so the worker doesn't depend on a React
// module.

export function getEmailMeta(type: OrderEmailType): OrderEmail {
  return EMAILS[type]
}

// ─── Per-order email log ─────────────────────────────────────────────────────
//
// In production this lives in the database. Here we keep an in-memory record
// per order so the Buyer Communications section can render queued vs. sent
// state without a real backend.

export type OrderEmailStatus = "queued" | "sent" | "skipped"

export interface OrderEmailRecord {
  type:    OrderEmailType
  status:  OrderEmailStatus
  /** ISO timestamp — present once status === "sent". */
  sentAt?: string
  /** Optional one-off override of the artist's saved personal message,
   *  for this specific buyer. Empty / undefined = use shop default. */
  personalMessage?: string
}

export type OrderEmailLog = Partial<Record<OrderEmailType, OrderEmailRecord>>

/**
 * Which email types are relevant to the order's *current* status.
 * Drives what rows show up in the Buyer Communications section.
 */
export function getRelevantEmails(
  status: import("@/components/app/orders-view").OrderStatus,
  preorderState?: "authorized" | "captured" | "capture_failed",
): OrderEmailType[] {
  const result: OrderEmailType[] = []

  // Order confirmation always shown unless payment failed (in which case the
  // failure email replaces it as the operative buyer-facing message).
  if (status !== "payment_failed") result.push("order_confirmation")
  if (status === "payment_failed") result.push("payment_failed")

  if (preorderState === "authorized") result.push("preorder_authorized")

  if (status === "shipped" || status === "delivered") {
    result.push("shipping_notification")
  }
  if (status === "delivered") result.push("delivery_confirmation")
  if (status === "refunded")  result.push("refund_issued")
  if (status === "cancelled") result.push("order_cancelled")

  return result
}

/**
 * Initial email log for an order on first render. Assumes any email tied to
 * a *past* status transition was already sent (under the previous auto-send
 * model). Subsequent transitions during this session create `queued` entries
 * via `onTransition` — those need explicit Compose & send.
 */
export function initializeEmailLog(
  status: import("@/components/app/orders-view").OrderStatus,
  orderDate: string,
  preorderState?: "authorized" | "captured" | "capture_failed",
): OrderEmailLog {
  const d  = new Date(orderDate)
  const at = (offsetDays: number, offsetMin = 0) =>
    new Date(d.getTime() + offsetDays * 86_400_000 + offsetMin * 60_000).toISOString()

  const log: OrderEmailLog = {}

  if (status !== "payment_failed") {
    log.order_confirmation = { type: "order_confirmation", status: "sent", sentAt: at(0, 2) }
  } else {
    log.payment_failed = { type: "payment_failed", status: "sent", sentAt: at(0) }
  }

  if (preorderState === "authorized") {
    log.preorder_authorized = { type: "preorder_authorized", status: "sent", sentAt: at(0) }
  }

  if (status === "shipped" || status === "delivered") {
    log.shipping_notification = { type: "shipping_notification", status: "sent", sentAt: at(1) }
  }
  if (status === "delivered") {
    log.delivery_confirmation = { type: "delivery_confirmation", status: "sent", sentAt: at(4) }
  }
  if (status === "refunded") {
    log.refund_issued = { type: "refund_issued", status: "sent", sentAt: at(7) }
  }
  if (status === "cancelled") {
    log.order_cancelled = { type: "order_cancelled", status: "sent", sentAt: at(1) }
  }

  return log
}

export const DEFAULT_TEMPLATES: Record<OrderEmailType, string> = {
  order_confirmation:
    "Thanks so much for your order — it means a lot. I'll let you know as soon as it ships.",
  preorder_authorized:
    "Thanks for pre-ordering! You'll be charged when the release ships, and I'll send you a tracking link as soon as it's on the way.",
  preorder_captured:
    "Your pre-order has been captured and is being prepared. Tracking will follow once it ships.",
  payment_failed:
    "We tried to capture payment for your order and the card was declined. Please update your payment method to keep your order moving.",
  shipping_notification:
    "Your order is on its way. The tracking link below will show updates as it moves.",
  delivery_confirmation:
    "Your order should have arrived. I hope you love it — and thank you for supporting the work.",
  refund_issued:
    "Your refund has been issued and will appear on your original payment method within a few business days.",
  // Neutral copy that works for both cancellation paths:
  //   · new → cancelled: original capture is refunded automatically
  //   · payment_failed → cancelled: nothing was captured, no refund needed
  // The "where applicable" hedge keeps the line accurate in both cases.
  // Sellers can override per-order in the composer if they want more
  // specific wording for one path.
  order_cancelled:
    "Your order has been cancelled. Where a payment was processed it will be refunded to your original payment method. Sorry for the inconvenience.",
}
