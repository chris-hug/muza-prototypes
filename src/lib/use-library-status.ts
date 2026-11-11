"use client"

/*
 * useLibraryStatus — which status filter (All / Owned / Local …) each
 * library page is showing. Module state rather than `useState`, because a
 * library view unmounts when you open an album: with local state the filter
 * was gone by the time you came back, so browsing your Local albums meant
 * picking Local again after every single one. Per page, and only for this
 * visit (not persisted): reopening the app should start from everything.
 */

import { useSyncExternalStore } from "react"

type Scope = "library" | "albums" | "songs" | "playlists"

const current: Record<Scope, string> = { library: "all", albums: "all", songs: "all", playlists: "all" }
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useLibraryStatus<T extends string>(scope: Scope): [T, (v: T) => void] {
  const value = useSyncExternalStore(subscribe, () => current[scope], () => "all")
  const set = (v: T) => {
    current[scope] = v
    listeners.forEach(l => l())
  }
  return [value as T, set]
}
