"use client"

/*
 * OrderDetailView — full-page route for a single order.
 *
 * Layout follows Shopify / Stripe convention:
 *   · Sticky top bar (back · #number · status badges · prev/next · actions)
 *   · Optional banners (pre-order, capture-failed, refund summary)
 *   · Two-column body on desktop (left wide: items / fulfillment / timeline,
 *     right narrow: customer / addresses / notes); single column on mobile.
 *   · Inline refund flow expands within the page (no nested modal).
 *
 * Mock data is synthesized deterministically per `Order` so the screen feels
 * lived-in without bloating the orders-view fixtures.
 */

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft, ChevronLeft, ChevronRight, Copy, ExternalLink, Mail, Send,
  Truck, RotateCcw, Clock, CheckCircle2, CreditCard,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/lib/use-media-query"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  Order, OrderStatus, OrderStatusBadge, formatDate, formatTotal, STATUS_CONFIG,
} from "@/components/app/orders-view"
import { Section } from "@/components/app/section"
import { ItemsSection as SharedItemsSection } from "@/components/app/items-section"
import { RefundFlow as SharedRefundFlow } from "@/components/app/refund-flow"
import { ReceiptPreview, type ReceiptData } from "@/components/app/receipt-preview"
import {
  getEmailForTransition, getEmailMeta, getRelevantEmails, initializeEmailLog,
  DEFAULT_TEMPLATES,
  type OrderEmailLog, type OrderEmailType,
} from "@/lib/order-emails"

const STATUS_LABEL_FOR = (s: OrderStatus) => STATUS_CONFIG[s].label

// ─── Synthesized detail (mock) ────────────────────────────────────────────────

interface OrderDetail {
  // Money
  subtotal:    number
  discount:    number
  discountCode?: string
  shippingFee: number
  tax:         number
  taxLabel:    string
  total:       number
  // Customer
  email:        string
  phone?:       string
  lifetimeOrders: number
  lifetimeSpend:  number
  // Addresses
  shipping: Address
  billing:  Address
  billingSameAsShipping: boolean
  // Notes
  customerNote?: string
  // Items (extends OrderItem with money)
  items: DetailItem[]
  // Fulfillment
  carrier?:       string
  trackingNumber?: string
  // Payment
  paymentMethod: string
  paymentBrand:  string
  // Pre-order
  isPreorder:    boolean
  releaseDate?:  string
  preorderState?: "authorized" | "captured" | "capture_failed"
  // Refund
  refundedAmount: number
  // Timeline
  timeline: TimelineEvent[]
}

interface Address {
  name: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
}

interface DetailItem {
  productTitle: string
  variant?:     string
  sku:          string
  image:        string
  quantity:     number
  unitPrice:    number
  refundedQty?: number
}

interface TimelineEvent {
  at:       string  // ISO
  kind:     "system" | "email" | "warning" | "success" | "info"
  title:    string
  detail?:  string
}

// Deterministic int from a string (good enough for stable mocks)
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const COUNTRY_LINE: Record<string, { line1: string; postal: string }> = {
  DK: { line1: "Aalborgsgade 4, 3rd",  postal: "2100" },
  UK: { line1: "12 Cromwell Mews",     postal: "SW7 2QL" },
  FR: { line1: "8 Rue Saint-Antoine",  postal: "75004" },
  ES: { line1: "Calle Gran Vía 41",    postal: "28013" },
  NO: { line1: "Bogstadveien 27",      postal: "0355" },
  GH: { line1: "12 Independence Ave",  postal: "GA-053" },
  CZ: { line1: "Vinohradská 18",       postal: "120 00" },
  NG: { line1: "5B Adeola Odeku",      postal: "101241" },
  JP: { line1: "2-1 Shibuya",          postal: "150-0002" },
  DE: { line1: "Torstraße 90",         postal: "10119" },
  IE: { line1: "12 Grafton Street",    postal: "D02 XR67" },
  AR: { line1: "Av. Corrientes 348",   postal: "C1043" },
  SN: { line1: "Plateau, 12 Rue Wagne",postal: "10200" },
  IN: { line1: "Hill Road 22",         postal: "400050" },
  PL: { line1: "Krakowskie 7",         postal: "00-068" },
  BR: { line1: "Av. Paulista 1230",    postal: "01310-100" },
  SE: { line1: "Drottninggatan 71",    postal: "111 36" },
  TW: { line1: "Section 4, Xinyi Rd",  postal: "110" },
  RU: { line1: "Tverskaya 12",         postal: "125009" },
  MX: { line1: "Av. Reforma 222",      postal: "06600" },
  TR: { line1: "İstiklal Caddesi 18",  postal: "34430" },
  IT: { line1: "Via della Spiga 31",   postal: "20121" },
  GN: { line1: "Avenue de la République 4", postal: "BP 1001" },
  US: { line1: "245 Bedford Ave",      postal: "11211" },
}

function deriveCountryCode(location: string): string {
  const m = location.match(/, ([A-Z]{2})$/)
  return m ? m[1] : "US"
}

