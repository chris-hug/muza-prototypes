"use client"

/*
 * Paywall, step two — the PAID checkout: amount picker, contact, the Square
 * payment slot, and the total.
 *
 * One step per frame. The two variants used to sit side by side in a single
 * frame, which quietly made the demo lie twice: they are alternative steps a
 * person never sees together, and at a narrow chip the pair reflowed from two
 * columns to one — so what the width changed was the demo's own wrapper, not
 * the dialog. The free month has its own frame below.
 */

import { SubscriptionCheckoutDialogPreview } from "@/components/app/subscription-dialogs"

export default function PaywallCheckoutExample() {
  return <SubscriptionCheckoutDialogPreview />
}
