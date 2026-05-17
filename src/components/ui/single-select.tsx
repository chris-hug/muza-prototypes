"use client"

/*
 * SingleSelect — outline pill button that opens a single-select
 * DropdownMenu of options. The generic "pick one of N" pattern in
 * the design system, distinct from the form-field `Select`.
 *
 * Default use case: sort buttons above a list/grid (Discography,
 * Library, Orders). With a different `icon` it also works for any
 * other single-select trigger (filter mode, density, sort, …).
 *
 * Anatomy: [icon]  current-label  [⌄ chevron]   →   menu of options
 *
 * The trigger uses the project's <Button> via base-ui's `render`
 * prop so styling stays in lockstep with every other outline pill.
 */

import * as React from "react"
import { ArrowUpDown, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SingleSelectOption<V extends string = string> {
  value: V
  label: string
}

export interface SingleSelectProps<V extends string = string> {
  value:    V
  options:  ReadonlyArray<SingleSelectOption<V>>
  onChange: (next: V) => void
  /** Optional override — defaults to the selected option's label. */
  label?:     string
  /** Leading icon. Defaults to `ArrowUpDown` (the sort use case);
   *  pass `null` to render no icon. */
  icon?:      React.ReactNode | null
  className?: string
  align?:     "start" | "center" | "end"
}

export function SingleSelect<V extends string = string>({
  value, options, onChange, label, icon, className, align = "start",
}: SingleSelectProps<V>) {
  const current = options.find(o => o.value === value)
  const display = label ?? current?.label ?? ""
  const leadingIcon = icon === undefined ? <ArrowUpDown strokeWidth={1.5} /> : icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className={cn("font-normal", className)} />}>
        {leadingIcon}
        {display}
        <ChevronDown strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {options.map(o => (
          <DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
