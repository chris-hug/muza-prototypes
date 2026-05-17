"use client"

/*
 * SortButton — secondary pill button that opens a DropdownMenu of
 * sort options. Used above any list/grid that needs to be re-ordered
 * (Discography, Library, Orders…).
 *
 * Anatomy: [↕ icon]  current-label  [⌄ icon]   →   menu of options
 *
 * The trigger uses the project's <Button> via base-ui's `render`
 * prop so styling stays in lockstep with every other secondary pill.
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

export interface SortOption<V extends string = string> {
  value: V
  label: string
}

export interface SortButtonProps<V extends string = string> {
  value:    V
  options:  ReadonlyArray<SortOption<V>>
  onChange: (next: V) => void
  /** Optional override — defaults to the selected option's label. */
  label?:     string
  className?: string
  align?:     "start" | "center" | "end"
}

export function SortButton<V extends string = string>({
  value, options, onChange, label, className, align = "start",
}: SortButtonProps<V>) {
  const current = options.find(o => o.value === value)
  const display = label ?? current?.label ?? "Sort"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className={cn("font-normal", className)} />}>
        <ArrowUpDown strokeWidth={1.5} />
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
