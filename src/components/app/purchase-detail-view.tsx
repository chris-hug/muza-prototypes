"use client"

/*
 * PurchaseDetailView — buyer-side detail page for a single fulfillment.
 *
 * One row in PurchasesView corresponds to one shop's slice of a payment
 * (the Fulfillment). This page is where the buyer goes for the full
 * picture of that slice: itemised list, money breakdown, shipment +
 * tracking, timeline, and the refund-request flow.
 *
 * Sibling to the seller's order-detail-view but from the *buyer's* POV:
 *   - no status dropdown — the buyer doesn't move the order, the seller does
 *   - no internal notes — those belong to the shop
 *   - refund is a REQUEST flow, not an issuance flow
 *
 * Layout: two columns on desktop (flat metadata stack on the right,
 * actionable surfaces on the left). Stacks on mobile.
 */

import { useState } from "react"
import { ArrowLeft, ExternalLink, Truck, MessageCircle } from "lucide-react"

import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  formatDate, formatTotal,
  type OrderItem,
} from "@/components/app/orders-view"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { ItemsSection as SharedItemsSection } from "@/components/app/items-section"
import { RefundFlow } from "@/components/app/refund-flow"
import type { Checkout, Fulfillment } from "@/components/app/purchases-view"

// ─── Helpers ─────────────────────────────────────────────────────────────────
//
// Duplicated locally rather than exported from purchases-view: tiny, no
// drift risk, and keeps the two files independently readable.

function shopInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function shopAvatarUrl(name: string): string {
  const seed = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
  return `https://i.pravatar.cc/80?u=${seed}`
}

/** Mock buyer→seller contact address. Real data would carry the shop's
 *  configured contact email; the prototype synthesises one from the slug
 *  so mailto: still opens a coherent draft. */
function contactEmailFor(shopName: string): string {
  const slug = shopName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${slug}@muza.demo`
}

/**
 * The mock data doesn't carry unit prices — only a fulfillment subtotal.
 * For a believable detail page we synthesise a per-item line price by
 * distributing the (subtotal − assumed shipping) proportionally across
 * the items by quantity. Real backend data would carry `unitPrice` per
 * item; this is a stand-in so the breakdown numbers stay consistent.
 */
function deriveLinePrices(fulfillment: Fulfillment): {
  lines: Array<{ item: OrderItem; unit: number; lineTotal: number }>
  subtotal: number
  shipping: number
  tax: number
  total: number
} {
  const shipping = fulfillment.status === "payment_failed" ? 0
    : fulfillment.items.some(i => i.type !== "Other") ? 4 : 0
  const tax = 0
  const itemsTotal = Math.max(0, fulfillment.subtotal - shipping - tax)
  const totalQty = fulfillment.items.reduce((s, i) => s + i.quantity, 0)
  const perQty = totalQty > 0 ? itemsTotal / totalQty : 0
  const lines = fulfillment.items.map(item => {
    const unit = Math.round(perQty * 100) / 100
    return { item, unit, lineTotal: Math.round(unit * item.quantity * 100) / 100 }
  })
  return { lines, subtotal: itemsTotal, shipping, tax, total: fulfillment.subtotal }
}

// ─── Timeline ────────────────────────────────────────────────────────────────
//
// Same shape and visual treatment as the seller-side TimelineSection so the
// platform reads consistently regardless of which side of the marketplace
// you're on. Dots take a `kind` that colours them:
//   - warning → destructive (payment failed)
//   - success → green (delivered, refund issued)
//   - info    → muted foreground (placed, shipped, captured…)
// A 1px connector line runs between dots so events read as a chain.

interface TimelineEvent {
  at:     string  // ISO timestamp
  kind:   "info" | "success" | "warning"
  title:  string
  detail?: string
}

function buildTimeline(checkout: Checkout, fulfillment: Fulfillment): TimelineEvent[] {
  const base = new Date(checkout.date + "T10:00:00")
  const at = (days: number, hours = 0) => {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    d.setHours(d.getHours() + hours)
    return d.toISOString()
  }
  const s = fulfillment.status
  const events: TimelineEvent[] = []

  events.push({ at: at(0),    kind: "info",    title: "Order placed" })

  if (s === "payment_failed") {
    events.push({ at: at(0, 1), kind: "warning", title: "Payment failed", detail: "Card declined — update your payment method to retry." })
  } else {
    events.push({ at: at(0, 1), kind: "info", title: "Payment captured", detail: `${formatTotal(fulfillment.subtotal)} charged` })
  }

  if (s === "cancelled") {
    events.push({ at: at(1),  kind: "warning", title: "Order cancelled" })
  }
  if (s === "shipped" || s === "delivered") {
    const carrierLine = fulfillment.carrier && fulfillment.trackingNumber
      ? `${fulfillment.carrier} · ${fulfillment.trackingNumber}`
      : undefined
    events.push({ at: at(2),  kind: "info", title: "Shipped", detail: carrierLine })
  }
  if (s === "delivered") {
    events.push({ at: at(5),  kind: "success", title: "Delivered" })
  }
  if (s === "refunded") {
    events.push({ at: at(7),  kind: "success", title: "Refund issued", detail: `${formatTotal(fulfillment.subtotal)} returned to your card` })
  }

  return events
}

function formatTimelineAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function estimatedDelivery(checkout: Checkout, fulfillment: Fulfillment): string | null {
  if (fulfillment.status !== "shipped") return null
  const base = new Date(checkout.date)
  const lo = new Date(base); lo.setDate(lo.getDate() + 5)
  const hi = new Date(base); hi.setDate(hi.getDate() + 9)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(lo)} – ${fmt(hi)}`
}

