"use client"

/*
 * Paywall, LIVE — the real `SubscriptionPromptDialog` and
 * `SubscriptionCheckoutDialog` wired the way the album page wires them: the
 * prompt hands its picked amount to the checkout through `onSubscribe`, and
 * the second button opens the checkout directly (what Settings does). Below a
 * 768 window chip both open as bottom sheets.
 */

import { useState } from "react"

import {
  SubscriptionPromptDialog, SubscriptionCheckoutDialog,
} from "@/components/app/subscription-dialogs"
import { Button } from "@/components/ui/button"

export default function PaywallLiveExample() {
  const [promptOpen, setPromptOpen]     = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [amount, setAmount]             = useState("10")

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setPromptOpen(true)}>Open the paywall</Button>
      <Button variant="outline" onClick={() => setCheckoutOpen(true)}>Open the checkout directly</Button>

      <SubscriptionPromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onSubscribe={a => { setAmount(a); setCheckoutOpen(true) }}
      />
      <SubscriptionCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        initialAmount={amount}
      />
    </div>
  )
}
