"use client"

/*
 * The filter chip with a `count` pill after the label, at BOTH steps — the
 * pair is the point: the count follows the chip's own size, `pill` (20px,
 * 17px numeral) on `md` and `pill-sm` (18px, 15px) on `sm`, so the number
 * never outsizes the label it belongs to.
 *
 * `md` (40px) is the toolbar step, level with a Button and a Select in the
 * same row — built for the Discography toolbar, retired when its kind list
 * outgrew a pill bar. `sm` (32px) is what `MobilePillTabs` renders on a
 * phone, where three `md` pills measured 458px against a 375px screen.
 *
 * This file is a CALL SITE, not a copy: it renders the real `Chip`; the
 * count is the `Badge` `count` variant, which owns its own colours in both
 * the resting and the selected state.
 */

import { useState } from "react"

import { Chip, ChipGroup } from "@/components/ui/chip"

const KINDS = [
  { id: "all",       label: "All Releases",   count: 32 },
  { id: "album",     label: "Albums",         count: 10 },
  { id: "single-ep", label: "Singles & EPs",  count: 8 },
  { id: "remix",     label: "Remixes",        count: 2 },
] as const

export default function ChipsCountExample() {
  const [active, setActive] = useState<typeof KINDS[number]["id"]>("all")
  const [phone, setPhone]   = useState<typeof KINDS[number]["id"]>("all")
  return (
    <div className="flex flex-col gap-4">
      <ChipGroup>
        {KINDS.map(k => (
          <Chip
            key={k.id}
            size="md"
            variant="ghost"
            count={k.count}
            selected={active === k.id}
            onClick={() => setActive(k.id)}
          >
            {k.label}
          </Chip>
        ))}
      </ChipGroup>
      {/* The phone step, in the default variant it actually ships in. */}
      <ChipGroup>
        {KINDS.map(k => (
          <Chip
            key={k.id}
            size="sm"
            count={k.count}
            selected={phone === k.id}
            onClick={() => setPhone(k.id)}
          >
            {k.label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}