/**
 * Build a fully fleshed-out OrderDetail from a stub `Order` + its current
 * status. Pure function; deterministic per id so mock data is stable.
 */
export function getOrderDetail(order: Order, status: OrderStatus): OrderDetail {
  const h          = hash(order.id)
  const country    = deriveCountryCode(order.customer.location)
  const city       = order.customer.location.split(",")[0]
  const addr       = COUNTRY_LINE[country] ?? COUNTRY_LINE.US

  // Money — derive a credible breakdown from the existing total
  const subtotal    = order.items.reduce((s, i) => s + i.quantity * mockUnitPrice(i.productTitle, i.type, h), 0)
  const hasDiscount = h % 4 === 0
  const discount    = hasDiscount ? Math.round(subtotal * 0.10) : 0
  const shippingFee = h % 5 === 0 ? 0 : Math.max(4, Math.round(subtotal * 0.08))
  const taxRate     = country === "DE" ? 0.19 : country === "UK" ? 0.20 : country === "JP" ? 0.10 : 0.08
  const tax         = Math.round((subtotal - discount + shippingFee) * taxRate * 100) / 100
  const total       = Math.round((subtotal - discount + shippingFee + tax) * 100) / 100

  const items: DetailItem[] = order.items.map((i, idx) => ({
    productTitle: i.productTitle,
    variant:      mockVariant(i.type, h + idx),
    sku:          mockSku(i.productTitle, i.type),
    image:        i.image,
    quantity:     i.quantity,
    unitPrice:    mockUnitPrice(i.productTitle, i.type, h),
  }))

  // Pre-orders: ~20% of orders get marked as pre-orders. Whether the
  // payment captured successfully (or failed) is now expressed via the
  // top-level `status` field — `payment_failed` covers former
  // "capture_failed" cases, "new" covers former "captured". The only
  // remaining sub-state we still need is `authorized` (pre-order awaiting
  // capture), since that affects whether the order can be shipped yet.
  const isPreorder = h % 5 === 0
    && status !== "delivered" && status !== "refunded" && status !== "cancelled"
  const preorderState: OrderDetail["preorderState"] =
    isPreorder && status === "new" ? "authorized" : undefined
  const releaseDateOffset = (h % 30) - 5  // some past, some future
  const releaseDate = isPreorder
    ? new Date(new Date(order.date).getTime() + releaseDateOffset * 86_400_000).toISOString().slice(0, 10)
    : undefined

  // Refund state
  const refundedAmount = status === "refunded" ? total : 0

  // Timeline
  const timeline: TimelineEvent[] = []
  const orderDate = new Date(order.date)
  timeline.push({
    at: orderDate.toISOString(),
    kind: "info",
    title: "Order placed",
    detail: `${order.customer.name} from ${order.customer.location}`,
  })
  if (isPreorder) {
    timeline.push({
      at: orderDate.toISOString(),
      kind: "system",
      title: `Authorization placed via pay.com — ${formatTotal(total)}`,
      detail: `Will capture on release date${releaseDate ? ` (${formatDate(releaseDate)})` : ""}`,
    })
  } else if (status !== "payment_failed") {
    timeline.push({
      at: orderDate.toISOString(),
      kind: "success",
      title: `Payment captured via pay.com — ${formatTotal(total)}`,
      detail: `Visa **** ${(h % 9000) + 1000} → Muza wallet`,
    })
  }
  if (status === "payment_failed") {
    timeline.push({
      at: addDays(orderDate, isPreorder ? 14 : 0).toISOString(),
      kind: "warning",
      title: `${isPreorder ? "Capture" : "Payment"} failed — card declined`,
      detail: "pay.com returned card_declined. Awaiting updated payment method from buyer.",
    })
  }
  timeline.push({
    at: addMinutes(orderDate, 2).toISOString(),
    kind: "email",
    title: "Confirmation email sent",
    detail: `${order.customer.name.split(" ")[0].toLowerCase()}@example.com`,
  })
  if (status === "shipped" || status === "delivered") {
    timeline.push({
      at: addDays(orderDate, 1).toISOString(),
      kind: "system",
      title: "Marked as shipped",
      detail: `DHL · ${mockTracking(order.id)}`,
    })
    timeline.push({
      at: addDays(orderDate, 1).toISOString(),
      kind: "email",
      title: "Shipping notification sent",
    })
  }
  if (status === "delivered") {
    timeline.push({
      at: addDays(orderDate, 4).toISOString(),
      kind: "success",
      title: "Delivered",
      detail: "Confirmed by carrier",
    })
  }
  if (status === "cancelled") {
    timeline.push({
      at: addDays(orderDate, 1).toISOString(),
      kind: "warning",
      title: "Order cancelled",
      detail: "By seller — out of stock",
    })
  }
  if (status === "refunded") {
    timeline.push({
      at: addDays(orderDate, 7).toISOString(),
      kind: "warning",
      title: `Refunded — ${formatTotal(total)}`,
      detail: "Issued to original payment method",
    })
  }

  return {
    subtotal, discount, discountCode: hasDiscount ? "NEWFAN10" : undefined,
    shippingFee, tax, taxLabel: `${Math.round(taxRate * 100)}% ${country} VAT`,
    total,
    email: `${order.customer.name.split(" ")[0].toLowerCase()}.${order.customer.name.split(" ").slice(-1)[0].toLowerCase()}@example.com`.replace(/[^a-z0-9.@]/g, ""),
    phone: h % 3 === 0 ? `+${(h % 80) + 1} ${(h % 9000) + 1000} ${(h % 9000) + 1000}` : undefined,
    lifetimeOrders: 1 + (h % 6),
    lifetimeSpend:  total + (h % 200),
    shipping: { name: order.customer.name, line1: addr.line1, city, postalCode: addr.postal, country },
    billing:  { name: order.customer.name, line1: addr.line1, city, postalCode: addr.postal, country },
    billingSameAsShipping: true,
    customerNote: h % 6 === 0 ? "Please ship the LP flat — no roll/tube. Thanks!" : undefined,
    items,
    carrier: status === "shipped" || status === "delivered" ? "DHL" : undefined,
    trackingNumber: status === "shipped" || status === "delivered" ? mockTracking(order.id) : undefined,
    paymentMethod: "Visa",
    paymentBrand:  `**** ${(h % 9000) + 1000}`,
    isPreorder, releaseDate, preorderState,
    refundedAmount,
    timeline: timeline.sort((a, b) => b.at.localeCompare(a.at)),
  }
}

