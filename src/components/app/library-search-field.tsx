"use client"

/*
 * LibrarySearchField — the desktop "search within my library" input, bound
 * to the shared `useLibraryFilter` store. Dropped into each library view's
 * toolbar; the active view filters its list by the same query. (On mobile
 * the equivalent field lives in the Library header.)
 *
 * `w-40 grow max-w-56`: 160px is what the toolbar measures when it decides
 * whether everything fits on one line, 224px is what the field takes when
 * there is room. At a fixed 224 it pushed the filter chips into a scroll box
 * at a 733px window, with the last chip (then "Offline", now "Local") cut in half behind it.
 */

import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useLibraryFilter } from "@/lib/use-library-filter"

export function LibrarySearchField({ className }: { className?: string }) {
  const [q, setQ] = useLibraryFilter()
  return (
    <div className={`relative w-40 grow max-w-56 ${className ?? ""}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search library"
        aria-label="Search library"
        size="default"
        className="pl-10 pr-9"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          aria-label="Clear"
          className="state-fade absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
