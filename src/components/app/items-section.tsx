"use client"

/*
 * ItemsSection — shared product-list + money-breakdown card used on
 * both the buyer-side purchase detail and the seller-side order detail.
 *
 * Same component, different content. Each line takes a normalized
 * shape: image, title, optional subtitle (variant / format), optional
 * meta (SKU), and unitPrice × quantity. The right-side price column
 * collapses to a single value at qty=1 and expands to "unit × qty" +
 * line total at qty>1 — that recipe came from the seller side, which
 * had the more refined treatment.
 *
 * The breakdown supports optional discount + tax with a label slot so
 * the seller side can show "Tax · 8% FR VAT" while the buyer side
 * simply hides the row when tax is 0. Total is always shown.
 */

import { Section } from "@/components/app/section"
import { formatTotal } from "@/components/app/orders-view"

// ─── Public types ────────────────────────────────────────────────────────────

export interface ItemLine {
  image:     string
  title:     string
  /** Second line — variant on seller side, format/type on buyer side. */
  subtitle?: string
  /** Third line — SKU, batch code, etc. Skipped when missing. */
  meta?:     string
  unitPrice: number
  quantity:  number
}

export interface ItemsBreakdown {
  subtotal:      number
  discount?:     number
  discountCode?: string
  shipping:      number
  tax?:          number
  taxLabel?:     string
  total:         number
}

// ─── ItemsSection ────────────────────────────────────────────────────────────

export function ItemsSection({
  items, breakdown, title = "Items",
}: {
  items:     ItemLine[]
  breakdown: ItemsBreakdown
  title?:    string
}) {
  return (
    <Section title={title} boxed>
      {/* Lighter inter-item divider — items are visually separable by their
           thumbnails; the hard line was overkill. */}
      <div className="flex flex-col divide-y divide-border/60">
        {items.map((item, i) => (
          <ItemRow key={i} item={item} />
        ))}
      </div>

      {/* Money breakdown — softer top divider, the one between tax and total
           is also lighter so the total feels like a settled answer rather
           than a shouted conclusion. */}
      <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-0.5">
        <BreakdownRow label="Subtotal" value={formatTotal(breakdown.subtotal)} />
        {breakdown.discount && breakdown.discount > 0 && (
          <BreakdownRow
            label={`Discount${breakdown.discountCode ? ` (${breakdown.discountCode})` : ""}`}
            value={`−${formatTotal(breakdown.discount)}`}
          />
        )}
        <BreakdownRow
          label="Shipping"
          value={breakdown.shipping === 0 ? "Free" : formatTotal(breakdown.shipping)}
        />
        {breakdown.tax !== undefined && breakdown.tax > 0 && (
          <BreakdownRow
            label={breakdown.taxLabel ? `Tax · ${breakdown.taxLabel}` : "Tax"}
            value={formatTotal(breakdown.tax)}
          />
        )}
        <div className="mt-3 pt-3 border-t border-border/60 flex items-baseline justify-between gap-4">
          <span className="text-small font-medium text-foreground">Total</span>
          <span className="text-base font-medium text-foreground tabular-nums">
            {formatTotal(breakdown.total)}
          </span>
        </div>
      </div>
    </Section>
  )
}

// ─── Private row components ──────────────────────────────────────────────────

function ItemRow({ item }: { item: ItemLine }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
      <img
        src={item.image}
        alt=""
        draggable={false}
        className="size-14 rounded-sm object-cover shrink-0"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-small text-foreground truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xsmall text-muted-foreground truncate">{item.subtitle}</p>
        )}
        {item.meta && (
          <p className="text-2xsmall text-muted-foreground tabular-nums">{item.meta}</p>
        )}
      </div>
      <div className="text-right tabular-nums shrink-0">
        {/* qty=1 → single price (the "× 1" multiplier is noise).
             qty>1 → muted "$unit × N" caption + prominent line total. */}
        {item.quantity === 1 ? (
          <p className="text-small text-foreground">{formatTotal(item.unitPrice)}</p>
        ) : (
          <>
            <p className="text-2xsmall text-muted-foreground">
              {formatTotal(item.unitPrice)} × {item.quantity}
            </p>
            <p className="text-small text-foreground">
              {formatTotal(item.unitPrice * item.quantity)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-xsmall text-muted-foreground">{label}</span>
      <span className="text-small text-foreground tabular-nums">{value}</span>
    </div>
  )
}