function mockUnitPrice(title: string, type: string, seed: number): number {
  const base = type === "Vinyl"  ? 28
            : type === "CD"      ? 16
            : type === "Cassette"? 14
            : type === "Apparel" ? 32
            :                       12
  return base + (seed % 10) - 5
}
function mockVariant(type: string, seed: number): string | undefined {
  if (type === "Apparel") return ["XS", "S", "M", "L", "XL"][seed % 5]
  if (type === "Vinyl")   return seed % 2 === 0 ? "Black 180g" : "Translucent blue"
  return undefined
}
function mockSku(title: string, type: string): string {
  const slug = title.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()
  return `${type.slice(0, 3).toUpperCase()}-${slug}`
}
function mockTracking(id: string): string {
  return `1${(hash(id) % 9_000_000_000 + 1_000_000_000)}`
}
function addDays(d: Date, n: number): Date { return new Date(d.getTime() + n * 86_400_000) }
function addMinutes(d: Date, n: number): Date { return new Date(d.getTime() + n * 60_000) }

// ─── Top bar / banners ────────────────────────────────────────────────────────

// ─── Header alert rows ────────────────────────────────────────────────────────
//
// Banners render *inside* the page header (not as cards in the body) — they're
// state info about the order, so they belong with the order number + status
// badges. No border/radius — they read as a continuation of the header strip,
// separated by a top border.

function AlertRow({
  tone = "neutral", icon, title, detail, actions,
}: {
  tone?: "neutral" | "destructive"
  icon: React.ReactNode
  title: React.ReactNode
  detail: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <span className="shrink-0 self-start mt-[3px]">{icon}</span>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <p className={cn(
          "text-xsmall leading-5",
          tone === "destructive" ? "text-destructive font-medium" : "text-foreground",
        )}>
          {title}
          <span className="text-muted-foreground font-normal"> · {detail}</span>
        </p>
        {actions && <div className="flex items-center gap-2 mt-1">{actions}</div>}
      </div>
    </div>
  )
}

function HeaderAlerts({ d, status, orderNumber, total }: {
  d: OrderDetail
  status: OrderStatus
  orderNumber: string
  total: number
}) {
  const { add } = useToast()
  // For payment_failed, the deep-red status badge already says "look at this"
  // and the timeline carries the prose. Header hosts only the recovery
  // action — re-attempting the existing pay.com authorization. Reaching out
  // to the customer happens via the email shown in the right-hand metadata
  // column (we don't have an internal messaging system to wrap).
  if (status === "payment_failed") {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => add({
            title: "Retrying capture via pay.com…",
            description: `${orderNumber} · ${formatTotal(total)}`,
            type: "loading",
          })}
        >
          <RotateCcw className="size-3.5" />
          Retry capture
        </Button>
      </div>
    )
  }
  return (
    <>
      {d.isPreorder && d.preorderState === "authorized" && (
        <AlertRow
          icon={<Clock className="size-4 text-muted-foreground" />}
          title="Pre-order — charges on release"
          detail={`Authorized. Captures on ${d.releaseDate ? formatDate(d.releaseDate) : "release date"}.`}
        />
      )}
      {d.refundedAmount > 0 && (
        <AlertRow
          icon={<RotateCcw className="size-4 text-muted-foreground" />}
          title={`Refunded — ${formatTotal(d.refundedAmount)}`}
          detail="Issued to the original payment method."
        />
      )}
    </>
  )
}

// `Section` is now imported from "@/components/app/section" — the
// primitive is shared with the buyer-side detail page (and the new
// `ItemsSection` shared module) so both halves of the marketplace use
// the same chrome rules.

