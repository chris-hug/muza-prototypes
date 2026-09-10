"use client"

/*
 * FileField — the three sizes, and what a chosen file looks like.
 *
 * A file picker is only interesting in two states, so the frame shows both:
 * empty, which is what everyone meets, and holding a name, which is the part
 * the native control cannot render at all. The middle one is live — pick
 * something and the field says so.
 *
 * A call site, not a copy: the real component, with the real `onChange`.
 */

import { useState } from "react"

import { FileField } from "@/components/ui/file-field"
import { Label } from "@/components/ui/label"

export default function FileFieldBasicExample() {
  const [name, setName] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6 w-full max-w-[520px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ff-live">ID for verification</Label>
        <FileField
          id="ff-live"
          label="Upload ID"
          accept=".jpg,.jpeg,.png,.pdf"
          fileName={name}
          onChange={e => setName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Holding a file</Label>
        <FileField label="Replace" fileName="passport-scan.pdf" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Smaller steps</Label>
        <div className="flex flex-col gap-2">
          <FileField size="default" label="Upload" />
          <FileField size="sm" label="Upload" />
        </div>
      </div>
    </div>
  )
}
