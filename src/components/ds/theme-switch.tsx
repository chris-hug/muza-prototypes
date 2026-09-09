"use client"

/*
 * ThemeSwitch — light ⇄ dark, for the design-system shell.
 *
 * It drives the app's own `ThemeProvider`: the same `.dark` class on <html>,
 * written to the same `muza-theme` key the product uses. So it is not a
 * preview — what you flip is the real thing, it survives a reload, and it
 * follows you back out into the prototype.
 *
 * A two-value `ToggleGroup`, not a `Switch`, and the same shape Settings uses.
 * The two states are named and equal; a switch would imply dark is "on" and
 * light is merely its absence.
 *
 * It belongs on this page more than on any other: every section is a claim
 * about how something looks, and half of those claims are only checkable in
 * the other mode.
 */

import { Moon, Sun } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { useTheme } from "@/components/app/theme-provider"

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={values => {
        const next = values[0]
        if (next) setTheme(next as "light" | "dark")
      }}
      aria-label="Theme"
      className={className}
    >
      <Toggle value="light" aria-label="Light mode" className="aspect-square px-0">
        <Sun className="size-[14px]" />
      </Toggle>
      <Toggle value="dark" aria-label="Dark mode" className="aspect-square px-0">
        <Moon className="size-[14px]" />
      </Toggle>
    </ToggleGroup>
  )
}
