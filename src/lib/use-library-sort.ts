"use client"

/*
 * useLibrarySort — the sort preference for the mobile library lists,
 * persisted (localStorage) and shared across the All / Albums /
 * Playlists / Artists pages, the same way `useLibraryView` shares the
 * tile/list choice. Default: most-recently-added first.
 */

import { useSyncExternalStore } from "react"

export type LibrarySort = "added-desc" | "added-asc" | "title-az"

export const LIBRARY_SORTS: { value: LibrarySort; label: string }[] = [
  { value: "added-desc", label: "Recently added" },
  { value: "added-asc",  label: "Oldest first" },
  { value: "title-az",   label: "Alphabetical" },
]

const KEY = "muza:library-sort"
const VALID: LibrarySort[] = ["added-desc", "added-asc", "title-az"]

// Deterministic synthetic "added to library" timestamp, stable per
// title/name. Mirrors `addedInfo()` in media-list-table so the mobile
// sort order matches the desktop table's "Added" column exactly.
export function addedTs(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  h = Math.abs(h)
  const year  = 2023 + (h % 3)
  const month = h % 12
  const day   = 1 + ((h >> 4) % 28)
  return year * 10000 + month * 100 + day
}

// Comparator for the chosen sort. `title` doubles as the added-date
// seed (the same string the table hashes), so "Recently added" lines
// up with the table.
export function compareLibrary<T>(sort: LibrarySort, title: (x: T) => string) {
  return (a: T, b: T): number => {
    if (sort === "title-az") return title(a).localeCompare(title(b))
    const diff = addedTs(title(b)) - addedTs(title(a)) // newest first
    return sort === "added-asc" ? -diff : diff
  }
}

function read(): LibrarySort {
  if (typeof window === "undefined") return "added-desc"
  const v = window.localStorage.getItem(KEY) as LibrarySort | null
  return v && VALID.includes(v) ? v : "added-desc"
}

// Module-level store. The sort control and the lists live in different
// components, so a per-hook `useState` would give each its own copy and
// they'd never sync (the `storage` event only fires cross-tab). A shared
// store + useSyncExternalStore keeps every instance in this document in
// lockstep — change the menu, every list re-renders.
let current: LibrarySort = read()
const listeners = new Set<() => void>()

function setSort(v: LibrarySort) {
  if (!VALID.includes(v) || v === current) return
  current = v
  try { window.localStorage.setItem(KEY, v) } catch { /* private mode */ }
  listeners.forEach(l => l())
}

if (typeof window !== "undefined") {
  // Cross-tab sync.
  window.addEventListener("storage", e => {
    if (e.key === KEY && e.newValue && VALID.includes(e.newValue as LibrarySort)) {
      current = e.newValue as LibrarySort
      listeners.forEach(l => l())
    }
  })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useLibrarySort(): [LibrarySort, (v: LibrarySort) => void] {
  const value = useSyncExternalStore(subscribe, () => current, () => current)
  return [value, setSort]
}
