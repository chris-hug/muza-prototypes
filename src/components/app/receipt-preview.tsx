"use client"

/*
 * ReceiptPreview — the system-rendered receipt block that gets appended
 * to the buyer's order-confirmation email. Visible inside the seller's
 * Compose & send dialog so the artist can see exactly what the buyer
 * will receive below their personal message.
 *
 * Muza is the marketplace facilitator (Etsy / Bandcamp / Discogs model),
 * so this receipt is issued in *Muza's* legal name with a *Muza* receipt
 * number — separate from the per-shop order number the artist sees in
 * their Studio. The seller's shop name appears as context, not as the
 * tax-paper-issuer.
 */

import { MUZA_LEGAL, formatMuzaAddress, muzaReceiptNumber } from "@/lib/platform"
import { formatDate, formatTotal } from "@/components/app/orders-view"

// ─── Public types ────────────────────────────────────────────────────────────

export interface ReceiptItem {
  productTitle: string
  variant?:     string
  quantity:     number
  unitPrice:    number
}

export interface ReceiptAddress {
  name:        string
  line1:       string
  line2?:      string
  city:        string
  postalCode:  string
  country:     string
}

export interface ReceiptData {
  /** Buyer-facing per-shop order number (e.g. "#M-1042"). */
  orderNumber:     string
  /** ISO date of the order. */
  orderDate:       string
  /** Display name of the shop the items came from. */
  shopName:        string
  buyerName:       string
  buyerEmail:      string
  items:           ReceiptItem[]
  subtotal:        number
  discount?:       number
  discountCode?:   string
  shippingFee:     number
  tax:             number
  taxLabel:        string
  total:           number
  shipping:        ReceiptAddress
  billing:         ReceiptAddress
  billingSameAsShipping: boolean
}

// ─── ReceiptPreview ──────────────────────────────────────────────────────────

export function ReceiptPreview({ data }: { data: ReceiptData }) {
  const receiptNumber = muzaReceiptNumber(data.orderNumber, data.orderDate)
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* ── Receipt header ───────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border/60 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xsmall text-muted-foreground">
            Receipt from {MUZA_LEGAL.displayName}
          </p>
          <p className="text-base font-medium text-foreground tabular-nums mt-1">
            {receiptNumber}
          </p>
        </div>
        <div className="text-right text-2xsmall text-muted-foreground tabular-nums">
          <p>{formatDate(data.orderDate)}</p>
          <p className="mt-0.5">Order {data.orderNumber}</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">

        {/* ── Parties — buyer + shop side by side ──────────────── */}
        <div className="grid grid-cols-2 gap-4 text-xsmall">
          <div>
            <p className="font-medium text-foreground">Buyer</p>
            <p className="text-muted-foreground leading-snug mt-1">
              {data.buyerName}<br />
              {data.buyerEmail}
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Sold by</p>
            <p className="text-muted-foreground leading-snug mt-1">{data.shopName}</p>
          </div>
        </div>

        {/* ── Items list ──────────────────────────────────────── */}
        <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-xsmall">
              <div className="min-w-0">
                <p className="text-foreground truncate">{item.productTitle}</p>
                {item.variant && (
                  <p className="text-muted-foreground truncate">{item.variant}</p>
                )}
                <p className="text-muted-foreground tabular-nums">
                  {item.quantity} × {formatTotal(item.unitPrice)}
                </p>
              </div>
              <span className="text-foreground tabular-nums shrink-0">
                {formatTotal(item.quantity * item.unitPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Money breakdown ─────────────────────────────────── */}
        <div className="border-t border-border/60 pt-3 flex flex-col gap-0.5 text-xsmall tabular-nums">
          <BreakdownRow label="Subtotal" value={formatTotal(data.subtotal)} />
          {(data.discount ?? 0) > 0 && (
            <BreakdownRow
              label={`Discount${data.discountCode ? ` (${data.discountCode})` : ""}`}
              value={`−${formatTotal(data.discount!)}`}
            />
          )}
          <BreakdownRow
            label="Shipping"
            value={data.shippingFee === 0 ? "Free" : formatTotal(data.shippingFee)}
          />
          {data.tax > 0 && (
            <BreakdownRow label={`Tax · ${data.taxLabel}`} value={formatTotal(data.tax)} />
          )}
          <div className="mt-2 pt-2 border-t border-border/60 flex items-baseline justify-between">
            <span className="text-small font-medium text-foreground">Total</span>
            <span className="text-small font-medium text-foreground tabular-nums">
              {formatTotal(data.total)}
            </span>
          </div>
        </div>

        {/* ── Addresses ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-3 text-xsmall">
          <div>
            <p className="font-medium text-foreground">Ship to</p>
            <address className="not-italic text-muted-foreground leading-snug mt-1">
              {formatReceiptAddress(data.shipping)}
            </address>
          </div>
          <div>
            <p className="font-medium text-foreground">Billed to</p>
            <address className="not-italic text-muted-foreground leading-snug mt-1">
              {data.billingSameAsShipping
                ? "Same as shipping"
                : formatReceiptAddress(data.billing)}
            </address>
          </div>
        </div>

        {/* ── Muza legal footer ───────────────────────────────── */}
        {/* Per marketplace-facilitator model, the receipt is issued by
             Muza, not by the individual seller. Buyer's records show
             this block as the issuer's official details. */}
        <div className="border-t border-border/60 pt-3 text-2xsmall text-muted-foreground leading-relaxed">
          <p>
            Receipt issued by <span className="text-foreground font-medium">{MUZA_LEGAL.legalName}</span>,{" "}
            a {MUZA_LEGAL.entityType}.
          </p>
          <p>{formatMuzaAddress()}</p>
          <p className="mt-1">
            EIN {MUZA_LEGAL.ein} · Support:{" "}
            <a href={`mailto:${MUZA_LEGAL.supportEmail}`} className="text-foreground hover:underline underline-offset-3">
              {MUZA_LEGAL.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function formatReceiptAddress(a: ReceiptAddress): React.ReactNode {
  const lines = [
    a.name,
    a.line1,
    a.line2,
    `${a.postalCode} ${a.city}`.trim(),
    a.country,
  ].filter(Boolean) as string[]
  return lines.map((line, i) => (
    <span key={i} className="block">{line}</span>
  ))
}
