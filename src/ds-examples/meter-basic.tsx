"use client"

/*
 * Meter — a static, bounded measurement, three of them: a storage quota, a
 * password strength, a capacity that is nearly full. Each has a label on the
 * left and a readout on the right, then the track.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Meter` parts. `MeterValue` takes a render function so the readout can say
 * "Strong" or "12 GB / 100 GB" instead of the bare percentage.
 */

import {
  Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue,
} from "@/components/ui/meter"

const METERS = [
  { value: 12, label: "Storage used",      display: "12 GB / 100 GB" },
  { value: 78, label: "Password strength", display: "Strong" },
  { value: 96, label: "Capacity",          display: "Almost full" },
]

export default function MeterBasicExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      {METERS.map(m => (
        <Meter key={m.label} value={m.value}>
          <div className="flex items-baseline gap-3">
            <MeterLabel>{m.label}</MeterLabel>
            <MeterValue>{() => m.display}</MeterValue>
          </div>
          <MeterTrack>
            <MeterIndicator />
          </MeterTrack>
        </Meter>
      ))}
    </div>
  )
}
