"use client"

/*
 * ToggleGroup in the three shapes the app uses it: the grid ⇄ list view
 * switch (icon-only, library toolbars and the Artist discography), the search
 * scope switch (text, Search results and the mobile search header), and the
 * theme picker (icon-only, Settings). Plus `multiple`, which the app does not
 * use yet.
 *
 * This file is a CALL SITE, not a copy: it renders the real `ToggleGroup` and
 * `Toggle` with the same props the app passes — `value` is an ARRAY even for
 * single-select, and every handler guards `v[0]` because pressing the active
 * item again would otherwise deselect to `[]`.
 */

import { useState } from "react"
import { LayoutGrid, List, Moon, Sun } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"

export default function ToggleGroupBasicExample() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [scope, setScope] = useState<"catalog" | "library">("catalog")
  const [theme, setTheme] = useState<"light" | "dark">("light")

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* View mode — as `LibraryViewToggle` in media-list-table.tsx */}
      <ToggleGroup
        size="sm"
        value={[view]}
        onValueChange={v => { if (v[0]) setView(v[0] as typeof view) }}
        aria-label="View mode"
      >
        <Toggle value="grid" aria-label="Tile view"><LayoutGrid className="size-3.5" /></Toggle>
        <Toggle value="list" aria-label="List view"><List className="size-3.5" /></Toggle>
      </ToggleGroup>

      {/* Search scope — as search-results-view.tsx */}
      <ToggleGroup
        size="sm"
        value={[scope]}
        onValueChange={v => { if (v[0]) setScope(v[0] as typeof scope) }}
        aria-label="Search scope"
      >
        <Toggle value="catalog">Muza Catalog</Toggle>
        <Toggle value="library">My Library</Toggle>
      </ToggleGroup>

      {/* Theme — as settings-view.tsx: `aspect-square px-0` squares the item */}
      <ToggleGroup
        value={[theme]}
        onValueChange={v => { if (v[0]) setTheme(v[0] as typeof theme) }}
        aria-label="Theme"
      >
        <Toggle value="light" aria-label="Light mode" className="aspect-square px-0"><Sun className="size-[14px]" /></Toggle>
        <Toggle value="dark" aria-label="Dark mode" className="aspect-square px-0"><Moon className="size-[14px]" /></Toggle>
      </ToggleGroup>

      {/* Multi-select — any combination may be pressed */}
      <ToggleGroup multiple defaultValue={["bold"]} aria-label="Formatting">
        <Toggle value="bold" className="aspect-square px-0 font-medium">B</Toggle>
        <Toggle value="italic" className="aspect-square px-0 italic">I</Toggle>
        <Toggle value="underline" className="aspect-square px-0 underline">U</Toggle>
      </ToggleGroup>
    </div>
  )
}
