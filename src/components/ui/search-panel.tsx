"use client"

/*
 * SearchPanel — the dropdown shown while the search field is focused.
 *
 *   · empty query  → "Your recent searches" (clock-icon rows, removable)
 *   · typing       → plain-text autosuggestions (search-icon rows)
 *
 * Presentational + self-sourcing: it reads recent searches / suggestions
 * from `search-catalog` and calls `onPick(query)` when a row is chosen.
 * The host positions it (anchored under the desktop search field, or
 * inline below the mobile search bar). Figma: file dbSHgvquI2o4TFie2iAJxv
 * › 3749:112801.
 *
 * `onMouseDown` is suppressed on the surface so clicking a row doesn't
 * blur the input first (which would close the panel before the click).
 */

import { Clock, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useRecentSearches, suggest, removeRecentSearch,
} from "@/lib/search-catalog"

export function SearchPanel({
  query, onPick, className,
}: {
  query: string
  onPick: (q: string) => void
  className?: string
}) {
  const recents = useRecentSearches()
  const typing = query.trim().length > 0
  const suggestions = typing ? suggest(query) : []

  // Nothing to show (typed query with no suggestions) → render nothing so
  // the host can collapse the panel.
  if (typing && suggestions.length === 0) return null
  if (!typing && recents.length === 0) return null

  return (
    <div
      onMouseDown={e => e.preventDefault()}
      className={cn(
        "rounded-2xl border border-border bg-popover p-2 shadow-lg",
        className,
      )}
    >
      {!typing && (
        <p className="px-3 pt-2 pb-1 text-xsmall font-medium text-foreground">Your recent searches</p>
      )}
      <ul className="flex flex-col">
        {typing
          ? suggestions.map(s => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="group/srow flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base text-foreground transition-colors hover:bg-muted outline-none focus-visible:bg-muted"
                >
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate">{s}</span>
                </button>
              </li>
            ))
          : recents.map(s => (
              <li key={s} className="group/srow relative">
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 pr-10 text-left text-base text-foreground transition-colors hover:bg-muted outline-none focus-visible:bg-muted"
                >
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate">{s}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeRecentSearch(s)}
                  aria-label={`Remove “${s}” from recent searches`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover/srow:opacity-100 focus-visible:opacity-100 outline-none"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
      </ul>
    </div>
  )
}
