"use client"

/*
 * DatePicker — two labelled fields, one empty and one pre-filled, plus a
 * disabled one. Click a trigger to open the real calendar popup; the frame
 * shows nothing static.
 *
 * The real component, controlled the way `vinyl-create-listing.tsx` controls
 * it: `value` in, `onChange` out (`undefined` from Clear). `Label htmlFor` →
 * `id` is what names the field — the trigger is a button, not an input.
 */

import { useState } from "react"

import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"

export default function DatePickerBasicExample() {
  const [releaseDate, setReleaseDate] = useState<Date | undefined>()
  const [startDate, setStartDate]     = useState<Date | undefined>(new Date(2026, 3, 14))

  return (
    <div className="flex flex-wrap gap-6 items-start">
      <div className="flex flex-col gap-1.5 w-60">
        <Label htmlFor="release-date">Release date</Label>
        <DatePicker id="release-date" value={releaseDate} onChange={setReleaseDate} placeholder="Pick a release date" />
      </div>

      <div className="flex flex-col gap-1.5 w-60">
        <Label htmlFor="start-date">Start date</Label>
        <DatePicker id="start-date" value={startDate} onChange={setStartDate} />
      </div>

      <div className="flex flex-col gap-1.5 w-60">
        <Label htmlFor="disabled-date">Disabled</Label>
        <DatePicker id="disabled-date" disabled placeholder="Pick a date" />
      </div>
    </div>
  )
}
