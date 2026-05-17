"use client"

/*
 * RefundFlow — shared collapsed→expanded refund surface used on both
 * the buyer purchase detail (mode = "request") and the seller order
 * detail (mode = "issue").
 *
 * Buyer side asks the seller to refund — there's no money-moving
 * authority, so the form doesn't preview a refund total. Seller side
 * actually issues the refund, so quantities + shipping toggle drive a
 * running total that lands on the destructive confirm button.
 *
 * Both modes share:
 *   · Collapsed trigger row (hairline border-y, headline + supporting copy,
 *     single button)
 *   · Per-line item picker via QtyStepper (max = remaining refundable qty)
 *   · Reason textarea (required on buyer, optional on seller)
 *   · Footer with cancel (ghost) + destructive confirm
 *
 * Seller mode adds the "Also refund shipping" CheckboxField above the
 * reason field. Buyer mode hides it entirely.
 */

import { useState } from "react"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { CheckboxField } from "@/components/ui/checkbox"
import { Section } from "@/components/app/section"
import { formatTotal } from "@/components/app/orders-view"

// ─── Public types ────────────────────────────────────────────────────────────

export interface RefundItem {
  image:        string
  title:        string
  /** Used by seller mode to compute a live refund total. Buyer mode
   *  may pass 0 since the buyer doesn't dictate the amount. */
  unitPrice:    number
  /** Max refundable quantity for this line. */
  quantity:     number
  /** Already-refunded qty (carry-over from previous partial refunds).
   *  Subtracted from `quantity` for the stepper max. Seller-side only. */
  refundedQty?: number
}

export interface RefundSubmitPayload {
  quantities:      number[]
  reason:          string
  /** Seller mode only — whether to refund the shipping line too. */
  refundShipping?: boolean
  /** Seller mode only — the live refund total at the moment of submit. */
  refundAmount?:   number
  totalQty:        number
}

interface RefundFlowProps {
  mode:        "request" | "issue"
  items:       RefundItem[]
  /** Seller-mode only — enables the "Also refund shipping" checkbox. */
  shippingFee?: number
  onSubmit:    (payload: RefundSubmitPayload) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RefundFlow({ mode, items, shippingFee = 0, onSubmit }: RefundFlowProps) {
  const isRequest = mode === "request"

  const [open, setOpen]       = useState(false)
  const [qty, setQty]         = useState<number[]>(items.map(() => 0))
  const [reason, setReason]   = useState("")
  const [refundShipping, setRefundShipping] = useState(true)

  const totalQty   = qty.reduce((s, n) => s + n, 0)
  const itemsTotal = items.reduce((s, item, i) => s + item.unitPrice * qty[i], 0)
  const shippingPart  = !isRequest && refundShipping ? shippingFee : 0
  const refundAmount  = Math.round((itemsTotal + shippingPart) * 100) / 100

  // Buyer requires a reason (the seller needs context to approve);
  // seller can refund silently if they want.
  const canSubmit = isRequest
    ? totalQty > 0 && reason.trim().length > 0
    : refundAmount > 0

  const reset = () => { setQty(items.map(() => 0)); setReason(""); setRefundShipping(true) }
  const close = () => { setOpen(false); reset() }
  const submit = () => {
    onSubmit({
      quantities:     qty,
      reason:         reason.trim(),
      refundShipping: isRequest ? undefined : refundShipping,
      refundAmount:   isRequest ? undefined : refundAmount,
      totalQty,
    })
    close()
  }

  // ─── Collapsed trigger row ────────────────────────────────────────
  if (!open) {
    return (
      <section>
        <div className="flex items-center justify-between gap-4 py-4 border-y border-border/60">
          <div className="min-w-0">
            <p className="text-small font-medium text-foreground">
              {isRequest ? "Need a refund?" : "Issue a refund"}
            </p>
            <p className="text-xsmall text-muted-foreground mt-0.5">
              {isRequest
                ? "Request a refund within 30 days of delivery."
                : "Return part or all of this order to the buyer's original payment method."}
            </p>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)} className="shrink-0">
            {!isRequest && <RotateCcw className="size-4" />}
            {isRequest ? "Issue a refund" : "Refund"}
          </Button>
        </div>
      </section>
    )
  }

  // ─── Expanded form ────────────────────────────────────────────────
  return (
    <Section title={isRequest ? "Request a refund" : "Refund"}>
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => {
            const max = Math.max(0, item.quantity - (item.refundedQty ?? 0))
            return (
              <li key={i} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt=""
                  draggable={false}
                  className="size-10 rounded-sm object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-small text-foreground truncate">{item.title}</p>
                  <p className="text-xsmall text-muted-foreground tabular-nums">
                    {isRequest
                      ? `Up to ${max}`
                      : `${formatTotal(item.unitPrice)} · up to ${max}`}
                  </p>
                </div>
                <QtyStepper
                  size="sm"
                  value={qty[i]}
                  min={0}
                  max={max}
                  onChange={(n) => setQty(prev => prev.map((v, idx) => idx === i ? n : v))}
                  ariaLabel={`Refund quantity for ${item.title}`}
                />
              </li>
            )
          })}
        </ul>

        {!isRequest && shippingFee > 0 && (
          <CheckboxField
            id="refund-shipping"
            checked={refundShipping}
            onCheckedChange={(v) => setRefundShipping(v === true)}
            label={`Also refund shipping (${formatTotal(shippingFee)})`}
          />
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="refund-reason">
            Reason{isRequest ? "" : " (optional)"}
          </Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isRequest
              ? "Damaged sleeve, wrong pressing, didn't arrive…"
              : "Damaged in transit / customer changed mind / …"}
            rows={isRequest ? 3 : 2}
          />
        </div>

        {/* Footer — buyer-mode shows a supporting line on the left
             (seller SLA); seller-mode shows the running refund total. */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {isRequest ? (
            <p className="text-xsmall text-muted-foreground">
              The seller reviews refund requests within 3 business days.
            </p>
          ) : (
            <div>
              <p className="text-2xsmall text-muted-foreground">Refund amount</p>
              <p className="text-large font-medium text-foreground tabular-nums">
                {formatTotal(refundAmount)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="destructive" disabled={!canSubmit} onClick={submit}>
              {isRequest ? "Request refund" : `Refund ${formatTotal(refundAmount)}`}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
