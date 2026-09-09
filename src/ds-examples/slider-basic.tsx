"use client"

/*
 * Slider — a controlled horizontal slider with its value read out, an
 * uncontrolled one, a disabled one, and the vertical 75px form the player
 * bar's volume pill renders (`player-bar-b.tsx:225–233`), `!` overrides and
 * all. `onValueChange` hands back `number | number[]`; the `Array.isArray`
 * guard is how a single value is read, not a cast.
 */

import { useState } from "react"

import { Slider } from "@/components/ui/slider"

export default function SliderBasicExample() {
  const [volume, setVolume] = useState(62)

  return (
    <div className="flex flex-wrap items-start gap-10 w-full">
      <div className="flex flex-col gap-4 flex-1 min-w-60">
        <div className="flex items-center gap-3">
          <Slider
            value={[volume]}
            onValueChange={v => setVolume(Array.isArray(v) ? v[0] : v)}
            max={100}
            step={1}
            aria-label="Volume"
          />
          <span className="w-8 text-right text-xsmall tabular-nums text-muted-foreground">{volume}</span>
        </div>
        <Slider defaultValue={[30]} max={100} step={1} aria-label="Uncontrolled" />
        <Slider defaultValue={[45]} max={100} step={1} disabled aria-label="Disabled" />
      </div>

      <Slider
        orientation="vertical"
        value={[volume]}
        onValueChange={v => setVolume(Array.isArray(v) ? v[0] : v)}
        min={0}
        max={100}
        aria-label="Volume level"
        className="h-[75px]! min-h-0! [&_[data-slot=slider-control]]:min-h-0!"
      />
    </div>
  )
}
