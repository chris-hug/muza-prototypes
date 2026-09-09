"use client"

/*
 * Checkout Card — two receipts from the Purchases hub: a checkout whose cart
 * spanned three shops (three fulfillment rows with mixed statuses under one
 * date and total), and one whose payment failed, so the single "Update
 * payment" recovery button sits in the header strip.
 *
 * This file is a CALL SITE, not a copy: it renders the real `CheckoutCard`
 * off the hub's own `CHECKOUTS` records. In the app a row opens
 * `PurchaseDetailView` and the product / payment handlers toast placeholders;
 * here all three are no-ops.
 */

import { CheckoutCard, CHECKOUTS } from "@/components/app/purchases-view"

const MULTI_SHOP     = CHECKOUTS.find(c => c.id === "c03")!   // three shops, one charge
const PAYMENT_FAILED = CHECKOUTS.find(c => c.id === "c04")!   // recovery CTA in the header

export default function CheckoutCardBasicExample() {
  return (
    <div className="flex flex-col gap-4">
      {[MULTI_SHOP, PAYMENT_FAILED].map(c => (
        <CheckoutCard
          key={c.id}
          checkout={c}
          onOpenFulfillment={() => {}}
          onProductClick={() => {}}
          onUpdatePayment={() => {}}
        />
      ))}
    </div>
  )
}
