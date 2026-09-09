"use client"

/*
 * The size ladder, proved rather than described.
 *
 * Every control in a row is passed the SAME `size`, and nothing here sets a
 * height. If a row is ever ragged, a component has drifted off the ladder —
 * which is exactly how `ChipInput` was caught sitting at 46.5px while the rest
 * of the row was 40.
 *
 * `items-center` would hide that: a row of mismatched heights still looks
 * tidy when it is centred. `items-end` is deliberate — the controls sit on one
 * baseline, so a stray pixel shows up as a step instead of being split in two.
 */

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChipInput } from "@/components/ui/chip-input"
import { DatePicker } from "@/components/ui/date-picker"
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem } from "@/components/ui/combobox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { ControlSize } from "@/lib/control-size"

const STEPS: Array<{ size: ControlSize; label: string; px: string }> = [
  { size: "sm",      label: "sm",      px: "32px · text-2xsmall" },
  { size: "default", label: "default", px: "40px · text-small" },
  { size: "lg",      label: "lg",      px: "48px · text-small" },
]

function Row({ size }: { size: ControlSize }) {
  const [date, setDate] = useState<Date | undefined>()
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input size={size} placeholder="Field" className="w-[160px]" />
      <Select defaultValue="jazz">
        <SelectTrigger size={size} className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="jazz">Jazz</SelectItem>
          <SelectItem value="soul">Soul</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-[160px]">
        <DatePicker size={size} value={date} onChange={setDate} placeholder="Release date" />
      </div>
      <div className="w-[170px]">
        <Combobox>
          <ComboboxTrigger size={size} placeholder="Genre…" />
          <ComboboxContent>
            <ComboboxItem value="hard-bop">Hard bop</ComboboxItem>
            <ComboboxItem value="modal">Modal</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="w-[190px]">
        <ChipInput size={size} placeholder="Artists…" onCommit={() => {}} />
      </div>
      <Button size={size}>Save</Button>
      <Button size={size} variant="outline">Cancel</Button>
    </div>
  )
}

export default function ControlSizeLadderExample() {
  return (
    <div className="flex flex-col gap-8">
      {STEPS.map(({ size, label, px }) => (
        <div key={size} className="flex flex-col gap-2">
          <p className="text-2xsmall text-muted-foreground">
            <code className="font-mono px-1 rounded-sm bg-muted text-foreground">size=&quot;{label}&quot;</code>{" "}
            — {px}
          </p>
          <Row size={size} />
        </div>
      ))}
    </div>
  )
}
