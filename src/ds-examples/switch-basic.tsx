"use client"

/*
 * Switch — three labelled switches (on, off, `size="sm"`), a disabled one,
 * and the real "Keep private" setting row from the create-playlist form:
 * label leading, switch trailing at `justify-end`, the whole `<label>` a
 * click target. Real component, uncontrolled where nothing needs the value.
 */

import { useState } from "react"
import { Lock } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const ROWS = [
  { id: "sw-quality", label: "High quality audio", on: true },
  { id: "sw-offline", label: "Offline mode" },
  { id: "sw-small",   label: "Compact (size=\"sm\")", on: true, size: "sm" as const },
  { id: "sw-off",     label: "Unavailable", disabled: true },
]

export default function SwitchBasicExample() {
  const [keepPrivate, setKeepPrivate] = useState(false)

  return (
    <div className="flex flex-col gap-8 w-full max-w-md">
      <div className="flex flex-col gap-4">
        {ROWS.map(({ id, label, on, size, disabled }) => (
          <div key={id} className="flex items-center gap-3">
            <Switch id={id} defaultChecked={on} size={size} disabled={disabled} />
            <Label htmlFor={id} className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>{label}</Label>
          </div>
        ))}
      </div>

      {/* create-playlist-dialog.tsx:196–202 */}
      <label className="flex w-full items-center justify-end gap-3 cursor-pointer">
        <span className="text-foreground text-small flex items-center gap-2 font-medium">
          <Lock className="size-4" />
          Keep private
        </span>
        <Switch checked={keepPrivate} onCheckedChange={setKeepPrivate} />
      </label>
    </div>
  )
}
