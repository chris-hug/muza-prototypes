"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── InputSelect ──────────────────────────────────────────────────────────────
//
// A split input: text field on the left, Select dropdown on the right.
// Both share a single pill border — left side rounded-l-full, right side
// rounded-r-full — joined at the seam via -mr-px overlap.
//
// Usage:
//   <InputSelect
//     placeholder="1.00"
//     value={price}
//     onChange={e => setPrice(e.target.value)}
//     selectValue={currency}
//     onSelectChange={setCurrency}
//     options={[
//       { value: "USD", label: "USD" },
//       { value: "EUR", label: "EUR" },
//     ]}
//   />
// ─────────────────────────────────────────────────────────────────────────────

export interface InputSelectOption {
  value: string
  label: string
}

/* Same omission as `Input`: `size` here is the design-system ladder, not the
   native character-width attribute. */
interface InputSelectProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "sm" | "default" | "lg"
  selectValue: string
  onSelectChange: (value: string) => void
  options: InputSelectOption[]
  selectClassName?: string
}

function InputSelect({
  className,
  /* Declared in the props and never forwarded — the fused control ignored
     `size` entirely and always rendered whatever `Input` and `SelectTrigger`
     defaulted to. Passing it through is what makes the two halves agree at
     any step of the ladder, which is the whole point of fusing them. */
  size = "lg",
  selectValue,
  onSelectChange,
  options,
  selectClassName,
  ...inputProps
}: InputSelectProps) {
  return (
    <div className="flex">
      <Input
        size={size}
        className={cn(
          "rounded-r-none -mr-px focus-visible:z-10",
          className
        )}
        {...inputProps}
      />
      <Select value={selectValue} onValueChange={onSelectChange}>
        <SelectTrigger
          size={size}
          className={cn("rounded-l-none w-auto shrink-0", selectClassName)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { InputSelect }
