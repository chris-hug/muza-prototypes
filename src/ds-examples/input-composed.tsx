"use client"

/*
 * Input composed with its neighbours: beside a Button (the two share the
 * 40px height, so the row needs no fix), fused to a Select as `InputSelect`
 * — a price with its currency, a handle with its domain — and `Textarea`,
 * which mirrors the `hint` API but is a box, not a pill.
 *
 * This file is a CALL SITE, not a copy: these are the real components with
 * the props the app passes. `InputSelect` owns the seam (`-mr-px`, the two
 * half-radii); the call site only supplies the options and the value.
 */

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputSelect } from "@/components/ui/input-select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CURRENCIES = ["USD", "EUR", "GBP", "JPY"].map(c => ({ value: c, label: c }))
const DOMAINS    = [".com", ".io", ".co", ".org"].map(d => ({ value: d, label: d }))

export default function InputComposedExample() {
  const [currency, setCurrency] = useState("USD")
  const [domain, setDomain]     = useState(".com")
  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[300px]">
        <Label htmlFor="input-invite">With action</Label>
        <div className="flex gap-2 min-w-0">
          <Input id="input-invite" placeholder="Invite by email" />
          <Button size="lg">Invite</Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[300px]">
        <Label htmlFor="input-price">Price</Label>
        <InputSelect
          id="input-price"
          placeholder="1.00"
          inputMode="decimal"
          selectValue={currency}
          onSelectChange={setCurrency}
          options={CURRENCIES}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[300px]">
        <Label htmlFor="input-domain">Domain</Label>
        <InputSelect
          id="input-domain"
          placeholder="yourdomain"
          selectValue={domain}
          onSelectChange={setDomain}
          options={DOMAINS}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full @min-[560px]:w-[320px]">
        <Label htmlFor="input-bio">Textarea</Label>
        <Textarea
          id="input-bio"
          placeholder="Tell listeners about yourself…"
          rows={3}
          hint="Max 280 characters."
        />
      </div>
    </div>
  )
}
