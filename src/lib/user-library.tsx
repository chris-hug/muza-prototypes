"use client"

/*
 * UserLibraryProvider — shared, app-level state for "what's in this
 * user's library and which items did they pay for". Lets surfaces
 * across the prototype (album detail page, library grid, etc.) read
 * the same source of truth without prop-drilling.
 *
 * Items are keyed by `albumId`. Two flags:
 *   · `added`     — in library at all (free add OR purchase)
 *   · `purchased` — money was exchanged. Purchased items are also added.
 *
 * Wire by mounting `<UserLibraryProvider>` once at the app shell.
 * Consumers use `useUserLibrary()` to read flags + call mutators.
 */

import {
  createContext, useCallback, useContext, useMemo, useState,
  type ReactNode,
} from "react"

interface LibraryEntry {
  added:     boolean
  purchased: boolean
  /** Tier picked at checkout — affects what actions are available
   *  later (download is only meaningful when tier === "download"). */
  tier?:     "stream" | "download"
}

interface UserLibraryContextValue {
  /** Returns the entry for an album id, or undefined if not in library. */
  entryFor: (albumId: string) => LibraryEntry | undefined
  isAdded:     (albumId: string) => boolean
  isPurchased: (albumId: string) => boolean
  /** Free add — listener taps the + on an album they don't own. */
  add:     (albumId: string) => void
  /** Money exchanged — auto-adds to library and marks purchased. */
  purchase: (albumId: string, tier: "stream" | "download") => void
  /** Upgrade an already-purchased stream-tier entry to download. */
  upgradeToDownload: (albumId: string) => void
  remove:  (albumId: string) => void
}

const UserLibraryContext = createContext<UserLibraryContextValue | null>(null)

export function UserLibraryProvider({
  /** Optional seed — surfaces that demo content (the library grid)
   *  can pre-populate so the prototype doesn't open empty. */
  seed,
  children,
}: {
  seed?:    Record<string, LibraryEntry>
  children: ReactNode
}) {
  const [entries, setEntries] = useState<Record<string, LibraryEntry>>(seed ?? {})

  const add = useCallback((albumId: string) => {
    setEntries(prev => ({
      ...prev,
      [albumId]: { ...prev[albumId], added: true, purchased: prev[albumId]?.purchased ?? false },
    }))
  }, [])

  const purchase = useCallback((albumId: string, tier: "stream" | "download") => {
    setEntries(prev => ({
      ...prev,
      [albumId]: { added: true, purchased: true, tier },
    }))
  }, [])

  const upgradeToDownload = useCallback((albumId: string) => {
    setEntries(prev => {
      const existing = prev[albumId]
      if (!existing) return prev
      return { ...prev, [albumId]: { ...existing, tier: "download" } }
    })
  }, [])

  const remove = useCallback((albumId: string) => {
    setEntries(prev => {
      const next = { ...prev }
      delete next[albumId]
      return next
    })
  }, [])

  const value = useMemo<UserLibraryContextValue>(() => ({
    entryFor:    (id) => entries[id],
    isAdded:     (id) => Boolean(entries[id]?.added),
    isPurchased: (id) => Boolean(entries[id]?.purchased),
    add,
    purchase,
    upgradeToDownload,
    remove,
  }), [entries, add, purchase, upgradeToDownload, remove])

  return (
    <UserLibraryContext.Provider value={value}>
      {children}
    </UserLibraryContext.Provider>
  )
}

export function useUserLibrary(): UserLibraryContextValue {
  const v = useContext(UserLibraryContext)
  if (!v) throw new Error("useUserLibrary must be used inside <UserLibraryProvider>")
  return v
}
