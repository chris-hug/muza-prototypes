"use client"

/*
 * Radio Card — the monetisation pair from the upload flow: a plain card and
 * one with a children band under the divider (the price input). Real
 * `RadioCardGroup` + `RadioCard`, wired the way every call site wires them:
 * the group's `value` / `onValueChange` AND each card's `selected` /
 * `onSelect`, both on one setter.
 */

import { useState } from "react"
import { Radio as RadioIcon, ShoppingBag } from "lucide-react"

import { Input } from "@/components/ui/input"
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card"

export default function RadioCardBasicExample() {
  const [monetization, setMonetization] = useState("streaming")

  return (
    <RadioCardGroup value={monetization} onValueChange={setMonetization}>
      <RadioCard
        value="streaming"
        selected={monetization === "streaming"}
        onSelect={() => setMonetization("streaming")}
        icon={<RadioIcon />}
        title="For streaming"
        description="Anyone on Muza can listen · per-stream royalties distributed monthly"
      />
      <RadioCard
        value="purchase"
        selected={monetization === "purchase"}
        onSelect={() => setMonetization("purchase")}
        icon={<ShoppingBag />}
        title="For purchase"
        description="Fans pay to unlock · you set your price"
      >
        <Input placeholder="Price, e.g. 12.00" aria-label="Price" />
      </RadioCard>
    </RadioCardGroup>
  )
}
