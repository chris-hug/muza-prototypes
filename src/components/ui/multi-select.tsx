"use client"

/*
 * MultiSelect — pill trigger + base-ui `Menu` popup with CheckboxItems,
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
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { filterTriggerCls, FilterChevron, FilterCount } from "@/components/ui/filter-button"

export interface MultiSelectOption {
  value:    string
  /** Option label. Accepts ReactNode so callers can render the label
   *  alongside trailing chrome (count badge, icon, …) on one row. */
  label:    React.ReactNode
  disabled?: boolean
}

interface MultiSelectProps {
  label:    string
  options:  MultiSelectOption[]
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

export function MultiSelect({
  label, options, selected, onChange,
  searchable,
  searchPlaceholder = "Search…",
  maxOptionsHeight  = "max-h-52",
  clearLabel = "Clear all",
  minWidth   = "min-w-44",
  disabled,
}: MultiSelectProps) {
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
    ? options.filter(o =>
        (typeof o.label === "string" ? o.label : o.value)
          .toLowerCase()
          .includes(search.toLowerCase()))
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
            // Design-system rule: multi-select menus carry a left
            // checkbox (matches the standard form checkbox visual);
            // single-select menus use the right ✓. MultiSelect is
            // always multi-select, so it always renders the left
            // checkbox here.
            filtered.map(opt => (
              <DropdownMenuItem
                key={opt.value}
                disabled={opt.disabled}
                closeOnClick={false}
                onClick={() => toggle(opt.value)}
                className="gap-2"
              >
                <Checkbox
                  checked={selected.has(opt.value)}
                  // Visual only — the row's onClick already toggles.
                  // `pointer-events-none` so the underlying item
                  // owns the click + hover affordance.
                  className="pointer-events-none after:hidden"
                  tabIndex={-1}
                />
                {opt.label}
              </DropdownMenuItem>
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

