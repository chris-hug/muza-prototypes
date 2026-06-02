"use client"

/*
 * useLibraryView — the tile/list preference for the library pages, as a
 * single app-wide choice: remembered between visits (localStorage) and
 * shared across Albums + Playlists, so "I prefer lists" applies once
 * rather than per-page-per-session. Each page reads the persisted value
 * on mount; switching pages carries the choice over.
 */

import { useEffect, useState } from "react"

export type LibraryView = "grid" | "list"

const KEY = "muza:library-view"

function read(): LibraryView {
  if (typeof window === "undefined") return "grid"
  return window.localStorage.getItem(KEY) === "list" ? "list" : "grid"
}

export function useLibraryView(): [LibraryView, (v: LibraryView) => void] {
  const [view, setView] = useState<LibraryView>(read)

  useEffect(() => {
    try { window.localStorage.setItem(KEY, view) } catch { /* private mode */ }
  }, [view])

  // Keep multiple library pages (and tabs) in sync if one changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "grid" || e.newValue === "list")) setView(e.newValue)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return [view, setView]
}
