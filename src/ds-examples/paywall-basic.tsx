"use client"

/*
 * Paywall — the prompt's body, shown inline through
 * `SubscriptionPromptDialogPreview`. The real `PaywallContent`: it measures
 * its own box and goes two-column at 760px of dialog width, so the 1069 chip
 * shows the split and 768 shows the stack. The amount picker is live; the
 * CTA label follows it. Below a 768 window chip the preview takes the sheet
 * shape.
 */

import { SubscriptionPromptDialogPreview } from "@/components/app/subscription-dialogs"

export default function PaywallBasicExample() {
  return <SubscriptionPromptDialogPreview />
}