// ─── Items section ────────────────────────────────────────────────────────────
//
// Thin adapter — maps the seller's OrderDetail shape onto the shared
// ItemsSection. Subtitle = variant, meta = SKU. Tax label flows through
// as "Tax · {label}" so the existing "8% FR VAT" treatment is preserved.

function ItemsSection({ d }: { d: OrderDetail }) {
  return (
    <SharedItemsSection
      items={d.items.map(item => ({
        image:     item.image,
        title:     item.productTitle,
        subtitle:  item.variant,
        meta:      `SKU · ${item.sku}`,
        unitPrice: item.unitPrice,
        quantity:  item.quantity,
      }))}
      breakdown={{
        subtotal:     d.subtotal,
        discount:     d.discount,
        discountCode: d.discountCode,
        shipping:     d.shippingFee,
        tax:          d.tax,
        taxLabel:     d.taxLabel,
        total:        d.total,
      }}
    />
  )
}

// ─── Fulfillment ──────────────────────────────────────────────────────────────

function FulfillmentSection({ d, status, onStatusChange }: {
  d: OrderDetail
  status: OrderStatus
  onStatusChange: (s: OrderStatus) => void
}) {
  const [carrier,  setCarrier]  = useState(d.carrier ?? "")
  const [tracking, setTracking] = useState(d.trackingNumber ?? "")
  const { add } = useToast()

  const trackingUrl = trackingUrlFor(carrier, tracking)

  // The button only ever represents the *next forward action* — one button,
  // one direction, no inline undo. Reverts are handled by:
  //   · Toast undo (immediate — fires on every status change)
  //   · The interactive status badge in the header (anytime)
  // This matches Shopify / Etsy / Linear / Gmail patterns.
  const awaitingCapture = d.preorderState === "authorized" && status === "new"

  function transition(to: OrderStatus, label: string) {
    const from = status
    onStatusChange(to)
    add({
      type: "success",
      title: label,
      data: { actionLabel: "Undo", onAction: () => onStatusChange(from) },
    } as never)
  }

  // The forward-action button now sits on the same row as the carrier
  // and tracking inputs (matching their h-10 default), filled with the
  // secondary variant so it reads as a peer to the form controls rather
  // than a header-level promotion. Pre-capture orders show an inline
  // explainer in the same slot — same visual rhythm, no shifted layout.
  const forwardAction = awaitingCapture ? (
    <span className="h-10 inline-flex items-center text-xsmall text-muted-foreground">
      Awaiting capture — can't ship yet
    </span>
  ) : status === "new" ? (
    <Button variant="secondary" onClick={() => transition("shipped", "Marked as shipped")}>
      <Truck className="size-4" />
      Mark as shipped
    </Button>
  ) : status === "shipped" ? (
    <Button variant="secondary" onClick={() => transition("delivered", "Marked as delivered")}>
      <CheckCircle2 className="size-4" />
      Mark as delivered
    </Button>
  ) : null

  return (
    <Section title="Fulfillment">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div className="flex flex-col gap-2 min-w-0">
          <Label>Carrier</Label>
          <Select value={carrier} onValueChange={(v) => setCarrier(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DHL">DHL</SelectItem>
              <SelectItem value="UPS">UPS</SelectItem>
              <SelectItem value="USPS">USPS</SelectItem>
              <SelectItem value="FedEx">FedEx</SelectItem>
              <SelectItem value="Royal Mail">Royal Mail</SelectItem>
              <SelectItem value="Deutsche Post">Deutsche Post</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <Label>Tracking number</Label>
          <Input
            placeholder="e.g. 1Z999AA10123456784"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
        </div>
        {forwardAction}
      </div>

      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xsmall text-primary hover:underline underline-offset-3"
        >
          Track on {carrier}
          <ExternalLink className="size-3" />
        </a>
      )}
    </Section>
  )
}

