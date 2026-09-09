"use client"

/*
 * Paywall, step two — the FREE MONTH variant (`freeTrial`). No amount picker
 * and no payment slot: there is nothing to charge today, so the step is the
 * offer, the contact field and a $0.00 total.
 *
 * Its own frame, beside the paid one rather than inside it: a person sees one
 * or the other, never both, and a frame that held the pair would be showing
 * its own two-column layout react to the width instead of the dialog's.
 */

import { SubscriptionCheckoutDialogPreview } from "@/components/app/subscription-dialogs"

export default function PaywallCheckoutFreeExample() {
  return <SubscriptionCheckoutDialogPreview freeTrial />
}
