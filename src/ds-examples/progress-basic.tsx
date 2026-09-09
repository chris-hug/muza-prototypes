"use client"

/*
 * Progress — the determinate bar for work in flight, at five values. The
 * first one carries a label and the value readout the way an upload row
 * would; the rest are bare bars with an `aria-label` instead.
 *
 * This file is a CALL SITE, not a copy: it imports and renders the real
 * `Progress`, which mounts its own track and indicator after `children`, so
 * a call site only ever adds the label and the value. The root wraps
 * (`flex-wrap`), which is what puts the label row above the full-width track.
 */

import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"

export default function ProgressBasicExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <Progress value={42}>
        <ProgressLabel>Uploading “Blue Train”</ProgressLabel>
        <ProgressValue />
      </Progress>
      {[100, 75, 25, 0].map(v => (
        <Progress key={v} value={v} aria-label={`${v} percent`} />
      ))}
    </div>
  )
}
