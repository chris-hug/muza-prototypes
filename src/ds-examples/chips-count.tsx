"use client"

/*
 * The header filter chip — `size="md"` (40px, level with a Button and a
 * Select in the same toolbar) with a `count` pill after the label. Shown in
 * the `ghost` variant, built for the Discography toolbar and retired when
 * its kind list outgrew a pill bar; `MobilePillTabs` uses the same
 * `size="md"` + `count` pair in the default variant today.
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
  return (
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
  )
}