// ─── PurchaseDetailView ──────────────────────────────────────────────────────

export function PurchaseDetailView({
  checkout, fulfillment, onBack,
}: {
  checkout:    Checkout
  fulfillment: Fulfillment
  onBack:      () => void
}) {
  const { add: toast } = useToast()
  const { lines, subtotal, shipping, tax, total } = deriveLinePrices(fulfillment)
  const eta = estimatedDelivery(checkout, fulfillment)

  // Locally-fired events that the synthesised status-derived timeline
  // doesn't know about (refund requests, future "contact seller" etc).
  // Kept as state on this view so submitting the refund form pushes a
  // new entry into the timeline immediately — the dot appears below the
  // form as soon as the toast fires.
  const [extraEvents, setExtraEvents] = useState<TimelineEvent[]>([])
  const timeline = [...buildTimeline(checkout, fulfillment), ...extraEvents]

  const placeholder = (title: string, description: string) =>
    toast({ type: "info", title, description } as never)

  const handleRefundRequest = (refundQty: number, reason: string) => {
    const totalQty = refundQty  // already summed in the form
    setExtraEvents(prev => [...prev, {
      at:    new Date().toISOString(),
      kind:  "info",
      title: "Refund requested",
      detail: `${totalQty} ${totalQty === 1 ? "item" : "items"}${reason ? ` · "${reason}"` : ""}`,
    }])
    toast({
      type: "info",
      title: `Refund requested · ${fulfillment.orderNumber}`,
      description: "Your request was sent to the seller for review.",
    } as never)
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* ── Back nav ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-10 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:underline underline-offset-4"
        >
          <ArrowLeft className="size-4" />
          Back to purchases
        </button>
      </div>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-10 pt-4 pb-6 border-b border-border/60">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xlarge font-medium tracking-tight tabular-nums">
                {fulfillment.orderNumber}
              </h1>
              <OrderStatusBadge status={fulfillment.status} />
            </div>
            <p className="text-small font-normal text-muted-foreground mt-1.5">
              Ordered {formatDate(checkout.date)}
              {" · "}
              <span className="text-foreground">{fulfillment.seller.name}</span>
              {" · "}
              <span className="tabular-nums">{formatTotal(fulfillment.subtotal)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* MVP: hand off to the buyer's mail client with a pre-filled
                 subject. In-platform messaging will replace this once
                 it's built; until then mailto keeps the path real.
                 The seller's address is faked from the shop name —
                 real wiring would read shop.contactEmail. */}
            <Button
              render={
                <a
                  href={`mailto:${contactEmailFor(fulfillment.seller.name)}?subject=${encodeURIComponent(`Question about order ${fulfillment.orderNumber}`)}`}
                />
              }
              variant="outline"
            >
              <MessageCircle className="size-4" />
              Contact seller
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body — two-column on desktop ─────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-12 gap-y-10">

          {/* ── LEFT: actionable surfaces ───────────────────────────── */}
          <div className="flex flex-col gap-10 min-w-0">
            <ItemsSection lines={lines} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />

            {(fulfillment.status === "shipped" || fulfillment.status === "delivered") && (
              <ShipmentSection fulfillment={fulfillment} eta={eta} />
            )}

            <TimelineSection events={timeline} />

            {(fulfillment.status === "delivered" || fulfillment.status === "shipped") && (
              <RefundFlow
                mode="request"
                items={fulfillment.items.map(it => ({
                  image:     it.image,
                  title:     it.productTitle,
                  unitPrice: 0,            // buyer doesn't dictate refund amount
                  quantity:  it.quantity,
                }))}
                onSubmit={({ totalQty, reason }) => handleRefundRequest(totalQty, reason)}
              />
            )}
          </div>

          {/* ── RIGHT: flat metadata (no cards) ─────────────────────── */}
          <aside className="flex flex-col gap-8 min-w-0 lg:sticky lg:top-8 self-start">
            <ShopMeta fulfillment={fulfillment} />
            <ShippingAddressMeta />
            <PaymentMeta checkout={checkout} fulfillment={fulfillment} />
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Items + money breakdown ────────────────────────────────────────
//
// Thin adapter over the shared ItemsSection. Subtitle = the format/type
// (Vinyl, Cassette…) since buyer-side OrderItem doesn't carry variant or
// SKU. Tax is omitted (always 0 in our mock — the component will hide
// the row automatically).

function ItemsSection({ lines, subtotal, shipping, tax, total }: {
  lines:    Array<{ item: OrderItem; unit: number; lineTotal: number }>
  subtotal: number
  shipping: number
  tax:      number
  total:    number
}) {
  return (
    <SharedItemsSection
      items={lines.map(({ item, unit }) => ({
        image:     item.image,
        title:     item.productTitle,
        subtitle:  item.type,
        unitPrice: unit,
        quantity:  item.quantity,
      }))}
      breakdown={{ subtotal, shipping, tax, total }}
    />
  )
}

// ─── Section: Shipment + tracking ────────────────────────────────────────────

function ShipmentSection({ fulfillment, eta }: {
  fulfillment: Fulfillment
  eta:         string | null
}) {
  const { carrier, trackingNumber, trackingUrl } = fulfillment
  return (
    <section>
      <h2 className="text-large font-medium mb-1">Shipment</h2>
      {eta && (
        <p className="inline-flex items-center gap-1.5 text-xsmall text-muted-foreground mb-4">
          <Truck className="size-3.5" />
          Estimated delivery {eta}
        </p>
      )}
      {!eta && <div className="mb-4" />}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <Meta label="Carrier" value={carrier ?? "—"} />
        <Meta
          label="Tracking number"
          value={
            trackingNumber
              ? trackingUrl
                ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground hover:underline underline-offset-3 tabular-nums"
                  >
                    {trackingNumber}
                    <ExternalLink className="size-3.5" />
                  </a>
                )
                : <span className="tabular-nums">{trackingNumber}</span>
              : "—"
          }
        />
      </dl>
    </section>
  )
}

// ─── Section: Timeline ───────────────────────────────────────────────────────
//
// Visual mirror of the seller-side TimelineSection. Dot column stretches the
// full row height (`items-stretch`) so the 1px connector below each dot
// reaches the next dot — events read as a single chain rather than detached
// bullets. Email/info events stay muted; only warnings and successes carry
// colour weight, so the eye lands on the moments that matter.

function TimelineSection({ events }: { events: TimelineEvent[] }) {
  const dotClass = (kind: TimelineEvent["kind"]) => cn(
    "shrink-0 size-2 rounded-full",
    kind === "warning" ? "bg-destructive" :
    kind === "success" ? "bg-green-600 dark:bg-green-400" :
                          "bg-foreground/40",
  )
  return (
    <section>
      <h2 className="text-large font-medium mb-4">Timeline</h2>
      <ol className="flex flex-col">
        {events.map((e, i) => {
          const isLast = i === events.length - 1
          return (
            <li key={i} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center shrink-0 pt-1">
                <span className={dotClass(e.kind)} />
                {!isLast && <span className="flex-1 w-px bg-border/60 mt-1" />}
              </div>
              <div className={cn("flex-1 min-w-0 flex flex-col gap-0.5", !isLast && "pb-4")}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-small leading-5 text-foreground truncate">{e.title}</p>
                  <span className="text-2xsmall text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatTimelineAt(e.at)}
                  </span>
                </div>
                {e.detail && <p className="text-xsmall text-muted-foreground">{e.detail}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ─── Right column: flat metadata sections (no card chrome) ───────────────────

function MetaHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xsmall font-medium text-foreground mb-2">{children}</h3>
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xsmall font-medium text-foreground">{label}</dt>
      <dd className="text-small text-foreground">{value}</dd>
    </div>
  )
}

function ShopMeta({ fulfillment }: { fulfillment: Fulfillment }) {
  return (
    <div>
      <MetaHeading>Seller</MetaHeading>
      <div className="flex items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={shopAvatarUrl(fulfillment.seller.name)} alt={fulfillment.seller.name} />
          <AvatarFallback className="text-2xsmall font-medium">
            {shopInitials(fulfillment.seller.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-small font-medium text-foreground truncate">{fulfillment.seller.name}</p>
          <p className="text-xsmall text-muted-foreground truncate">{fulfillment.seller.location}</p>
        </div>
      </div>
    </div>
  )
}

function ShippingAddressMeta() {
  // Placeholder — real wiring would read the buyer's saved address.
  return (
    <div>
      <MetaHeading>Shipping address</MetaHeading>
      <address className="not-italic text-small text-foreground leading-relaxed">
        Nathaniel Hart<br />
        221 Bedford Avenue, Apt 4C<br />
        Brooklyn, NY 11211<br />
        United States
      </address>
    </div>
  )
}

function PaymentMeta({ checkout, fulfillment }: { checkout: Checkout; fulfillment: Fulfillment }) {
  const failed = fulfillment.status === "payment_failed"
  return (
    <div>
      <MetaHeading>Payment</MetaHeading>
      <p className="text-small text-foreground">
        Visa <span className="tabular-nums">•••• 4242</span>
      </p>
      <p className="text-xsmall text-muted-foreground mt-1">
        {failed
          ? "Last attempt failed — update your payment method."
          : <>Charged {formatDate(checkout.date)}</>}
      </p>
    </div>
  )
}
