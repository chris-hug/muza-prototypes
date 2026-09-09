"use client"

/*
 * Button — the seven variants, all at `default`.
 *
 * ONE size in the frame. A frame is for the thing you look AT: what a Button
 * is, in the size nine calls out of ten use. The ladder (lg · default · sm),
 * the icon-only set and the disabled/loading states are a catalogue — you
 * scan them, you do not study them — so they sit outside the frame, below.
 *
 * A call site, not a copy: the real `Button` with the real `variant` prop.
 */

import { Button } from "@/components/ui/button"

const VARIANTS = [
  { key: "default",         label: "Primary" },
  { key: "secondary",       label: "Secondary" },
  { key: "outline",         label: "Outline" },
  { key: "outline-primary", label: "Primary outline" },
  { key: "ghost",           label: "Ghost" },
  { key: "link",            label: "Link" },
  { key: "destructive",     label: "Destructive" },
] as const

export default function ButtonBasicExample() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {VARIANTS.map(v => (
        <Button key={v.key} variant={v.key}>{v.label}</Button>
      ))}
    </div>
  )
}
