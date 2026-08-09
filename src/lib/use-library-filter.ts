"use client"

/*
 * useLibraryFilter — the "search within my library" query, shared across the
 * library surfaces so ONE field filters whichever section is showing:
 *
 *   · Mobile → the "Search your library" field in the Library header.
 *   · Desktop → the LibrarySearchField in each view's toolbar.
 *
 * In-memory (transient, not persisted): a library filter is a momentary
 * "find X in my stuff", not a preference to remember between sessions. Kept
 * in a module store (not the URL) so typing doesn't spam history, and so the
 * query carries across sub-sections (Playlists → Albums) — the field shows
 * it, so it's never a hidden filter.
 */

import { useCallback, useSyncExternalStore } from "react"

let query = ""
const listeners = new Set<() => void>()

function emit() { listeners.forEach(l => l()) }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
function getSnapshot() { return query }

/** Set the shared query (also callable outside React, e.g. on route change). */
export function setLibraryQuery(next: string) {
  if (next === query) return
  query = next
  emit()
}

export function useLibraryFilter(): [string, (q: string) => void] {
  const q = useSyncExternalStore(subscribe, getSnapshot, () => "")
  const set = useCallback((next: string) => setLibraryQuery(next), [])
  return [q, set]
}

/** True if `query` is empty or appears (case-insensitive) in any field. */
export function matchesLibraryQuery(q: string, ...fields: (string | undefined | null)[]): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return fields.some(f => f?.toLowerCase().includes(needle))
}