function trackingUrlFor(carrier: string, tracking: string): string | null {
  if (!carrier || !tracking) return null
  switch (carrier) {
    case "DHL":           return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`
    case "UPS":           return `https://www.ups.com/track?tracknum=${tracking}`
    case "USPS":          return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`
    case "FedEx":         return `https://www.fedex.com/fedextrack/?tracknumbers=${tracking}`
    case "Royal Mail":    return `https://www.royalmail.com/track-your-item#/tracking-results/${tracking}`
    case "Deutsche Post": return `https://www.deutschepost.de/sendung/simpleQuery.html?form.sendungsnummer=${tracking}`
    default: return null
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineSection({ d }: { d: OrderDetail }) {
  // Dot column stretches the full row height so the connector line below
  // the dot reaches the next dot — events read as a chain, not detached
  // bullets. Email events use a softer foreground tone (not bright blue)
  // so warnings and successes carry the colour weight in the timeline.
  const dotClass = (kind: TimelineEvent["kind"]) => cn(
    "shrink-0 size-2 rounded-full",
    kind === "warning" ? "bg-destructive" :
    kind === "success" ? "bg-green-600 dark:bg-green-400" :
                          "bg-foreground/40",
  )

  return (
    <Section title="Timeline">
      <ol className="flex flex-col">
        {d.timeline.map((e, i) => {
          const isLast = i === d.timeline.length - 1
          return (
            <li key={i} className="flex items-stretch gap-3">
              {/* Dot + connector — shrink-0 column stretched by `items-stretch`
                   on the parent so the connector spans to the next row. */}
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
    </Section>
  )
}

function formatTimelineAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

// ─── Buyer communications ─────────────────────────────────────────────────────
//
// Per-order email queue. Every email Muza would send for this order shows up
// here as a row with current status (sent / queued / skipped). Artist-
// triggered emails (shipping notification, refund issued, cancellation) are
// queued — never auto-sent — so the artist explicitly composes and reviews
// every customer-facing message.
//
// System-required emails (order confirmation, payment failed) are pre-sent
// in the seed log. Artists can re-send any past email via the same composer.

function BuyerCommunicationsSection({
  d, status, log, onCompose,
}: {
  d:       OrderDetail
  status:  OrderStatus
  log:     OrderEmailLog
  onCompose: (type: OrderEmailType) => void
}) {
  const types = getRelevantEmails(status, d.preorderState)
  if (types.length === 0) return null

  return (
    <Section title="Buyer communications">
      <div className="flex flex-col divide-y divide-border/60">
        {types.map(type => (
          <CommsRow
            key={type}
            type={type}
            record={log[type]}
            onCompose={() => onCompose(type)}
          />
        ))}
      </div>
    </Section>
  )
}

function CommsRow({
  type, record, onCompose,
}: {
  type:     OrderEmailType
  record?:  OrderEmailLog[OrderEmailType]
  onCompose: () => void
}) {
  const meta   = getEmailMeta(type)
  const isSent = record?.status === "sent"
  // Strip "sent" / "ready" prefixes from the row label so it reads tighter
  // — e.g. "Shipping notification sent" → "Shipping notification".
  const label  = meta.timelineTitle
    .replace(/ (email )?sent$/i, "")
    .replace(/^Pre-order /, "Pre-order ")

  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      {/* Icon + title share one flex row so `items-center` lines the icon
           to the title's optical midline. The subline drops below in a
           sibling row, indented to the title column so it doesn't slip
           back under the icon. */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Mail className="size-4 text-muted-foreground shrink-0" />
          <p className="text-small text-foreground leading-snug truncate">{label}</p>
        </div>
        <p className="text-2xsmall text-muted-foreground tabular-nums mt-0.5 ml-7">
          {isSent
            ? `Sent ${formatTimelineAt(record!.sentAt!)}`
            : "Ready to send"}
        </p>
      </div>
      {isSent ? (
        <Button variant="ghost" size="sm" onClick={onCompose}>
          Resend
        </Button>
      ) : (
        <Button size="sm" onClick={onCompose}>
          <Send className="size-3.5" />
          Compose & send
        </Button>
      )}
    </div>
  )
}

// ─── Receipt data builder ────────────────────────────────────────────────────
//
// Maps the seller-side OrderDetail onto the buyer-facing ReceiptData
// shape. Kept as a separate function so the receipt renderer stays
// data-shape-agnostic (one day buyer + seller sides could share it).

function buildReceiptData(order: Order, detail: OrderDetail): ReceiptData {
  return {
    orderNumber:    order.number,
    orderDate:      order.date,
    shopName:       "Sun Ra Estate",  // TODO: thread real seller name through OrderDetail
    buyerName:      order.customer.name,
    buyerEmail:     detail.email,
    items: detail.items.map(i => ({
      productTitle: i.productTitle,
      variant:      i.variant,
      quantity:     i.quantity,
      unitPrice:    i.unitPrice,
    })),
    subtotal:       detail.subtotal,
    discount:       detail.discount,
    discountCode:   detail.discountCode,
    shippingFee:    detail.shippingFee,
    tax:            detail.tax,
    taxLabel:       detail.taxLabel,
    total:          detail.total,
    shipping:       detail.shipping,
    billing:        detail.billing,
    billingSameAsShipping: detail.billingSameAsShipping,
  }
}

// ─── Compose email dialog ─────────────────────────────────────────────────────
//
// Opens when the artist clicks Compose & send (or Resend) on a row. Shows
// the subject (locked — system-defined per template), the editable personal
// message (loaded from the shop's saved template, can be overridden for this
// one buyer), and a non-editable preview of the system-rendered receipt
// block that auto-renders below the message.

function ComposeEmailDialog({
  type, order, detail, log, open, onOpenChange, onSend,
}: {
  type:    OrderEmailType | null
  order:   Order
  detail:  OrderDetail
  log:     OrderEmailLog
  open:    boolean
  onOpenChange: (v: boolean) => void
  onSend:  (type: OrderEmailType, personalMessage: string) => void
}) {
  // Lock in the type while open so editing the textarea doesn't redraw
  // when the parent's `composeType` is briefly null between transitions.
  const activeType = type
  const meta = activeType ? getEmailMeta(activeType) : null

  // Pre-fill from a previous send (resend case) or the shop default.
  const initialMessage =
    activeType
      ? (log[activeType]?.personalMessage ?? DEFAULT_TEMPLATES[activeType])
      : ""
  const [message, setMessage] = useState(initialMessage)

  // Reset the textarea when the active email type changes (e.g. user closes
  // the dialog and re-opens it for a different row).
  useEffect(() => { setMessage(initialMessage) }, [initialMessage])

  if (!activeType || !meta) return null

  const isResend = log[activeType]?.status === "sent"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{isResend ? "Resend" : "Send"}: {meta.timelineTitle.replace(/ sent$/i, "")}</DialogTitle>
          <DialogDescription>
            To <span className="text-foreground">{detail.email}</span> ·{" "}
            {order.customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Subject — locked */}
          <div className="flex flex-col gap-1.5">
            <Label>Subject</Label>
            <div className="rounded-full border border-border bg-muted/40 px-4 h-10 flex items-center text-small text-foreground">
              {meta.subject(order.number)}
            </div>
          </div>

          {/* Personal message — editable */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            hint="Loaded from your shop template. Edit for this order if you want to add a personal note."
          />

          {/* System content preview — non-editable. For order
               confirmations we render the FULL receipt block in
               Muza's name (marketplace-facilitator model): itemised
               breakdown + buyer & shipping details + Muza legal
               footer. Other email types stay a compact placeholder —
               their system blocks are tracking links / refund details
               which we'll wire as the templates mature. */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground">System content (auto)</Label>
            {activeType === "order_confirmation" ? (
              <ReceiptPreview data={buildReceiptData(order, detail)} />
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xsmall text-muted-foreground">
                Renders below your message: order number ({order.number}), items
                ({detail.items.length}), total ({formatTotal(detail.total)}),
                shipping address
                {detail.trackingNumber ? `, ${detail.carrier} tracking link` : ""}.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!message.trim()}
            onClick={() => {
              onSend(activeType, message.trim())
              onOpenChange(false)
            }}
          >
            <Send className="size-4" />
            {isResend ? "Resend" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Customer / addresses / notes ─────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="text-muted-foreground hover:text-foreground transition-[colors,opacity] opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={`Copy ${value}`}
    >
      {copied ? <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" /> : <Copy className="size-3.5" />}
    </button>
  )
}

// ─── Right-column flat sections ───────────────────────────────────────────────
//
// The right column is metadata, not actions — boxes everywhere felt heavy.
// Each block is a small uppercase-style label + content underneath, no border,
// no fill. Spacing between blocks does the visual separation.

function MetaLabel({ children, action }: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <h3 className="text-xsmall font-medium text-foreground">
        {children}
      </h3>
      {action}
    </div>
  )
}

function CustomerSection({ d, order, status }: {
  d: OrderDetail
  order: Order
  status: OrderStatus
}) {
  // Resend now lives in the Buyer Communications section on the left
  // column — consistent home for every outgoing email instead of a stray
  // link buried in the customer block.
  return (
    <div>
      <MetaLabel>Customer</MetaLabel>
      <p className="text-small text-foreground">{order.customer.name}</p>
      <p className="text-xsmall text-muted-foreground mt-0.5">
        {d.lifetimeOrders === 1
          ? "First-time customer"
          : `${ordinal(d.lifetimeOrders)} order · ${formatTotal(d.lifetimeSpend)} lifetime`}
      </p>
      <div className="mt-2 flex flex-col gap-0.5 -mx-2.5">
        <div className="group flex items-center gap-2 min-w-0 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors">
          <Mail className="size-3.5 text-muted-foreground shrink-0" />
          <a href={`mailto:${d.email}`} className="text-xsmall text-foreground hover:underline truncate">
            {d.email}
          </a>
          <span className="ml-auto pl-2">
            <CopyButton value={d.email} />
          </span>
        </div>
        {d.phone && (
          <div className="group flex items-center gap-2 min-w-0 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors">
            <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xsmall text-foreground truncate">{d.phone}</span>
            <span className="ml-auto pl-2">
              <CopyButton value={d.phone} />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function AddressSection({ title, address, sameAsShipping }: {
  title: string
  address: Address
  sameAsShipping?: boolean
}) {
  if (sameAsShipping) {
    return (
      <div>
        <MetaLabel>{title}</MetaLabel>
        <p className="text-xsmall text-muted-foreground">Same as shipping address</p>
      </div>
    )
  }
  const lines = [
    address.name,
    address.line1,
    address.line2,
    `${address.postalCode} ${address.city}`,
    address.country,
  ].filter(Boolean) as string[]
  return (
    <div>
      <MetaLabel>{title}</MetaLabel>
      <div className="group relative -mx-2.5 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors">
        <address className="not-italic flex flex-col text-xsmall leading-5 pr-6">
          {lines.map((line, i) => (
            <span key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
              {line}
            </span>
          ))}
        </address>
        <span className="absolute top-2 right-2.5">
          <CopyButton value={lines.join("\n")} />
        </span>
      </div>
    </div>
  )
}

function NotesSection({ d, internalNote, setInternalNote }: {
  d: OrderDetail
  internalNote: string
  setInternalNote: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <MetaLabel>Customer note</MetaLabel>
        {d.customerNote ? (
          <p className="text-xsmall text-foreground italic leading-5 text-pretty">"{d.customerNote}"</p>
        ) : (
          <p className="text-xsmall text-muted-foreground">None.</p>
        )}
      </div>
      <div>
        <MetaLabel>Internal note</MetaLabel>
        <Textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Only you see this…"
          rows={3}
        />
      </div>
    </div>
  )
}

function PaymentSection({ d, status }: { d: OrderDetail; status: OrderStatus }) {
  return (
    <div>
      <MetaLabel>Payment</MetaLabel>
      <div className="flex items-center gap-2">
        <CreditCard className="size-3.5 text-muted-foreground" />
        <span className="text-xsmall text-foreground">{d.paymentMethod}</span>
        <span className="text-xsmall text-muted-foreground tabular-nums">{d.paymentBrand}</span>
      </div>
      <p className="text-2xsmall text-muted-foreground mt-1">
        {status === "payment_failed"
          ? "Processed via pay.com — capture failed."
          : status === "new" && d.preorderState === "authorized"
          ? "Authorized via pay.com — captures on release."
          : status === "refunded"
          ? "Refund issued via pay.com to the original card."
          : "Captured via pay.com → your Muza wallet."}
      </p>
      {d.refundedAmount > 0 && (
        <p className="text-xsmall text-muted-foreground mt-1">
          Refunded {formatTotal(d.refundedAmount)} of {formatTotal(d.total)}
        </p>
      )}
    </div>
  )
}

// ─── Refund flow (inline) ─────────────────────────────────────────────────────
//
// Thin adapter over the shared RefundFlow. Maps OrderDetail items onto the
// normalized shape; the platform component handles steppers, checkbox,
// reason field, and the live refund-amount preview.

function RefundFlow({ d, onRefund }: {
  d: OrderDetail
  onRefund: () => void
}) {
  return (
    <SharedRefundFlow
      mode="issue"
      items={d.items.map(item => ({
        image:       item.image,
        title:       item.productTitle,
        unitPrice:   item.unitPrice,
        quantity:    item.quantity,
        refundedQty: item.refundedQty,
      }))}
      shippingFee={d.shippingFee}
      onSubmit={() => onRefund()}
    />
  )
}

// ─── OrderDetailView (root) ───────────────────────────────────────────────────

interface OrderDetailViewProps {
  order:    Order
  status:   OrderStatus
  onBack:   () => void
  onPrev:   (() => void) | null
  onNext:   (() => void) | null
  onStatusChange: (s: OrderStatus) => void
}

export function OrderDetailView({
  order, status, onBack, onPrev, onNext, onStatusChange,
}: OrderDetailViewProps) {
  const isMobile = useIsMobile()
  const detail   = useMemo(() => getOrderDetail(order, status), [order, status])
  const [internalNote, setInternalNote] = useState("")
  const toast    = useToast()

  // ── Email log — per-order record of which buyer emails have been sent or
  // still need composing. Initialized once from the order's current state
  // (past emails assumed already sent). Status changes during this session
  // append `queued` entries that the artist must explicitly compose & send
  // from the Buyer Communications section.
  const [emailLog, setEmailLog] = useState<OrderEmailLog>(
    () => initializeEmailLog(status, order.date, detail.preorderState),
  )
  const [composeType, setComposeType] = useState<OrderEmailType | null>(null)

  // Wrap onStatusChange so the underlying state mutation is silent on the
  // buyer side, but a `queued` email entry is appended for the artist to
  // act on. Every status-change call-site routes through this.
  const onTransition = (next: OrderStatus) => {
    if (next === status) return
    const email = getEmailForTransition(status, next)
    onStatusChange(next)
    if (email) {
      setEmailLog(prev => ({
        ...prev,
        [email.type]: { type: email.type, status: "queued" },
      }))
    }
  }

  function markSent(type: OrderEmailType, personalMessage?: string) {
    setEmailLog(prev => ({
      ...prev,
      [type]: {
        type,
        status:  "sent",
        sentAt:  new Date().toISOString(),
        personalMessage,
      },
    }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header — order identity + status + inline alerts ─────────────
           Layout: back button absolutely positioned in the left gutter on
           desktop; the rest of the header is a single flex column. The TOP
           row contains [title · status · spacer · prev/next] all aligned
           via `items-center`, so chevrons and the H1 share a visual
           baseline. The meta line and any inline alerts stack below. On
           mobile the back button folds back into the flex flow. */}
      <div className="shrink-0 border-b border-border px-4 md:pl-16 md:pr-4 pt-6 md:pt-8 pb-5 md:pb-6">
        <div className="flex flex-col gap-2">
          {/* Single-line title row: H1 · inline meta · status badge · spacer
               · prev/next. `items-center` aligns mixed sizes (H1 30px,
               meta 16px, badge 14px, buttons 32px) by vertical centre so
               the row reads as one composition. Wraps on narrow widths.
               The back button is absolute-positioned relative to *this row*
               so its vertical center always tracks the row's center, no
               magic numbers needed. */}
          <div className="relative flex items-center gap-3 flex-wrap md:pl-0 pl-9">
            {/* Wrapper absorbs the centering transform (translate-y-1/2)
                 so the button's own `active:translate-y-px` press-state
                 doesn't fight with it — clean click feedback, no jump. */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 md:left-[-52px]">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                aria-label="Back to orders"
              >
                <ArrowLeft className="size-4" />
              </Button>
            </div>
            <h1 className="text-xlarge font-medium text-foreground tabular-nums">{order.number}</h1>
            <span className="text-xsmall text-muted-foreground">
              {order.customer.name} · {formatDate(order.date)} · <span className="tabular-nums">{formatTotal(detail.total)}</span>
            </span>
            {/* Interactive status badge — click to change between any of the
                 sensible transitions for this order. Toast fires on every
                 change as confirmation. */}
            <OrderStatusBadge
              status={status}
              onStatusChange={(next) => {
                if (next === status) return
                // The wrapped transition also dispatches the buyer email
                // for this status change (toast + simulated send).
                onTransition(next)
                toast.add({
                  type: "success",
                  title: `Set to ${STATUS_LABEL_FOR(next)}`,
                  description: "Click the status again to change it back.",
                } as never)
              }}
            />
            <div className="flex-1" />
            {!isMobile && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPrev ?? undefined}
                  disabled={!onPrev}
                  aria-label="Previous order"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onNext ?? undefined}
                  disabled={!onNext}
                  aria-label="Next order"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
          {/* Inline alerts (pre-order pending, refunded summary, retry
               capture button) — render only when applicable. */}
          <HeaderAlerts d={detail} status={status} orderNumber={order.number} total={detail.total} />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 md:px-10 py-6 md:py-8 flex flex-col gap-4">

          {/* Two-column body. Same horizontal padding as the other studio
               pages (px-10) for visual consistency. Wide gap so the right
               metadata column reads as a separate region, not "the thing
               next to the items". On mobile we stack everything. */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12 items-start">
            {/* LEFT — transactional spine. Generous gap (gap-10 = 40px)
                 because sections are now flat: without card chrome to
                 carry separation, vertical rhythm has to do the work. */}
            <div className="flex flex-col gap-10 min-w-0">
              <ItemsSection d={detail} />
              {status !== "cancelled" && status !== "refunded" && status !== "payment_failed" && (
                <FulfillmentSection
                  d={detail}
                  status={status}
                  onStatusChange={onTransition}
                />
              )}
              <BuyerCommunicationsSection
                d={detail}
                status={status}
                log={emailLog}
                onCompose={(t) => setComposeType(t)}
              />
              <TimelineSection d={detail} />
              {status !== "refunded" && status !== "cancelled" && status !== "payment_failed" && (
                <RefundFlow
                  d={detail}
                  onRefund={() => onTransition("refunded")}
                />
              )}
              {/* Cancel & refund — only sensible pre-shipment. After the
                   item is on its way, the regular Refund flow handles the
                   "I want to take this back" case. Sits as a quiet
                   destructive link below the Refund flow, not promoted. */}
              {status === "new" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onTransition("cancelled")
                      toast.add({
                        type: "warning",
                        title: "Order cancelled — full refund issued",
                        data: {
                          actionLabel: "Undo",
                          onAction: () => onTransition("new"),
                        },
                      } as never)
                    }}
                    className="text-xsmall text-destructive hover:underline underline-offset-3"
                  >
                    Cancel & refund this order
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT — metadata column. Flat blocks with section labels;
                 no boxes — chrome was too heavy for the kind of content.
                 `md:top-8` matches the parent's `md:py-8` so the column pins
                 immediately at its natural offset (no "scroll a bit, then
                 stick" intermediate state). */}
            <div className="flex flex-col gap-8 md:sticky md:top-8 md:self-start">
              <CustomerSection d={detail} order={order} status={status} />
              <AddressSection title="Shipping address" address={detail.shipping} />
              <AddressSection
                title="Billing address"
                address={detail.billing}
                sameAsShipping={detail.billingSameAsShipping}
              />
              <NotesSection
                d={detail}
                internalNote={internalNote}
                setInternalNote={setInternalNote}
              />
              <PaymentSection d={detail} status={status} />
            </div>
          </div>
        </div>
      </div>

      {/* Compose-email dialog — opens when artist clicks Compose & send /
           Resend on a row in BuyerCommunicationsSection. */}
      <ComposeEmailDialog
        type={composeType}
        order={order}
        detail={detail}
        log={emailLog}
        open={composeType !== null}
        onOpenChange={(v) => { if (!v) setComposeType(null) }}
        onSend={(type, message) => {
          markSent(type, message)
          toast.add({
            type: "success",
            title: `${getEmailMeta(type).toast}`,
            description: `To ${detail.email}`,
          } as never)
        }}
      />
    </div>
  )
}

function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"][n % 100 < 11 || n % 100 > 13 ? Math.min(n % 10, 4) : 0] ?? "th"
  return `${n}${suffix}`
}
