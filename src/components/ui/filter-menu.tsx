"use client"

/*
 * FilterMenu — pill trigger + base-ui `Menu` popup with CheckboxItems,
 * optional search, and a clear-all row.
 *
 * Under the hood:
 *   · Trigger  → `Menu.Trigger`  (via our DropdownMenuTrigger wrapper)
 *   · Popup    → `Menu.Popup`    (via DropdownMenuContent)
 *   · Options  → `Menu.CheckboxItem` (uses `checked` + `onCheckedChange`)
 *   · Clear    → `Menu.Item`
 *
 * Selection is owned by the parent (`selected: Set<string>`,
 * `onChange: (next: Set<string>) => void`).
 *
 * Open state is **uncontrolled** — base-ui Menu handles it internally and
 * sets `aria-expanded` on the trigger automatically. We listen to
 * `onOpenChange` only to focus the search input when the menu opens.
 */

import { useRef, useState } from "react"
import { Search, X } from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"

export interface FilterOption {
  value:    string
  label:    string
  disabled?: boolean
}

interface FilterMenuProps {
  label:    string
  options:  FilterOption[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  /** Render a search input at the top; filters options client-side. */
  searchable?: boolean
  /** Placeholder shown in the search input. */
  searchPlaceholder?: string
  /** Max height of the options list when scrollable. */
  maxOptionsHeight?: string
  /** Label shown on the clear-all row. Defaults to "Clear all". */
  clearLabel?: string
  /** Override minimum width of the popup. */
  minWidth?: string
  /** Disable the trigger entirely. */
  disabled?: boolean
}

export function FilterMenu({
  label, options, selected, onChange,
  searchable,
  searchPlaceholder = "Search…",
  maxOptionsHeight  = "max-h-52",
  clearLabel = "Clear all",
  minWidth   = "min-w-44",
  disabled,
}: FilterMenuProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(next)
  }

  const active   = selected.size > 0
  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Focus + reset the search input whenever the menu opens / closes.
  const onOpenChange = (open: boolean) => {
    if (!open) setSearch("")
    else if (searchable) requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={filterTriggerCls(active)}
      >
        <span>{label}</span>
        <FilterCount count={selected.size} />
        <FilterChevron />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className={minWidth}>
        {searchable && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1 border-b border-border">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-xsmall outline-none text-foreground placeholder:text-muted-foreground min-w-0"
              // Prevent base-ui's typeahead / arrow-nav from consuming keys.
              onKeyDown={e => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        <div className={searchable ? `${maxOptionsHeight} overflow-y-auto` : undefined}>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xsmall text-muted-foreground">No results</p>
          ) : (
            filtered.map(opt => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={selected.has(opt.value)}
                disabled={opt.disabled}
                // `closeOnClick={false}` keeps the menu open for multi-select.
                closeOnClick={false}
                onCheckedChange={() => toggle(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>

        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange(new Set())}
              className="text-muted-foreground"
            >
              {clearLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

