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

interface InputSelectProps extends React.ComponentProps<"input"> {
  selectValue: string
  onSelectChange: (value: string) => void
  options: InputSelectOption[]
  selectClassName?: string
}

function InputSelect({
  className,
  selectValue,
  onSelectChange,
  options,
  selectClassName,
  ...inputProps
}: InputSelectProps) {
  return (
    <div className="flex">
      <Input
        className={cn(
          "rounded-r-none -mr-px focus-visible:z-10",
          className
        )}
        {...inputProps}
      />
      <Select value={selectValue} onValueChange={onSelectChange}>
        <SelectTrigger
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
