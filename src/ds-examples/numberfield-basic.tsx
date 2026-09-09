"use client"

/*
 * QtyStepper — the − / count / + control — at both sizes, at a boundary,
 * disabled, and `block` in a grid cell beside an Input, the way a cart line
 * lays it out.
 *
 * This file is a CALL SITE, not a copy: it renders the real `QtyStepper`
 * with the props the cart and the refund flow pass. The component is
 * controlled — `value` + `onChange` — so each one here owns its number; the
 * clamping and the boundary disabling come from base-ui's NumberField.
 */

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QtyStepper } from "@/components/ui/qty-stepper"

export default function NumberFieldBasicExample() {
  const [qty, setQty]       = useState(2)
  const [capped, setCapped] = useState(5)
  const [refund, setRefund] = useState(1)
  const [line, setLine]     = useState(3)
  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} ariaLabel="quantity" />
        <QtyStepper value={capped} onChange={setCapped} max={5} ariaLabel="quantity, 5 in stock" />
        <QtyStepper value={2} onChange={() => {}} disabled ariaLabel="quantity" />
        <QtyStepper size="sm" value={refund} onChange={setRefund} min={0} max={9} ariaLabel="refund quantity" />
      </div>

      {/* The cart line — price and quantity share a 2 × 2 grid, so the
          stepper is `block` to match the price field's width. */}
      <div className="grid grid-cols-2 gap-2 items-start">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="qty-price">Price</Label>
          <Input id="qty-price" placeholder="24.00" inputMode="decimal" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Quantity</Label>
          <QtyStepper value={line} onChange={setLine} max={12} ariaLabel="quantity for this line" block />
        </div>
      </div>
    </div>
  )
}
