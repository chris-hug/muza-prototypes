"use client"

/*
 * Checkbox & Radio — the bare mark beside a `Label` (checked, unchecked,
 * disabled), `CheckboxField` with a description, and a `RadioGroup` — the
 * three shapes Settings uses, with Settings' own labels.
 *
 * Real components, uncontrolled (`defaultChecked` / `defaultValue`) so what
 * you copy out compiles on its own. `Label htmlFor` → `id` is what makes
 * the text a click target; a label without the pair is decoration.
 */

import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const CHECKS = [
  { id: "cb-terms",    label: "Accept terms & conditions", checked: true },
  { id: "cb-explicit", label: "Explicit content" },
  { id: "cb-off",      label: "Unavailable option", disabled: true },
]

const QUALITY = [
  { value: "default", id: "rq-default", label: "Default — CD quality" },
  { value: "max",     id: "rq-max",     label: "Max — up to 24-bit, 192 kHz" },
]

export default function CheckboxBasicExample() {
  return (
    <div className="flex flex-wrap gap-12 items-start">
      <div className="flex flex-col gap-3">
        {CHECKS.map(({ id, label, checked, disabled }) => (
          <div key={id} className="flex items-center gap-2.5">
            <Checkbox id={id} defaultChecked={checked} disabled={disabled} />
            <Label htmlFor={id} className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>{label}</Label>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <CheckboxField
          id="cf-release-notes"
          label="Official muza release notes"
          description="Get informed about new features, improvements and updates"
          defaultChecked
        />
        <CheckboxField
          id="cf-marketing"
          label="Marketing emails"
          description="Receive tips, promotions and product updates from Muza."
        />
      </div>

      <RadioGroup defaultValue="default" aria-label="Audio quality">
        {QUALITY.map(({ value, id, label }) => (
          <div key={id} className="flex items-center gap-2.5">
            <RadioGroupItem value={value} id={id} />
            <Label htmlFor={id} className="cursor-pointer">{label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
